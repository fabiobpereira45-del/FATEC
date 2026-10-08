import { type StudentProfile } from "@/lib/store"
import { apiRequest } from "@/lib/api-client"

export interface Book {
  id: string
  title: string
  subtitle?: string
  author: string
  publisher?: string
  publicationYear?: number | string
  isbn?: string
  category: string // Hermenêutica, Teologia Sistemática, História da Igreja, etc.
  coverUrl?: string
  synopsis: string
  totalCopies: number
  availableCopies: number
  locationShelf?: string // Ex: Estante A1, Prateleira 2
  poloId?: string | null // null = geral ou específico
  createdAt: string
}

export type LoanStatus = "reserved" | "active" | "returned" | "late" | "cancelled"

export interface BookLoan {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookCoverUrl?: string
  studentId: string
  studentName: string
  studentEmail?: string
  studentPhone?: string
  studentCpf?: string
  poloId?: string | null
  requestedAt: string
  borrowedAt?: string | null
  dueDate?: string | null // borrowedAt + 7 dias
  returnedAt?: string | null
  status: LoanStatus
  notes?: string
  registeredBy?: string
  renewed?: boolean
  cancelledAt?: string | null
  cancelledBy?: "student" | "admin" | null
  cancelReason?: string | null
}

// ─── Default Theological Categories ──────────────────────────────────────────
export const BOOK_CATEGORIES = [
  "Teologia Sistemática",
  "Hermenêutica e Exegese",
  "História da Igreja",
  "Liderança e Ministério Pastoral",
  "Homilética e Pregação",
  "Ética Cristã e Sociedade",
  "Missiologia e Evangelismo",
  "Pneumatologia",
  "Escatologia e Profecias",
  "Aconselhamento Bíblico",
  "Bibliologia e Cânon",
  "Geral / Espiritualidade"
]

// ─── Helper: Compute Loan Status & Overdue ─────────────────────────────────────
export function evaluateLoanStatus(loan: BookLoan): {
  isOverdue: boolean
  daysRemaining: number
  daysOverdue: number
  status: LoanStatus
} {
  if (loan.status === "returned") {
    return { isOverdue: false, daysRemaining: 0, daysOverdue: 0, status: "returned" }
  }

  if (loan.status === "cancelled") {
    return { isOverdue: false, daysRemaining: 0, daysOverdue: 0, status: "cancelled" }
  }

  if (loan.status === "reserved" && !loan.borrowedAt) {
    return { isOverdue: false, daysRemaining: 0, daysOverdue: 0, status: "reserved" }
  }

  if (!loan.dueDate) {
    return { isOverdue: false, daysRemaining: 7, daysOverdue: 0, status: loan.status }
  }

  const now = new Date().getTime()
  const due = new Date(loan.dueDate).getTime()
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      isOverdue: true,
      daysRemaining: 0,
      daysOverdue: Math.abs(diffDays),
      status: "late"
    }
  }

  return {
    isOverdue: false,
    daysRemaining: diffDays,
    daysOverdue: 0,
    status: "active"
  }
}

// ─── Public CRUD Methods ──────────────────────────────────────────────────────

export async function getBooks(filter?: {
  poloId?: string
  search?: string
  category?: string
}): Promise<Book[]> {
  const params = new URLSearchParams()
  if (filter?.poloId) params.set("poloId", filter.poloId)
  if (filter?.category) params.set("category", filter.category)
  if (filter?.search) params.set("search", filter.search)
  const qs = params.toString()
  const r = await apiRequest<{ data: Book[] }>(`/api/books${qs ? `?${qs}` : ""}`)
  return r.data
}

export async function saveBook(book: Partial<Book> & { title: string; author: string }): Promise<Book> {
  const r = await apiRequest<{ data: Book }>("/api/books", "POST", book)
  return r.data
}

export async function deleteBook(id: string): Promise<void> {
  await apiRequest(`/api/books?id=${id}`, "DELETE")
}

// ─── Loan Methods ─────────────────────────────────────────────────────────────

export async function getBookLoans(filter?: {
  studentId?: string
  status?: string
  poloId?: string
}): Promise<BookLoan[]> {
  const params = new URLSearchParams()
  if (filter?.studentId) params.set("studentId", filter.studentId)
  if (filter?.status) params.set("status", filter.status)
  if (filter?.poloId) params.set("poloId", filter.poloId)
  const qs = params.toString()
  const r = await apiRequest<{ data: BookLoan[] }>(`/api/book-loans${qs ? `?${qs}` : ""}`)
  // Reavalia o status (ex.: marca como "late" se o prazo já passou).
  return r.data.map(l => ({ ...l, status: evaluateLoanStatus(l).status }))
}

export async function requestBookLoan(book: Book, student: {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  poloId?: string | null
}): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>("/api/book-loans", "POST", {
    bookId: book.id, studentId: student.id, studentName: student.name, studentEmail: student.email,
    studentPhone: student.phone, studentCpf: student.cpf, poloId: student.poloId || book.poloId,
  })
  return r.data
}

export async function confirmPhysicalBorrow(loanId: string, registeredBy?: string): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>(`/api/book-loans/${loanId}`, "PATCH", { action: "confirmBorrow", registeredBy })
  return r.data
}

export async function returnBookLoan(loanId: string): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>(`/api/book-loans/${loanId}`, "PATCH", { action: "return" })
  return r.data
}

export async function cancelBookLoan(loanId: string): Promise<void> {
  await apiRequest(`/api/book-loans/${loanId}`, "PATCH", { action: "cancel" })
}

export async function cancelMyReservation(loanId: string, studentId: string): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>(`/api/book-loans/${loanId}`, "PATCH", { action: "cancelMine", studentId })
  return r.data
}

export async function renewBookLoan(loanId: string): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>(`/api/book-loans/${loanId}`, "PATCH", { action: "renew" })
  return r.data
}

// ─── Direct Admin Borrow (without student reservation) ────────────────────────
export async function directAdminBorrow(data: {
  book: Book
  student: StudentProfile
  registeredBy?: string
}): Promise<BookLoan> {
  const r = await apiRequest<{ data: BookLoan }>("/api/book-loans", "POST", {
    bookId: data.book.id, studentId: data.student.id, studentName: data.student.name,
    studentEmail: data.student.email, studentPhone: data.student.phone, studentCpf: data.student.cpf,
    poloId: data.student.polo_id || data.book.poloId, direct: true, registeredBy: data.registeredBy,
  })
  return r.data
}

// ─── WhatsApp Alert Message Generator ─────────────────────────────────────────
export function getWhatsAppOverdueLink(loan: BookLoan, daysOverdue: number): string | null {
  if (!loan.studentPhone) return null
  const cleanPhone = loan.studentPhone.replace(/\D/g, "")
  if (cleanPhone.length < 10) return null

  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
  const dueDateFormatted = loan.dueDate
    ? new Date(loan.dueDate).toLocaleDateString("pt-BR")
    : "data acordada"

  const text = encodeURIComponent(
    `Paz do Senhor, ${loan.studentName}! 📖\n\n` +
    `Aqui é da coordenação da Biblioteca da FATEC (Faculdade de Teologia e Cultura).\n\n` +
    `Identificamos que o empréstimo do livro *"${loan.bookTitle}"* venceu em ${dueDateFormatted} (há ${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"}).\n\n` +
    `Como o prazo de empréstimo gratuito para estudo é de 7 dias e há outros irmãos na fila de leitura, solicitamos com carinho a devolução do exemplar no seu polo para mantermos seu cadastro regular.\n\n` +
    `Deus abençoe seus estudos teológicos! 🙏`
  )

  return `https://wa.me/${formattedPhone}?text=${text}`
}
