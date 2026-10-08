import { pool } from "@/lib/db"

export interface BookInput {
  id?: string
  title: string
  subtitle?: string
  author: string
  publisher?: string
  publicationYear?: number | string
  isbn?: string
  category: string
  coverUrl?: string
  synopsis?: string
  totalCopies?: number
  availableCopies?: number
  locationShelf?: string
  poloId?: string | null
}

function toBook(r: any) {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    author: r.author,
    publisher: r.publisher ?? undefined,
    publicationYear: r.publication_year ?? undefined,
    isbn: r.isbn ?? undefined,
    category: r.category,
    coverUrl: r.cover_url ?? undefined,
    synopsis: r.synopsis ?? "",
    totalCopies: Number(r.total_copies ?? 1),
    availableCopies: Number(r.available_copies ?? 1),
    locationShelf: r.location_shelf ?? undefined,
    poloId: r.polo_id ?? null,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listBooks(filter?: { poloId?: string; category?: string; search?: string }) {
  const conditions: string[] = []
  const vals: unknown[] = []
  if (filter?.category && filter.category !== "all") {
    vals.push(filter.category)
    conditions.push(`category = $${vals.length}`)
  }
  if (filter?.poloId && filter.poloId !== "all") {
    vals.push(filter.poloId)
    conditions.push(`(polo_id = $${vals.length} or polo_id is null)`)
  }
  if (filter?.search) {
    vals.push(`%${filter.search}%`)
    conditions.push(`(title ilike $${vals.length} or author ilike $${vals.length} or publisher ilike $${vals.length} or category ilike $${vals.length})`)
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : ""
  const { rows } = await pool.query(`select * from books ${where} order by title asc`, vals)
  return rows.map(toBook)
}

export async function saveBook(book: BookInput) {
  if (book.id) {
    const { rows } = await pool.query(
      `update books set
         title=$1, subtitle=$2, author=$3, publisher=$4, publication_year=$5, isbn=$6,
         category=$7, cover_url=$8, synopsis=$9, total_copies=$10, available_copies=$11,
         location_shelf=$12, polo_id=$13
       where id = $14::uuid returning *`,
      [book.title, book.subtitle || null, book.author, book.publisher || null,
       String(book.publicationYear ?? ""), book.isbn || null, book.category, book.coverUrl || null,
       book.synopsis || "", book.totalCopies ?? 1, book.availableCopies ?? book.totalCopies ?? 1,
       book.locationShelf || null, book.poloId || null, book.id]
    )
    if (rows[0]) return toBook(rows[0])
  }
  const { rows } = await pool.query(
    `insert into books
       (title, subtitle, author, publisher, publication_year, isbn, category, cover_url,
        synopsis, total_copies, available_copies, location_shelf, polo_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *`,
    [book.title, book.subtitle || null, book.author, book.publisher || null,
     String(book.publicationYear ?? ""), book.isbn || null, book.category, book.coverUrl || null,
     book.synopsis || "", book.totalCopies ?? 1, book.availableCopies ?? book.totalCopies ?? 1,
     book.locationShelf || null, book.poloId || null]
  )
  return toBook(rows[0])
}

export async function deleteBook(id: string) {
  await pool.query("delete from books where id = $1::uuid", [id])
}

export async function getBook(id: string) {
  const { rows } = await pool.query("select * from books where id = $1::uuid", [id])
  return rows[0] ? toBook(rows[0]) : null
}

export async function adjustAvailableCopies(id: string, delta: number) {
  await pool.query(
    "update books set available_copies = greatest(0, least(total_copies, available_copies + $1)) where id = $2::uuid",
    [delta, id]
  )
}

// ── Empréstimos ──────────────────────────────────────────────────────────────

function toLoan(r: any) {
  return {
    id: r.id,
    bookId: r.book_id,
    bookTitle: r.book_title,
    bookAuthor: r.book_author,
    bookCoverUrl: r.book_cover_url ?? undefined,
    studentId: r.student_id,
    studentName: r.student_name,
    studentEmail: r.student_email ?? undefined,
    studentPhone: r.student_phone ?? undefined,
    studentCpf: r.student_cpf ?? undefined,
    poloId: r.polo_id ?? null,
    requestedAt: new Date(r.requested_at).toISOString(),
    borrowedAt: r.borrowed_at ? new Date(r.borrowed_at).toISOString() : null,
    dueDate: r.due_date ? new Date(r.due_date).toISOString() : null,
    returnedAt: r.returned_at ? new Date(r.returned_at).toISOString() : null,
    status: r.status,
    notes: r.notes ?? undefined,
    registeredBy: r.registered_by ?? undefined,
    renewed: r.renewed,
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
    cancelledBy: r.cancelled_by ?? null,
  }
}

export async function listBookLoans(filter?: { studentId?: string; status?: string; poloId?: string }) {
  const conditions: string[] = []
  const vals: unknown[] = []
  if (filter?.studentId) {
    vals.push(filter.studentId)
    conditions.push(`student_id = $${vals.length}::uuid`)
  }
  if (filter?.status && filter.status !== "all") {
    vals.push(filter.status)
    conditions.push(`status = $${vals.length}`)
  }
  if (filter?.poloId && filter.poloId !== "all") {
    vals.push(filter.poloId)
    conditions.push(`polo_id = $${vals.length}`)
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : ""
  const { rows } = await pool.query(`select * from book_loans ${where} order by requested_at desc`, vals)
  return rows.map(toLoan)
}

export async function getLoan(id: string) {
  const { rows } = await pool.query("select * from book_loans where id = $1::uuid", [id])
  return rows[0] ? toLoan(rows[0]) : null
}

interface LoanStudent { id: string; name: string; email?: string; phone?: string; cpf?: string; poloId?: string | null }

export async function checkBorrowEligibility(studentId: string, bookId: string) {
  const { rows } = await pool.query(
    `select book_id from book_loans
      where student_id = $1::uuid and status = 'returned' and returned_at is not null
      order by returned_at desc limit 1`,
    [studentId]
  )
  if (rows[0]?.book_id === bookId) {
    throw new Error("Você deve locar um material diferente antes de poder pegar este mesmo livro novamente.")
  }
}

export async function requestBookLoan(book: { id: string; title: string; author: string; coverUrl?: string; poloId?: string | null; availableCopies: number }, student: LoanStudent) {
  if (book.availableCopies <= 0) throw new Error("Não há exemplares deste livro disponíveis para empréstimo no momento.")
  await checkBorrowEligibility(student.id, book.id)

  const { rows } = await pool.query(
    `insert into book_loans
       (book_id, book_title, book_author, book_cover_url, student_id, student_name, student_email,
        student_phone, student_cpf, polo_id, status, renewed)
     values ($1::uuid,$2,$3,$4,$5::uuid,$6,$7,$8,$9,$10,'reserved',false) returning *`,
    [book.id, book.title, book.author, book.coverUrl || null, student.id, student.name,
     student.email || null, student.phone || null, student.cpf || null, student.poloId || book.poloId || null]
  )
  return toLoan(rows[0])
}

export async function confirmPhysicalBorrow(loanId: string, registeredBy?: string) {
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const { rows } = await pool.query(
    `update book_loans set borrowed_at = now(), due_date = $1, status = 'active', registered_by = $2
     where id = $3::uuid returning *`,
    [due.toISOString(), registeredBy || "Docente / Master", loanId]
  )
  if (!rows[0]) throw new Error("Empréstimo não encontrado.")
  await adjustAvailableCopies(rows[0].book_id, -1)
  return toLoan(rows[0])
}

export async function returnBookLoan(loanId: string) {
  const { rows } = await pool.query(
    "update book_loans set returned_at = now(), status = 'returned' where id = $1::uuid returning *",
    [loanId]
  )
  if (!rows[0]) throw new Error("Empréstimo não encontrado.")
  await adjustAvailableCopies(rows[0].book_id, 1)
  return toLoan(rows[0])
}

export async function cancelBookLoan(loanId: string) {
  await pool.query(
    "update book_loans set status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin' where id = $1::uuid",
    [loanId]
  )
}

export async function cancelMyReservation(loanId: string, studentId: string) {
  const loan = await getLoan(loanId)
  if (!loan) throw new Error("Reserva não encontrada.")
  if (loan.studentId !== studentId) throw new Error("Você só pode cancelar suas próprias reservas.")
  if (loan.status !== "reserved") throw new Error("Esta reserva já foi processada e não pode mais ser cancelada pelo aluno.")

  const { rows } = await pool.query(
    "update book_loans set status = 'cancelled', cancelled_at = now(), cancelled_by = 'student' where id = $1::uuid returning *",
    [loanId]
  )
  return toLoan(rows[0])
}

export async function renewBookLoan(loanId: string) {
  const loan = await getLoan(loanId)
  if (!loan) throw new Error("Empréstimo não encontrado.")
  if (loan.renewed) throw new Error("Este empréstimo já foi renovado anteriormente. Só é permitida uma renovação por locação.")
  if (!loan.dueDate) throw new Error("Não é possível renovar um empréstimo sem data de vencimento estabelecida.")

  const newDueDate = new Date(new Date(loan.dueDate).getTime() + 5 * 24 * 60 * 60 * 1000)
  const { rows } = await pool.query(
    "update book_loans set due_date = $1, renewed = true where id = $2::uuid returning *",
    [newDueDate.toISOString(), loanId]
  )
  return toLoan(rows[0])
}

export async function directAdminBorrow(data: { book: { id: string; title: string; author: string; coverUrl?: string; poloId?: string | null; availableCopies: number }; student: LoanStudent; registeredBy?: string }) {
  if (data.book.availableCopies <= 0) throw new Error("Livro sem exemplares disponíveis no momento.")
  await checkBorrowEligibility(data.student.id, data.book.id)

  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const { rows } = await pool.query(
    `insert into book_loans
       (book_id, book_title, book_author, book_cover_url, student_id, student_name, student_email,
        student_phone, student_cpf, polo_id, borrowed_at, due_date, status, registered_by, renewed)
     values ($1::uuid,$2,$3,$4,$5::uuid,$6,$7,$8,$9,$10, now(), $11, 'active', $12, false) returning *`,
    [data.book.id, data.book.title, data.book.author, data.book.coverUrl || null, data.student.id,
     data.student.name, data.student.email || null, data.student.phone || null, data.student.cpf || null,
     data.student.poloId || data.book.poloId || null, due.toISOString(), data.registeredBy || "Administrador / Docente"]
  )
  await adjustAvailableCopies(data.book.id, -1)
  return toLoan(rows[0])
}
