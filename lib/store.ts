import { createClient } from "@/lib/supabase/client"
// CACHE-BUSTER: v1.2.2-cloud - 2026-03-13 19:26
import { triggerN8nWebhook } from "@/lib/n8n"
import { BRAND } from "@/lib/brand"
import { apiRequest } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
export { triggerN8nWebhook }

// ─── Types ────────────────────────────────────────────────────────────────────
export type QuestionType = "multiple-choice" | "true-false" | "discursive" | "incorrect-alternative" | "fill-in-the-blank" | "matching"
export interface Choice { id: string; text: string }
export interface MatchingPair { id: string; left: string; right: string }
export interface Semester { id: string; name: string; order: number; shift?: string; modality?: string; poloId?: string | null; isConcluded?: boolean; createdAt: string }
export interface Discipline { id: string; name: string; description?: string | null; semesterId?: string | null; semesterOrder?: number; semesterName?: string; poloId?: string | null; professorName?: string | null; dayOfWeek?: string | null; shift?: string | null; order: number; applicationMonth?: string | null; applicationYear?: string | null; isConcluded?: boolean; createdAt: string }
export interface StudyMaterial { id: string; disciplineId: string; title: string; description?: string; fileUrl: string; createdAt: string }
export interface FinancialSettings { 
  id: string; 
  enrollmentFee: number; 
  monthlyFee: number; 
  enrollmentFeeOnline?: number;
  monthlyFeeOnline?: number;
  secondCallFee: number; 
  finalExamFee: number; 
  totalMonths: number; 
  proLaboreFeePerLesson: number; 
  creditCardUrl?: string; 
  pixKey?: string; 
  updatedAt: string; 
}
export interface AsaasConfig { id: string; apiKey: string; mode: "sandbox" | "production"; pixKey?: string; updatedAt: string; }
export interface FinancialCharge {
  id: string;
  studentId?: string;
  type: "enrollment" | "monthly" | "second_call" | "final_exam" | "other" | "expense";
  description: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "cancelled" | "late" | "bolsa100" | "bolsa50" | "isento";
  paymentDate?: string;
  paymentMethod?: "cartao" | "pix" | "dinheiro" | "other";
  actualPaidAmount?: number;
  disciplineId?: string;
  professorId?: string;
  classId?: string;
  asaasPaymentId?: string;
  pixQrcode?: string;
  pixCopyPaste?: string;
  createdAt: string;
}
export interface Expense { id: string; description: string; amount: number; category: string; dueDate: string; status: "pending" | "paid" | "cancelled"; paidAt?: string; createdAt: string; }
export interface Question { id: string; disciplineId: string; type: QuestionType; text: string; choices: Choice[]; pairs?: MatchingPair[]; correctAnswer: string; points: number; createdAt: string }
export interface Assessment { id: string; title: string; disciplineId: string; professor: string; institution: string; questionIds: string[]; pointsPerQuestion: number; totalPoints: number; openAt: string | null; closeAt: string | null; isPublished: boolean; archived: boolean; shuffleVariants?: boolean; timeLimitMinutes?: number | null; logoBase64?: string; rules?: string; releaseResults?: boolean; modality?: "public" | "private"; isFinalExam?: boolean; createdAt: string }
export interface StudentAnswer { questionId: string; answer: string }
export interface StudentSubmission { id: string; assessmentId: string; studentId: string; studentName: string; studentEmail: string; answers: StudentAnswer[]; score: number; totalPoints: number; percentage: number; submittedAt: string; timeElapsedSeconds: number; focusLostCount?: number }
export interface ProfessorAccount { id: string; name: string; email: string; passwordHash: string; role: "master" | "professor" | "secretary"; avatar_url?: string | null; bio?: string | null; createdAt: string; active?: boolean }
export interface ProfessorSession { loggedIn: boolean; professorId: string; role: "master" | "professor" | "secretary"; avatar_url?: string | null; expiresAt: string; polo_id?: string | null }
export interface StudentSession { studentId: string; name: string; email: string; assessmentId: string; startedAt: string }
export interface StudentProfile { id: string; auth_user_id: string; name: string; email: string; cpf: string; enrollment_number: string; phone?: string; address?: string; church?: string; pastor_name?: string; class_id?: string; payment_status?: string; avatar_url?: string | null; bio?: string | null; status: "pending" | "active" | "inactive"; created_at: string; polo_id?: string | null; modality?: "presencial" | "semi_presencial" | "online"; }
export interface ChatMessage { id: string; studentId: string; disciplineId: string; message: string; isFromStudent: boolean; read: boolean; createdAt: string; }
export interface Attendance { id: string; studentId: string; disciplineId: string; date: string; isPresent: boolean; createdAt: string; }
export interface AttendanceLock {
  id: string
  disciplineId: string
  date: string
  lockedBy: string
  lockedAt: string
}
export interface BoardMember { id: string; name: string; role: string; category: string; avatar_url?: string | null; createdAt: string; }
export interface Testimonial { id: string; name: string; role?: string; polo?: string; quote: string; photoUrl?: string | null; isPublished: boolean; order: number; createdAt: string; }
export interface ProfessorDiscipline { id: string; professorId: string; disciplineId: string; createdAt: string; }
export interface ClassRoom { id: string; name: string; shift: "morning" | "afternoon" | "evening" | "ead"; dayOfWeek?: string; maxStudents: number; studentCount?: number; createdAt: string; modality?: "presencial" | "semi_presencial" | "online"; poloId?: string | null; }
export interface ClassSchedule { id: string; classId: string; disciplineId: string; professorName: string; dayOfWeek: string; timeStart: string; timeEnd: string; lessonsCount: number; workload: number; startDate?: string; endDate?: string; createdAt: string; }
export interface ClassCurriculumItem { id: string; classId: string; disciplineId: string; order: number; applicationMonth?: string | null; applicationYear?: string | null; isConcluded?: boolean; professorName?: string | null; createdAt: string; }
export interface StudentGrade {
  id: string;
  studentId?: string;       // Unique ID for security isolation
  student_id?: string;      // Compatibility with DB field name
  studentIdentifier: string; // Legacy CPF or Email
  studentName: string;
  disciplineId?: string;
  isPublic: boolean;
  examGrade: number;
  worksGrade: number;
  seminarGrade: number;
  participationBonus: number;
  attendanceScore: number;
  customDivisor: number;
  createdAt: string;
}

export interface GradeSettings {
  examWeight: number;
  testWeight: number;
  workWeight: number;
  bonusWeight: number;
  presenceValue: number;
  divisor: number;
  updatedAt: string;
}

export type ChallengeType = "riddle" | "quiz" | "reflection" | "decoding"

export interface Challenge {
  id: string
  disciplineId: string
  week: number
  title: string
  description: string
  type: ChallengeType
  content: any
  correctAnswer?: string
  points: number
  isActive: boolean
  createdAt: string
}

export interface ChallengeSubmission {
  id: string
  challengeId: string
  studentId: string
  answer: string
  isCorrect: boolean
  earnedPoints: number
  submittedAt: string
}

export interface UserLog {
  id?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  role?: string;
  action: string;
  metadata?: any;
  created_at?: string;
}

export interface EadLesson {
  id: string;
  disciplineId: string;
  title: string;
  description?: string;
  videoUrl: string;
  coverUrl?: string;
  orderIndex: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  lessonType?: 'recorded' | 'live_meet';
  meetUrl?: string;
  liveDate?: string;
  minMinutesForPresence?: number;
  createdAt: string;
}

export interface EadLiveTracking {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  disciplineId: string;
  date: string;
  joinedAt: string;
  lastPingAt: string;
  totalSeconds: number;
  isValidated: boolean;
  status: 'online' | 'offline';
}

// ─── Multi-Polo ───────────────────────────────────────────────────────────────
export interface Polo {
  id: string
  name: string
  city: string
  color: string        // primary brand color hex
  colorSecondary: string
  isActive: boolean
  description?: string
}

/** Polos cadastrados no sistema */
export const POLOS: Polo[] = [
  {
    id: "polo-tancredo-neves",
    name: "Polo Salvador",
    city: "Salvador - BA",
    color: "#7f1d1d",
    colorSecondary: "#991b1b",
    isActive: true,
    description: "Sede principal da FATEC - Salvador",
  },
  {
    id: "polo-chapada",
    name: "Polo Chapada",
    city: "Chapada Diamantina - BA",
    color: "#1e3a5f",
    colorSecondary: "#1e40af",
    isActive: true,
    description: "Polo regional da Chapada Diamantina",
  },
]

export function hashPassword(plain: string): string {
  if (typeof window !== "undefined") return btoa(unescape(encodeURIComponent(plain)))
  return Buffer.from(plain).toString("base64")
}
export function checkPassword(plain: string, hash: string): boolean { return hashPassword(plain) === hash }

const KEYS = {
  PROFESSOR_SESSION: "fatec_professor_session",
  STUDENT_SESSION: "fatec_current_session",
  DRAFT_ANSWERS: "fatec_draft_answers",
  SELECTED_POLO: "fatec_selected_polo",
} as const

export function getSelectedPolo(): Polo | null {
  if (typeof window === "undefined") return null
  try {
    const id = localStorage.getItem(KEYS.SELECTED_POLO)
    if (!id) return null
    return POLOS.find(p => p.id === id) ?? null
  } catch { return null }
}

export function saveSelectedPolo(poloId: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEYS.SELECTED_POLO, poloId)
  } catch { /* silent */ }
}

export function clearSelectedPolo(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(KEYS.SELECTED_POLO)
  } catch { /* silent */ }
}

export const MASTER_CREDENTIALS = {
  email: "professor@fatec.com",
  name: "Pb. Fábio Barreto",
  role: "master" as const,
}
export const PROFESSOR_CREDENTIALS = MASTER_CREDENTIALS

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn("localStorage is not available:", err)
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function getProfessorSession(): ProfessorSession | null {
  const s = readLocal<ProfessorSession | null>(KEYS.PROFESSOR_SESSION, null)
  if (!s?.loggedIn) return null
  if (new Date(s.expiresAt) < new Date()) { clearProfessorSession(); return null }
  return s
}
export function saveProfessorSession(professorId: string, role: "master" | "professor" | "secretary", avatar_url?: string | null): void {
  try {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    writeLocal<ProfessorSession>(KEYS.PROFESSOR_SESSION, { loggedIn: true, professorId, role, avatar_url, expiresAt })
  } catch (err) {
    console.error("Erro ao salvar sessão do professor:", err)
  }
}
export function clearProfessorSession(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(KEYS.PROFESSOR_SESSION)
    } catch (err) {
      console.warn("Erro ao remover sessão do professor:", err)
    }
  }
}

export async function registerStudentAuth(name: string, cpf: string, password: string) {
  return apiRequest<{ matricula: string; name: string }>('/api/student/register', 'POST', { name, cpf, password })
}

export async function registerStudentByAdmin(data: any): Promise<void> {
  const res = await fetch("/api/admin/enrollment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      cpf: data.cpf,
      phone: data.phone,
      address: data.address,
      church: data.church,
      pastor_name: data.pastor,
      class_id: data.classId,
      payment_status: data.paymentStatus,
      enrollment_number: data.enrollmentNumber
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao matricular aluno")
  }
}

export async function loginStudentAuth(identifier: string, password: string) {
  // O login é feito no servidor (Better Auth), que grava o cookie de sessão.
  const res = await fetch('/api/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Identificador ou senha inválidos.')
  return body as { success: true; studentId: string; name: string }
}

export async function getStudentProfileAuth(): Promise<StudentProfile | null> {
  return apiRequest<StudentProfile | null>('/api/students/me').catch(() => null)
}

export async function logoutStudentAuth() {
  await authClient.signOut()
}

export function getStudentSession(): StudentSession | null { return readLocal<StudentSession | null>(KEYS.STUDENT_SESSION, null) }
export function saveStudentSession(s: StudentSession): void { writeLocal(KEYS.STUDENT_SESSION, s) }
export function clearStudentSession(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(KEYS.STUDENT_SESSION)
      localStorage.removeItem(KEYS.DRAFT_ANSWERS)
    } catch (err) {
      console.warn("Erro ao limpar sessão do estudante:", err)
    }
  }
}

export function getDraftAnswers(): StudentAnswer[] { return readLocal<StudentAnswer[]>(KEYS.DRAFT_ANSWERS, []) }
export function saveDraftAnswers(answers: StudentAnswer[]): void { writeLocal(KEYS.DRAFT_ANSWERS, answers) }

// DB Mappers
// DB Mappers
function mapSemester(row: any): Semester { return { id: row.id, name: row.name, order: row.order, shift: row.shift || undefined, modality: row.modality || 'presencial', poloId: row.polo_id ?? null, isConcluded: !!row.is_concluded, createdAt: row.created_at } }
function mapStudyMaterial(row: any): StudyMaterial { return { id: row.id, disciplineId: row.discipline_id, title: row.title, description: row.description || undefined, fileUrl: row.file_url, createdAt: row.created_at } }
function mapDiscipline(row: any): Discipline { return { id: row.id, name: row.name, description: row.description || undefined, semesterId: row.semester_id || undefined, poloId: row.polo_id ?? null, professorName: row.professor_name || undefined, dayOfWeek: row.day_of_week || undefined, shift: row.shift || undefined, order: Number(row.order || 0), applicationMonth: row.application_month, applicationYear: row.application_year, isConcluded: !!row.is_concluded, createdAt: row.created_at } }
function mapQuestion(row: any): Question {
  const choices = Array.isArray(row.choices) ? row.choices : (row.choices?.options || [])
  const pairs = row.pairs || row.choices?.matchingPairs || undefined
  return { id: row.id, disciplineId: row.discipline_id, type: row.type, text: row.text, choices, pairs, correctAnswer: row.correct_answer, points: row.points, createdAt: row.created_at }
}
function mapAssessment(row: any): Assessment {
  const modality = (row.modality || "public") as string
  const isArchived = !!row.archived || modality.includes("_archived")
  const cleanModality = modality.replace("_archived", "") as "public" | "private"

  return {
    id: row.id,
    title: row.title,
    disciplineId: row.discipline_id,
    professor: row.professor,
    institution: row.institution,
    questionIds: row.question_ids,
    pointsPerQuestion: row.points_per_question,
    totalPoints: row.total_points,
    openAt: row.open_at,
    closeAt: row.close_at,
    isPublished: row.is_published,
    archived: isArchived,
    shuffleVariants: row.shuffle_variants,
    timeLimitMinutes: row.time_limit_minutes,
    logoBase64: row.logo_base64,
    rules: row.rules,
    releaseResults: row.release_results,
    modality: cleanModality,
    isFinalExam: row.is_final_exam ?? false,
    createdAt: row.created_at
  }
}
function mapSubmission(row: any): StudentSubmission {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    answers: row.answers,
    score: row.score,
    totalPoints: row.total_points,
    percentage: row.percentage,
    submittedAt: row.submitted_at,
    timeElapsedSeconds: row.time_elapsed_seconds,
    focusLostCount: row.focus_lost_count || 0
  }
}
function mapProfessor(p: any): ProfessorAccount {
  if (!p) {
    return {
      id: "unknown",
      name: "Professor",
      email: "",
      passwordHash: "",
      role: "professor",
      avatar_url: null,
      bio: null,
      createdAt: new Date().toISOString(),
      active: false
    }
  }
  return {
    id: p.id || "unknown",
    name: p.name || "Professor",
    email: p.email || "",
    passwordHash: p.password_hash || "",
    role: p.role || "professor",
    avatar_url: p.avatar_url,
    bio: p.bio || null,
    createdAt: p.created_at || new Date().toISOString(),
    active: p.active !== false // Default to true if null/undefined
  }
}
function parseFinancialMeta(raw?: string | null): { cleanUrl?: string; meta: any } {
  if (!raw) return { cleanUrl: undefined, meta: {} }
  const match = raw.match(/<!--FIN_META:(.*?)-->/)
  if (!match) return { cleanUrl: raw, meta: {} }
  try {
    const meta = JSON.parse(match[1])
    const clean = raw.replace(/<!--FIN_META:(.*?)-->\n?/, '').trim()
    return { cleanUrl: clean || undefined, meta }
  } catch {
    return { cleanUrl: raw, meta: {} }
  }
}

function mapFinancialSettings(row: any): FinancialSettings { 
  const { cleanUrl, meta } = parseFinancialMeta(row.credit_card_url)
  const enrollmentFee = Number(row.enrollment_fee || 0)
  const monthlyFee = Number(row.monthly_fee || 0)
  const enrollmentFeeOnline = meta.enrollmentFeeOnline !== undefined ? Number(meta.enrollmentFeeOnline) : enrollmentFee
  const monthlyFeeOnline = meta.monthlyFeeOnline !== undefined ? Number(meta.monthlyFeeOnline) : monthlyFee

  return { 
    id: row.id, 
    enrollmentFee, 
    monthlyFee, 
    enrollmentFeeOnline,
    monthlyFeeOnline,
    secondCallFee: Number(row.second_call_fee || 0), 
    finalExamFee: Number(row.final_exam_fee || 0), 
    totalMonths: Number(row.total_months || 18), 
    proLaboreFeePerLesson: Number(row.pro_labore_fee_per_lesson || 0), 
    creditCardUrl: cleanUrl, 
    pixKey: row.pix_key || undefined, 
    updatedAt: row.updated_at 
  } 
}
function mapFinancialCharge(row: any): FinancialCharge {
  return {
    id: row.id,
    studentId: row.student_id,
    type: row.type,
    description: row.description,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status: row.status,
    paymentDate: row.payment_date || undefined,
    paymentMethod: row.payment_method || undefined,
    actualPaidAmount: row.actual_paid_amount !== null ? Number(row.actual_paid_amount) : undefined,
    disciplineId: row.discipline_id || undefined,
    professorId: row.professor_id || undefined,
    classId: row.class_id || undefined,
    asaasPaymentId: row.asaas_payment_id || undefined,
    pixQrcode: row.pix_qrcode || undefined,
    pixCopyPaste: row.pix_copy_paste || undefined,
    createdAt: row.created_at
  }
}
function mapAsaasConfig(row: any): AsaasConfig { return { id: row.id, apiKey: row.api_key, mode: row.mode as "sandbox" | "production", pixKey: row.pix_key || undefined, updatedAt: row.updated_at } }
function mapExpense(row: any): Expense { return { id: row.id, description: row.description, amount: Number(row.amount), category: row.category, dueDate: row.due_date, status: row.status, paidAt: row.paid_at || undefined, createdAt: row.created_at } }
function mapStudentProfile(row: any): StudentProfile { return { id: row.id, auth_user_id: row.auth_user_id, name: row.name, email: row.email, cpf: row.cpf, enrollment_number: row.enrollment_number, phone: row.phone || undefined, address: row.address || undefined, church: row.church || undefined, pastor_name: row.pastor_name || undefined, class_id: row.class_id || undefined, payment_status: row.payment_status || undefined, avatar_url: row.avatar_url || null, bio: row.bio || null, status: (row.status || 'pending') as StudentProfile['status'], created_at: row.created_at, polo_id: row.polo_id || null, modality: row.modality || null } }
function mapChatMessage(row: any): ChatMessage { return { id: row.id, studentId: row.student_id, disciplineId: row.discipline_id, message: row.message, isFromStudent: row.is_from_student, read: row.read, createdAt: row.created_at } }
function mapAttendance(row: any): Attendance {
  return {
    id: row.id,
    studentId: String(row.student_id || ''),
    disciplineId: String(row.discipline_id || ''),
    date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : '',
    isPresent: row.is_present === true || row.is_present === 1 || String(row.is_present) === 'true',
    createdAt: row.created_at
  }
}
function mapClassSchedule(row: any): ClassSchedule { return { id: row.id, classId: row.class_id, disciplineId: row.discipline_id, professorName: row.professor_name, dayOfWeek: row.day_of_week, timeStart: row.time_start, timeEnd: row.time_end, lessonsCount: Number(row.lessons_count || 1), workload: Number(row.workload || 0), startDate: row.start_date || undefined, endDate: row.end_date || undefined, createdAt: row.created_at } }
function mapClassCurriculumItem(row: any): ClassCurriculumItem { return { id: row.id, classId: row.class_id, disciplineId: row.discipline_id, order: Number(row.order || 0), applicationMonth: row.application_month || undefined, applicationYear: row.application_year || undefined, isConcluded: !!row.is_concluded, professorName: row.professor_name || undefined, createdAt: row.created_at } }
function mapStudentGrade(row: any): StudentGrade {
  return {
    id: row.id,
    studentId: row.student_id || undefined,
    student_id: row.student_id || undefined,
    studentIdentifier: row.student_identifier,
    studentName: row.student_name,
    disciplineId: row.discipline_id || undefined,
    isPublic: row.is_public,
    examGrade: Number(row.exam_grade),
    worksGrade: Number(row.works_grade),
    seminarGrade: Number(row.seminar_grade),
    participationBonus: Number(row.participation_bonus),
    attendanceScore: Number(row.attendance_score),
    customDivisor: Number(row.custom_divisor),
    createdAt: row.created_at
  }
}
function mapBoardMember(row: any): BoardMember { return { id: row.id, name: row.name, role: row.role, category: row.category, avatar_url: row.avatar_url, createdAt: row.created_at } }
function mapTestimonial(row: any): Testimonial { return { id: row.id, name: row.name, role: row.role || undefined, polo: row.polo || undefined, quote: row.quote, photoUrl: row.photo_url ?? null, isPublished: row.is_published ?? true, order: Number(row.order || 0), createdAt: row.created_at } }
function mapProfessorDiscipline(row: any): ProfessorDiscipline { return { id: row.id, professorId: row.professor_id, disciplineId: row.discipline_id, createdAt: row.created_at } }
function mapChallenge(row: any): Challenge {
  return {
    id: row.id,
    disciplineId: row.discipline_id,
    week: row.week,
    title: row.title,
    description: row.description,
    type: row.type as ChallengeType,
    content: row.content,
    correctAnswer: row.correct_answer,
    points: row.points,
    isActive: !!row.is_active,
    createdAt: row.created_at
  }
}
function mapChallengeSubmission(row: any): ChallengeSubmission {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    studentId: row.student_id,
    answer: row.answer,
    isCorrect: !!row.is_correct,
    earnedPoints: row.earned_points,
    submittedAt: row.submitted_at
  }
}

export async function logUserActivity(log: UserLog): Promise<void> {
  await apiRequest('/api/user-logs', 'POST', log).catch(err => console.warn('Failed to log user activity:', err))
}

export async function getUserLogs(limit = 100): Promise<UserLog[]> {
  return apiRequest<UserLog[]>(`/api/user-logs?limit=${limit}`)
}

// ─── Async Supabase Operations ───────────────────────────────────────────────

export async function getFinancialSettings(): Promise<FinancialSettings | null> {
  return apiRequest<FinancialSettings | null>('/api/admin/config?type=financial').then(r => (r as any)?.data ?? r).catch(() => null)
}

export async function updateFinancialSettings(settings: Omit<FinancialSettings, "id" | "updatedAt">): Promise<void> {
  const res = await fetch("/api/admin/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "financial", config: settings })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Erro ao atualizar configurações financeiras")
  }
}

export async function getAsaasConfig(): Promise<AsaasConfig | null> {
  return apiRequest<AsaasConfig | null>('/api/admin/config?type=asaas').then(r => (r as any)?.data ?? r).catch(() => null)
}

export async function updateAsaasConfig(config: Omit<AsaasConfig, "id" | "updatedAt">): Promise<void> {
  const res = await fetch("/api/admin/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "asaas", config })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Erro ao atualizar configurações do Asaas")
  }
}

export async function getGradeSettings(): Promise<GradeSettings> {
  return apiRequest<GradeSettings>('/api/grade-settings')
}

export async function saveGradeSettings(settings: GradeSettings): Promise<void> {
  await apiRequest('/api/grade-settings', 'POST', settings)
}

export async function getClasses(poloId?: string): Promise<ClassRoom[]> {
  return apiRequest<ClassRoom[]>('/api/classes'+(poloId?`?poloId=${poloId}`:''))
}

export async function getPublicClasses(poloId?: string): Promise<ClassRoom[]> {
  return apiRequest<ClassRoom[]>('/api/classes'+(poloId?`?poloId=${poloId}`:''))
}

export async function addClass(cls: Omit<ClassRoom, 'id' | 'createdAt' | 'studentCount'>): Promise<ClassRoom> {
  return apiRequest<ClassRoom>('/api/classes', 'POST', cls)
}

export async function updateClass(id: string, cls: Partial<Omit<ClassRoom, 'id' | 'createdAt'>>): Promise<void> {
  await apiRequest(`/api/classes/${id}`, 'PATCH', cls)
}

export async function deleteClass(id: string): Promise<void> {
  await apiRequest(`/api/classes/${id}`, 'DELETE')
}

function mapClassRoom(row: any): ClassRoom {
  return {
    id: row.id,
    name: row.name,
    shift: row.shift as ClassRoom['shift'],
    dayOfWeek: row.day_of_week || undefined,
    maxStudents: Number(row.max_students),
    studentCount: row.student_count !== undefined ? Number(row.student_count) : undefined,
    createdAt: row.created_at,
    poloId: row.polo_id || undefined,
    modality: row.modality || undefined
  }
}

export async function getFinancialCharges(studentId?: string, poloId?: string): Promise<FinancialCharge[]> {
  return apiRequest<FinancialCharge[]>('/api/finance/charges'+(studentId?`?studentId=${studentId}`:''))
}
export async function addFinancialCharge(charge: Omit<FinancialCharge, "id" | "createdAt" | "status" | "paymentDate">): Promise<FinancialCharge> {
  return apiRequest<FinancialCharge>('/api/finance/charges', 'POST', charge)
}
export async function updateFinancialChargesStatusBatch(ids: string[], status: FinancialCharge["status"]): Promise<void> {
  await apiRequest('/api/finance/charges/status', 'POST', { ids, status })
}

export async function updateFinancialChargeStatus(id: string, status: FinancialCharge["status"]): Promise<void> {
  await apiRequest('/api/finance/charges/status', 'POST', { id, status })
}
export async function deleteFinancialCharge(id: string): Promise<void> {
  await apiRequest(`/api/finance/charges/${id}`, 'DELETE')
}

// ─── Expenses CRUD ───────────────────────────────────────────────────────────

export async function getExpenses(poloId?: string): Promise<Expense[]> {
  return apiRequest<Expense[]>('/api/finance/expenses')
}

export async function addExpense(expense: Omit<Expense, "id" | "createdAt" | "status" | "paidAt">): Promise<Expense> {
  return apiRequest<Expense>('/api/finance/expenses', 'POST', expense)
}

export async function addExpenseBatch(expenses: Omit<Expense, "id" | "createdAt" | "status" | "paidAt">[]): Promise<void> {
  await apiRequest('/api/finance/expenses', 'POST', { expenses })
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, "id" | "createdAt">>): Promise<void> {
  await apiRequest(`/api/finance/expenses/${id}`, 'PATCH', data)
}

export async function deleteExpense(id: string): Promise<void> {
  await apiRequest(`/api/finance/expenses/${id}`, 'DELETE')
}

export async function getSemesters(): Promise<Semester[]> {
  return apiRequest<Semester[]>('/api/semesters')
}

export async function addSemester(name: string, order: number, shift?: string, modality?: string, poloId?: string | null): Promise<Semester> {
  return apiRequest<Semester>('/api/semesters', 'POST', { name, order, shift, modality, poloId })
}
export async function updateSemester(id: string, data: Partial<Pick<Semester, "name" | "order" | "shift" | "modality" | "poloId" | "isConcluded">>): Promise<void> {
  await apiRequest(`/api/semesters/${id}`, 'PATCH', data)
}
export async function deleteSemester(id: string): Promise<void> {
  await apiRequest(`/api/semesters/${id}`, 'DELETE')
}

export async function getDisciplines(): Promise<Discipline[]> {
  return apiRequest<Discipline[]>('/api/disciplines')
}

export async function getDisciplinesByProfessor(professorId: string): Promise<Discipline[]> {
  const r = await apiRequest<{ data: Discipline[] }>(`/api/professor/disciplines?professorId=${professorId}&asDisciplines=1`)
  return r.data
}

export async function getProfessorDisciplines(professorId: string): Promise<ProfessorDiscipline[]> {
  const r = await apiRequest<{ data: ProfessorDiscipline[] }>(`/api/professor/disciplines?professorId=${professorId}`)
  return r.data
}

export async function getAllProfessorDisciplines(): Promise<ProfessorDiscipline[]> {
  const r = await apiRequest<{ data: ProfessorDiscipline[] }>('/api/professor/disciplines')
  return r.data
}

export async function setProfessorFamiliarDisciplines(professorId: string, disciplineIds: string[]): Promise<void> {
  try {
    const res = await fetch('/api/professor/disciplines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professorId, disciplineIds })
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) return
      throw new Error(data.error || "Erro ao salvar preferências")
    }

    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Erro HTTP ${res.status}`)
  } catch (apiError: any) {
    console.warn("Tentando fallback direto ao Supabase:", apiError?.message)
    const supabase = createClient()
    
    // Remove existing links for this professor
    const { error: delError } = await supabase.from('professor_disciplines').delete().eq('professor_id', professorId)
    if (delError) {
      console.error("Erro no delete direto:", delError)
    }

    // Insert new links
    if (disciplineIds && disciplineIds.length > 0) {
      const rows = disciplineIds.map(disciplineId => ({
        professor_id: professorId,
        discipline_id: disciplineId,
        created_at: new Date().toISOString()
      }))
      const { error } = await supabase.from('professor_disciplines').insert(rows)
      if (error) throw new Error(error.message || apiError.message)
    }
  }
}

export async function getProfessorAccountById(id: string): Promise<ProfessorAccount | null> {
  return apiRequest<ProfessorAccount | null>(`/api/professors/${id}`)
}

// ─── Challenges ─────────────────────────────────────────────────────────────

export async function getChallenges(disciplineId?: string): Promise<Challenge[]> {
  const url = disciplineId 
    ? `/api/admin/challenges?disciplineId=${encodeURIComponent(disciplineId)}` 
    : `/api/admin/challenges`
  
  const res = await fetch(url)
  const result = await res.json()
  
  if (!res.ok) {
    console.error("Error fetching challenges:", result.error)
    return []
  }
  
  return (result.data || []).map(mapChallenge)
}

export async function addChallenge(challenge: Omit<Challenge, "id" | "createdAt">): Promise<void> {
  // We use a safe string ID that works with both TEXT and UUID columns if needed
  const dbData = {
    id: uid(),
    discipline_id: challenge.disciplineId || null,
    week: challenge.week,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    content: challenge.content,
    correct_answer: challenge.correctAnswer || null,
    points: Math.round(Number(challenge.points || 0)),
    is_active: challenge.isActive,
    created_at: new Date().toISOString()
  }
  
  const res = await fetch("/api/admin/challenges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dbData)
  })
  
  const result = await res.json()
  if (!res.ok) throw new Error(result.error)
  return mapChallenge(result.data) as any
}

export async function updateChallenge(id: string, data: Partial<Omit<Challenge, "id" | "createdAt">>): Promise<void> {
  const dbData: any = { id }
  if (data.disciplineId !== undefined) dbData.discipline_id = data.disciplineId
  if (data.week !== undefined) dbData.week = data.week
  if (data.title !== undefined) dbData.title = data.title
  if (data.description !== undefined) dbData.description = data.description
  if (data.type !== undefined) dbData.type = data.type
  if (data.content !== undefined) dbData.content = data.content
  if (data.correctAnswer !== undefined) dbData.correct_answer = data.correctAnswer
  if (data.points !== undefined) dbData.points = Math.round(Number(data.points || 0))
  if (data.isActive !== undefined) dbData.is_active = data.isActive
  
  const res = await fetch("/api/admin/challenges", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dbData)
  })
  
  if (!res.ok) {
    const result = await res.json()
    throw new Error(result.error)
  }
}

export async function deleteChallenge(id: string): Promise<void> {
  const res = await fetch(`/api/admin/challenges?id=${id}`, {
    method: "DELETE"
  })
  
  if (!res.ok) {
    const result = await res.json()
    throw new Error(result.error)
  }
}

export async function getChallengeSubmissions(studentId: string): Promise<ChallengeSubmission[]> {
  try {
    const res = await fetch(`/api/student/challenge-submissions?studentId=${studentId}`)
    if (!res.ok) {
      console.error("Erro na resposta getChallengeSubmissions")
      return []
    }
    const data = await res.json()
    return (data || []).map(mapChallengeSubmission)
  } catch (err) {
    console.error("Falha de rede em getChallengeSubmissions:", err)
    return []
  }
}

export async function getChallengeSubmissionsByChallenge(challengeId: string): Promise<ChallengeSubmission[]> {
  try {
    const res = await fetch(`/api/student/challenge-submissions?challengeId=${challengeId}`)
    if (!res.ok) {
      console.error("Erro na resposta getChallengeSubmissionsByChallenge")
      return []
    }
    const data = await res.json()
    return (data || []).map(mapChallengeSubmission)
  } catch (err) {
    console.error("Falha de rede em getChallengeSubmissionsByChallenge:", err)
    return []
  }
}

export async function deleteChallengeSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/student/challenge-submissions?id=${id}`, {
    method: "DELETE"
  })
  
  if (!res.ok) {
    const result = await res.json()
    throw new Error(result.error)
  }
}

export async function deleteAllChallengeSubmissions(challengeId: string): Promise<void> {
  const res = await fetch(`/api/student/challenge-submissions?challengeId=${challengeId}`, {
    method: "DELETE"
  })
  
  if (!res.ok) {
    const result = await res.json()
    throw new Error(result.error)
  }
}

export async function saveChallengeSubmission(sub: Omit<ChallengeSubmission, "id" | "submittedAt">): Promise<void> {
  const dbData = {
    id: uid(),
    challenge_id: sub.challengeId,
    student_id: sub.studentId,
    answer: sub.answer,
    is_correct: sub.isCorrect,
    earned_points: sub.earnedPoints,
    submitted_at: new Date().toISOString()
  }
  
  const res = await fetch("/api/student/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dbData)
  })
  
  if (!res.ok) {
    const err = await res.json()
    console.error("Erro ao salvar submissão:", err)
    throw new Error(err.error || "Erro ao salvar na base de dados")
  }
}

export async function getProLaboreCalculations() {
  const [professors, links, schedules, settings, charges, allClasses, allDisciplines] = await Promise.all([
    getProfessorAccounts(),
    getAllProfessorDisciplines(),
    getClassSchedules(),
    getFinancialSettings(),
    getFinancialCharges(), // This includes expenses
    getClasses(),
    getDisciplines() // Fetch full discipline objects
  ])

  const fee = settings?.proLaboreFeePerLesson || 0
  const calculations: any[] = []

  // Default to 4 lessons if not specified in schedule
  const DEFAULT_LESSONS = 4

  allDisciplines.forEach(discipline => {
    // 1. Find professor(s) for this discipline
    // Priority: professor_disciplines link table
    let linkedProfessorIds = links
      .filter(l => l.disciplineId === discipline.id)
      .map(l => l.professorId)

    // Fallback: If no links in table, try to find by name in the disciplines table
    if (linkedProfessorIds.length === 0 && discipline.professorName) {
      const profByName = professors.find(p => p.name === discipline.professorName)
      if (profByName) linkedProfessorIds = [profByName.id]
    }

    linkedProfessorIds.forEach(profId => {
      const prof = professors.find(p => p.id === profId)
      if (!prof) return

      // 2. Iterate over ALL classes
      allClasses.forEach((classInfo: any) => {
        // Find if there's a specific schedule for this discipline + class
        const sched = schedules.find(s => s.disciplineId === discipline.id && s.classId === classInfo.id)

        // Use scheduled lessons count or fallback to default
        const lessonsCount = sched ? sched.lessonsCount : DEFAULT_LESSONS

        // Check if already paid
        const matchingCharge = (charges || []).find(c =>
          (c.type as any) === 'expense' &&
          c.professorId === prof.id &&
          c.disciplineId === discipline.id &&
          c.classId === classInfo.id
        )

        const isPaid = matchingCharge?.status === 'paid'

        calculations.push({
          professorId: prof.id,
          professorName: prof.name,
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          applicationMonth: discipline.applicationMonth, // Fixed mapping
          applicationYear: discipline.applicationYear,   // Fixed mapping
          classId: classInfo.id,
          className: classInfo.name,
          lessonsCount: lessonsCount,
          feePerLesson: fee,
          totalAmount: lessonsCount * fee,
          isPaid,
          chargeId: matchingCharge?.id
        })
      })
    })
  })

  return calculations
}

export async function settleProLabore(data: {
  professorId: string,
  disciplineId: string,
  classId: string,
  amount: number,
  description: string,
  date?: string
}): Promise<{ id: string }> {
  return apiRequest<{ id: string }>('/api/finance/pro-labore', 'POST', data)
}


export async function linkProfessorToDiscipline(professorId: string, disciplineId: string): Promise<void> {
  await apiRequest('/api/professor/disciplines/link', 'POST', { professorId, disciplineId })
}

export async function unlinkProfessorFromDiscipline(professorId: string, disciplineId: string): Promise<void> {
  await apiRequest(`/api/professor/disciplines/link?professorId=${professorId}&disciplineId=${disciplineId}`, 'DELETE')
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  return apiRequest<BoardMember[]>('/api/board-members')
}

export async function getTestimonials(publishedOnly: boolean = true): Promise<Testimonial[]> {
  return apiRequest<Testimonial[]>(`/api/testimonials${publishedOnly ? '' : '?all=1'}`).catch(() => [])
}

export async function addTestimonial(data: {
  name: string; role?: string; polo?: string; quote: string; photoUrl?: string | null; isPublished?: boolean; order?: number
}): Promise<Testimonial> {
  return apiRequest<Testimonial>('/api/testimonials', 'POST', data)
}

export async function updateTestimonial(id: string, data: Partial<{
  name: string; role: string; polo: string; quote: string; photoUrl: string | null; isPublished: boolean; order: number
}>): Promise<void> {
  await apiRequest(`/api/testimonials/${id}`, 'PATCH', data)
}

export async function deleteTestimonial(id: string): Promise<void> {
  await apiRequest(`/api/testimonials/${id}`, 'DELETE')
}
export async function addDiscipline(
  name: string,
  description?: string | null,
  semesterId?: string | null,
  professorName?: string | null,
  dayOfWeek?: string | null,
  shift?: string | null,
  order?: number,
  applicationMonth?: string | null,
  applicationYear?: string | null,
  isConcluded?: boolean
): Promise<Discipline> {
  return apiRequest<Discipline>('/api/disciplines', 'POST', {
    name, description, semesterId, professorName, dayOfWeek, shift,
    order, applicationMonth, applicationYear, isConcluded,
  })
}

export async function updateDisciplineOrder(items: { id: string; order: number }[]): Promise<void> {
  await apiRequest('/api/disciplines/reorder', 'POST', { items })
}

export async function updateDiscipline(id: string, data: Partial<Pick<Discipline, "name" | "description" | "semesterId" | "professorName" | "dayOfWeek" | "shift" | "order" | "applicationMonth" | "applicationYear" | "isConcluded">>): Promise<void> {
  await apiRequest(`/api/disciplines/${id}`, 'PATCH', data)
}
export async function deleteDiscipline(id: string): Promise<void> {
  await apiRequest(`/api/disciplines/${id}`, 'DELETE')
}

export async function getStudyMaterials(disciplineId?: string): Promise<StudyMaterial[]> {
  return apiRequest<StudyMaterial[]>('/api/study-materials'+(disciplineId?`?disciplineId=${disciplineId}`:''))
}
export async function addStudyMaterial(material: Omit<StudyMaterial, "id" | "createdAt">): Promise<StudyMaterial> {
  return apiRequest<StudyMaterial>('/api/study-materials', 'POST', material)
}
export async function deleteStudyMaterial(id: string): Promise<void> {
  await apiRequest(`/api/study-materials/${id}`, 'DELETE')
}

export async function getQuestions(): Promise<Question[]> {
  return apiRequest<Question[]>('/api/questions')
}
export async function getQuestionsByDiscipline(disciplineId: string): Promise<Question[]> {
  return apiRequest<Question[]>(`/api/questions?disciplineId=${disciplineId}`)
}

export async function getDisciplineQuestionCounts(): Promise<Record<string, number>> {
  return apiRequest<Record<string, number>>('/api/questions/counts')
}
export async function addQuestion(data: Omit<Question, "id" | "createdAt">): Promise<Question> {
  return apiRequest<Question>('/api/questions', 'POST', data)
}

export async function addQuestionsBatch(questions: Omit<Question, "id" | "createdAt">[]): Promise<string[]> {
  return apiRequest<string[]>('/api/questions/batch', 'POST', { questions })
}
export async function updateQuestion(id: string, data: Partial<Omit<Question, "id" | "createdAt">>): Promise<void> {
  await apiRequest(`/api/questions/${id}`, 'PATCH', data)
}
export async function deleteQuestion(id: string): Promise<void> {
  await apiRequest(`/api/questions/${id}`, 'DELETE')
}

export async function getAssessments(poloId?: string): Promise<Assessment[]> {
  return apiRequest<Assessment[]>('/api/assessments')
}
export async function getAssessmentById(id: string): Promise<Assessment | null> {
  return apiRequest<Assessment | null>(`/api/assessments/${id}`).catch(() => null)
}
export async function getActiveAssessment(assessmentId?: string): Promise<Assessment | null> {
  if (assessmentId) {
    return await getAssessmentById(assessmentId)
  }
  const assessments = await getAssessments()
  // Return the first assessment (most recently created) to serve as the default
  return assessments[0] ?? null
}
export async function addAssessment(data: Omit<Assessment, "id" | "createdAt" | "releaseResults" | "archived">): Promise<Assessment> {
  return apiRequest<Assessment>('/api/assessments', 'POST', data)
}
export async function updateAssessment(id: string, data: Partial<Omit<Assessment, "id" | "createdAt">>): Promise<void> {
  await apiRequest(`/api/assessments/${id}`, 'PATCH', data)
}
export async function deleteAssessment(id: string): Promise<void> {
  await apiRequest(`/api/assessments/${id}`, 'DELETE')
}

export async function getSubmissions(): Promise<StudentSubmission[]> {
  return apiRequest<StudentSubmission[]>('/api/submissions')
}
export async function getSubmissionsByAssessment(assessmentId: string): Promise<StudentSubmission[]> {
  return apiRequest<StudentSubmission[]>(`/api/submissions?assessmentId=${assessmentId}`)
}
export async function saveSubmission(sub: StudentSubmission): Promise<StudentSubmission> {
  return apiRequest<StudentSubmission>('/api/submissions', 'POST', sub)
}
export async function updateSubmissionScore(id: string, score: number, totalPoints: number): Promise<void> {
  await apiRequest(`/api/submissions/${id}`, 'PATCH', { score, totalPoints })
}
export async function deleteSubmission(id: string): Promise<void> {
  await apiRequest(`/api/submissions/${id}`, 'DELETE')
}
export async function hasStudentSubmitted(email: string, assessmentId: string): Promise<boolean> {
  const r = await apiRequest<{ result: boolean }>(`/api/submissions/check?email=${encodeURIComponent(email)}&assessmentId=${assessmentId}`)
  return r.result
}
export async function getSubmissionByEmailAndAssessment(email: string, assessmentId: string): Promise<StudentSubmission | null> {
  const r = await apiRequest<{ result: StudentSubmission | null }>(`/api/submissions/check?email=${encodeURIComponent(email)}&assessmentId=${assessmentId}&full=1`)
  return r.result
}

export async function getProfessorAccounts(): Promise<ProfessorAccount[]> {
  return apiRequest<ProfessorAccount[]>('/api/professors')
}
export async function addProfessorAccount(data: Omit<ProfessorAccount, "id" | "createdAt" | "passwordHash"> & { password: string }): Promise<ProfessorAccount> {
  return apiRequest<ProfessorAccount>('/api/professors', 'POST', data)
}
/**
 * Fetches a professor profile by email.
 */
export async function getProfessorByEmail(email: string): Promise<ProfessorAccount | null> {
  return apiRequest<ProfessorAccount | null>(`/api/professors?email=${encodeURIComponent(email)}`)
}

export async function updateProfessorAccount(id: string, data: Partial<Pick<ProfessorAccount, "name" | "email" | "role" | "active" | "bio">> & { password?: string }): Promise<ProfessorAccount> {
  const { password, ...rest } = data
  return apiRequest<ProfessorAccount>(`/api/professors/${id}`, 'PATCH', rest)
}

/**
 * Ensures a professor's database ID matches their Supabase Auth ID.
 * This solves the mismatch between random uid() and Auth ID.
 */
export async function deleteProfessorAccount(id: string): Promise<void> {
  await apiRequest(`/api/professors/${id}`, 'DELETE')
}


export function calculateScore(answers: StudentAnswer[], questions: Question[], pointsPerQuestion: number) {
  let score = 0
  questions.forEach((q) => {
    const ans = answers.find((a) => a.questionId === q.id)
    if (!ans) return

    if (q.type === "multiple-choice" || q.type === "true-false" || q.type === "incorrect-alternative") {
      if (ans.answer === q.correctAnswer) score += pointsPerQuestion
    } else if (q.type === "fill-in-the-blank") {
      const matches = q.text.match(/\[\[(.*?)\]\]/g)
      if (matches) {
        const correctWords = matches.map(m => m.slice(2, -2).trim().toLowerCase())
        try {
          const studentData = JSON.parse(ans.answer)
          let correctBlanks = 0
          correctWords.forEach((word, idx) => {
            const studentWord = (studentData[`blank_${idx}`] || "").trim().toLowerCase()
            if (studentWord === word) correctBlanks++
          })
          score += (correctBlanks / correctWords.length) * pointsPerQuestion
        } catch { }
      }
    } else if (q.type === "matching" && q.pairs) {
      try {
        const studentData = JSON.parse(ans.answer)
        let correctPairs = 0
        q.pairs.forEach(p => {
          if (studentData[p.id] === p.right) correctPairs++
        })
        score += (correctPairs / q.pairs.length) * pointsPerQuestion
      } catch { }
    }
  })
  const totalPoints = questions.length * pointsPerQuestion
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
  return { score, totalPoints, percentage }
}

export async function getClassSchedules(poloId?: string): Promise<ClassSchedule[]> {
  return apiRequest<ClassSchedule[]>('/api/class-schedules')
}

export async function addClassSchedule(data: Omit<ClassSchedule, "id" | "createdAt">): Promise<void> {
  await apiRequest('/api/class-schedules', 'POST', data)
}

export async function updateClassSchedule(id: string, data: Partial<Omit<ClassSchedule, "id" | "createdAt">>): Promise<void> {
  await apiRequest(`/api/class-schedules/${id}`, 'PATCH', data)
}


export async function deleteClassSchedule(id: string): Promise<void> {
  await apiRequest(`/api/class-schedules/${id}`, 'DELETE')
}

// ─── Grade Curricular por Turma (class_curriculum) ──────────────────────────
// Cada turma tem sua própria sequência de disciplinas (do catálogo em `disciplines`)
// com mês/ano específicos, usada pelo financeiro para gerar as mensalidades.

export async function getClassCurriculum(classId: string): Promise<ClassCurriculumItem[]> {
  return apiRequest<ClassCurriculumItem[]>(`/api/class-curriculum?classId=${classId}`)
}

export async function saveClassCurriculumItem(item: Omit<ClassCurriculumItem, 'id' | 'createdAt'>, id?: string): Promise<void> {
  await apiRequest('/api/class-curriculum', 'POST', { item, id })
}

export async function deleteClassCurriculumItem(id: string): Promise<void> {
  await apiRequest(`/api/class-curriculum/${id}`, 'DELETE')
}

export async function reorderClassCurriculum(orderedItemIds: string[]): Promise<void> {
  await apiRequest('/api/class-curriculum/reorder', 'POST', { ids: orderedItemIds })
}

// Resolve a grade "global" atual (mesma lógica antes usada por syncStudentTuitionByDisciplines),
// usada como modelo/base pelo botão "Copiar da grade global" e como fallback para turmas que
// ainda não têm grade própria cadastrada em class_curriculum.
async function resolveGlobalGradeDisciplines(modality: string, poloId?: string | null): Promise<Discipline[]> {
  const supabase = createClient()
  const semesterModality = (modality === 'online' || modality === 'semi_presencial') ? 'semi_presencial' : 'presencial'

  const [semestersResult, disciplinesResult] = await Promise.all([
    supabase.from('semesters').select('*').eq('modality', semesterModality).order('order', { ascending: true }),
    supabase.from('disciplines').select('*')
  ])

  let semesters = semestersResult.data || []
  if (poloId) {
    const ownPoloSemesters = semesters.filter((s: any) => s.polo_id === poloId)
    semesters = ownPoloSemesters.length > 0 ? ownPoloSemesters : semesters.filter((s: any) => !s.polo_id)
  }
  const semesterIds = new Set(semesters.map((s: any) => s.id))

  const disciplines = (disciplinesResult.data || [])
    .filter((d: any) => d.semester_id && semesterIds.has(d.semester_id))
    .map(mapDiscipline)
    .sort((a: any, b: any) => {
      const semA = semesters.find((s: any) => s.id === a.semesterId)
      const semB = semesters.find((s: any) => s.id === b.semesterId)
      const semOrderA = semA?.order ?? 999
      const semOrderB = semB?.order ?? 999
      if (semOrderA !== semOrderB) return semOrderA - semOrderB
      return a.order - b.order
    })

  return disciplines
}

// Copia a grade global atual (por modalidade/polo) para a grade própria de uma turma.
// Usado tanto pelo botão "Copiar da grade global" na UI quanto pela migração inicial das turmas já existentes.
export async function copyGlobalGradeToClass(classId: string): Promise<number> {
  const supabase = createClient()
  const { data: cls } = await supabase.from('classes').select('modality, polo_id').eq('id', classId).maybeSingle()
  if (!cls) throw new Error('Turma não encontrada.')

  const disciplines = await resolveGlobalGradeDisciplines(cls.modality || 'presencial', cls.polo_id)
  if (disciplines.length === 0) return 0

  const { data: existing } = await supabase.from('class_curriculum').select('discipline_id').eq('class_id', classId)
  const existingIds = new Set((existing || []).map((r: any) => r.discipline_id))

  const rows = disciplines
    .filter(d => !existingIds.has(d.id))
    .map((d, index) => ({
      class_id: classId,
      discipline_id: d.id,
      order: existingIds.size + index,
      application_month: d.applicationMonth || null,
      application_year: d.applicationYear || null,
      is_concluded: d.isConcluded || false,
      created_at: new Date().toISOString()
    }))

  if (rows.length === 0) return 0
  const { error } = await supabase.from('class_curriculum').insert(rows)
  if (error) throw new Error(error.message)
  return rows.length
}

// Migração de conveniência: copia a grade global para TODAS as turmas que ainda não têm
// nenhuma linha em class_curriculum. Roda uma única vez a partir de um botão admin.
export async function backfillClassCurriculumFromGlobalGrade(): Promise<{ classId: string; className: string; inserted: number }[]> {
  const supabase = createClient()
  const { data: classes } = await supabase.from('classes').select('id, name')
  const results: { classId: string; className: string; inserted: number }[] = []
  for (const c of (classes || [])) {
    const { count } = await supabase.from('class_curriculum').select('id', { count: 'exact', head: true }).eq('class_id', c.id)
    if (count && count > 0) continue
    const inserted = await copyGlobalGradeToClass(c.id)
    results.push({ classId: c.id, className: c.name, inserted })
  }
  return results
}

export async function getStudents(poloId?: string): Promise<StudentProfile[]> {
  return apiRequest<StudentProfile[]>('/api/students')
}


export async function updateStudent(id: string, data: {
  name?: string
  cpf?: string
  phone?: string
  address?: string
  church?: string
  pastor_name?: string
  class_id?: string | null
  payment_status?: string
  status?: "pending" | "active" | "inactive"
  password?: string
}): Promise<void> {
  // Observação: a troca de senha pelo admin ainda não tem equivalente no
  // Better Auth (exigiria o plugin de administração). O campo é ignorado
  // por enquanto; a ativação automática continua funcionando.
  const { password, ...rest } = data
  await apiRequest(`/api/students/${id}`, 'PATCH', rest)
}

export async function deleteStudent(id: string): Promise<void> {
  await apiRequest(`/api/students/${id}`, 'DELETE')
}

export async function getChatMessages(disciplineId: string, studentId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/api/chat/messages?disciplineId=${disciplineId}&studentId=${studentId}`)
}

export async function sendChatMessage(studentId: string, disciplineId: string, message: string, isFromStudent: boolean): Promise<ChatMessage> {
  return apiRequest<ChatMessage>('/api/chat/messages', 'POST', { studentId, disciplineId, message, isFromStudent })
}

export async function markChatAsRead(id: string): Promise<void> {
  await apiRequest(`/api/chat/messages/${id}`, 'PATCH')
}

export async function getAttendances(disciplineId: string, poloId?: string): Promise<Attendance[]> {
  return apiRequest<Attendance[]>(`/api/attendance?disciplineId=${disciplineId}`)
}

export async function getAttendanceAnalysis(disciplineId: string, students: StudentProfile[]) {
  const supabase = createClient()
  const records = await getAttendances(disciplineId)

  const stats = {
    totalStudents: students.length,
    totalRecords: records.length,
    present: records.filter(r => r.isPresent).length,
    absent: records.filter(r => !r.isPresent).length,
    absenceRate: records.length > 0 ? (records.filter(r => !r.isPresent).length / records.length * 100).toFixed(1) : "0"
  }

  const issues: { type: string, severity: 'Alta' | 'Média' | 'Baixa', description: string }[] = []

  // Issue 1: Students with 0 records
  students.forEach(s => {
    const hasRecords = records.some(r => r.studentId === s.id)
    if (!hasRecords) {
      issues.push({
        type: "Aluno sem registros",
        severity: "Alta",
        description: `O aluno ${s.name} não possui nenhum registro de frequência nesta disciplina.`
      })
    }
  })

  // Issue 2: High absence rate (> 25%)
  students.forEach(s => {
    const sAtt = records.filter(r => String(r.studentId) === String(s.id))
    const total = Math.min(sAtt.length, 4)
    if (total > 0) {
      const presents = Math.min(sAtt.filter(r => r.isPresent).length, 4)
      const absent = total - presents
      const rate = (absent / total) * 100
      if (rate > 25) {
        issues.push({
          type: "Taxa de falta elevada",
          severity: rate > 75 ? "Alta" : "Média",
          description: `O aluno ${s.name} possui uma taxa de falta de ${rate.toFixed(1)}% (${absent}/${total} aulas).`
        })
      }
    }
  })

  // Issue 3: Incomplete dates (< 80% students)
  const dateCounts: Record<string, number> = {}
  records.forEach(r => {
    dateCounts[r.date] = (dateCounts[r.date] || 0) + 1
  })

  Object.entries(dateCounts).forEach(([date, count]) => {
    if (count < students.length * 0.8) {
      issues.push({
        type: "Registro incompleto",
        severity: "Média",
        description: `No dia ${date.split('-').reverse().join('/')}, apenas ${count}/${students.length} alunos foram registrados na chamada.`
      })
    }
  })

  return { stats, issues }
}

export async function triggerAttendanceAlerts(disciplineId: string, disciplineName: string, students: StudentProfile[]): Promise<{ count: number }> {
  const records = await getAttendances(disciplineId)
  let count = 0

  for (const s of students) {
    const sAtt = records.filter(r => String(r.studentId) === String(s.id))
    const total = sAtt.length
    if (total === 0) continue

    const absent = sAtt.filter(r => !r.isPresent).length
    const rate = (absent / total) * 100

    if (rate > 25) { // Threshold for alert
      triggerN8nWebhook('alerta_frequencia', {
        type: 'absenteeism_alert',
        studentId: s.id,
        studentName: s.name,
        phone: s.phone,
        disciplineName,
        absenceRate: rate.toFixed(1),
        currentAbsences: absent,
        totalClasses: total
      })
      count++
    }
  }

  return { count }
}

export async function saveAttendance(studentId: string, disciplineId: string, date: string, isPresent: boolean): Promise<void> {
  await apiRequest('/api/attendance', 'POST', { studentId, disciplineId, date, isPresent })
}

export async function getAttendanceLock(disciplineId: string, date: string): Promise<AttendanceLock | null> {
  return apiRequest<AttendanceLock | null>(`/api/attendance/lock?disciplineId=${disciplineId}&date=${date}`)
}

export async function lockAttendance(disciplineId: string, date: string, lockedBy: string): Promise<void> {
  await apiRequest('/api/attendance/lock', 'POST', { disciplineId, date, lockedBy })
}

export async function unlockAttendance(id: string): Promise<void> {
  await apiRequest(`/api/attendance/lock?id=${id}`, 'DELETE')
}

// ─── n8n WhatsApp Integration ──────────────────────────────────────────────

// ─── Notas (Student Grades) ───────────────────────────────────────────

export async function getStudentGrades(poloId?: string): Promise<StudentGrade[]> {
  return apiRequest<StudentGrade[]>('/api/grades')
}

/**
 * Robustly links student_grades records to the correct student_id (UUID)
 * based on the identifier (CPF/Email).
 */
export async function syncStudentGrades(studentId: string, cpf?: string, email?: string, enrollmentNumber?: string): Promise<{ affected: number }> {
  const supabase = createClient()
  const cleanCpf = cpf?.replace(/\D/g, '') || ""

  // Find records that don't have student_id but match CPF, Email, or Enrollment Number
  let query = supabase.from('student_grades')
    .select('id')
    .is('student_id', null)

  const conditions = []
  if (cleanCpf) conditions.push(`student_identifier.eq.${cleanCpf}`)
  if (email) conditions.push(`student_identifier.eq.${email.toLowerCase().trim()}`)
  if (enrollmentNumber) conditions.push(`student_identifier.eq.${enrollmentNumber}`)

  if (conditions.length === 0) return { affected: 0 }

  const { data: orphans } = await query.or(conditions.join(','))

  if (!orphans || orphans.length === 0) return { affected: 0 }

  const ids = orphans.map((o: any) => o.id)
  const { error } = await supabase.from('student_grades')
    .update({ student_id: studentId })
    .in('id', ids)

  if (error) {
    console.error("Error during grade sync:", error)
    return { affected: 0 }
  }

  return { affected: ids.length }
}

/**
 * Bulk repairs grade records for all students.
 */
export async function bulkSyncGrades(): Promise<{ totalAffected: number }> {
  const students = await getStudents()
  let totalAffected = 0
  for (const student of students) {
    const { affected } = await syncStudentGrades(student.id, student.cpf, student.email, student.enrollment_number)
    totalAffected += affected
  }
  return { totalAffected }
}

/**
 * Fetches all attendances for a specific student in a single call.
 */
export async function getStudentAttendances(studentId: string): Promise<Attendance[]> {
  return apiRequest<Attendance[]>(`/api/attendance?studentId=${studentId}`)
}

export async function saveStudentGrade(grade: Omit<StudentGrade, 'id' | 'createdAt'>, id?: string): Promise<void> {
  await apiRequest('/api/grades', 'POST', { grade, id })
}

export async function getAvailableSlots(): Promise<number> {
  const supabase = createClient()

  // Get total capacity from classes
  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select('max_students')

  if (classesError) {
    console.error("Error fetching classes capacity:", classesError)
    return 0
  }

  const totalCapacity = classesData.reduce((acc: number, curr: any) => acc + (curr.max_students || 0), 0)

  // Get current student count
  const { count, error: studentsError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  if (studentsError) {
    console.error("Error fetching student count:", studentsError)
    return 0
  }

  const currentStudents = count || 0
  const available = totalCapacity - currentStudents

  return available > 0 ? available : 0
}


export async function deleteStudentGrade(id: string): Promise<void> {
  await apiRequest(`/api/grades/${id}`, 'DELETE')
}

export async function releaseAllGrades(classId?: string): Promise<void> {
  await apiRequest('/api/grades/release', 'POST', { action: 'release', classId })
}

export async function blockAllGrades(classId?: string): Promise<void> {
  await apiRequest('/api/grades/release', 'POST', { action: 'block', classId })
}

export function calculateGlobalAverage(grade: StudentGrade, settings: GradeSettings): string {
  // Institutional Rule: (Attendance Score + Exam Grade) / 2 + Pontos Extras
  // Attendance Score is already calculated as (Presences * 2.5) capped at 10.0
  // Pontos Extras (participationBonus) is NOT divided: it is added directly to the final average.
  const exam = (grade.examGrade || 0)
  const presence = (grade.attendanceScore || 0)
  const extra = (grade.participationBonus || 0)

  const avg = (presence + exam) / 2 + extra
  return Math.min(avg, 10.0).toFixed(2)
}

/**
 * Retrospectively syncs all attendance scores in student_grades table
 * based on the current presenceValue in settings.
 */
export async function syncAllAttendanceScores(): Promise<void> {
  const supabase = createClient()
  console.log("🚀 [Sync] Iniciando sincronização robusta...");
  
  const { data: students } = await supabase.from('students').select('id, name, email, cpf')
  if (!students) return
  const studentById: Record<string, any> = {}
  students.forEach((s: any) => { studentById[s.id] = s })

  const { data: allAtt } = await supabase.from('attendances').select('student_id, discipline_id').eq('is_present', true)
  if (!allAtt) return

  const counts: Record<string, number> = {}
  allAtt.forEach((a: any) => {
    if (!a.student_id || !a.discipline_id) return
    const key = `${a.student_id}:${a.discipline_id}`
    counts[key] = (counts[key] || 0) + 1
  })

  for (const [key, rawCount] of Object.entries(counts)) {
    const [studentId, disciplineId] = key.split(':')
    const score = Math.min(rawCount * 2.5, 10.0)
    const student = studentById[studentId]
    if (!student) continue

    const cleanCpf = student.cpf ? student.cpf.replace(/\D/g, '') : null

    const { data: existingGrades } = await supabase.from('student_grades').select('id, student_identifier, student_id').eq('discipline_id', disciplineId)
    
    let updatedAny = false
    if (existingGrades && existingGrades.length > 0) {
      for (const grade of existingGrades) {
        let isMatch = false
        if (grade.student_id === studentId) isMatch = true
        else if (grade.student_identifier) {
          const ident = grade.student_identifier.toLowerCase().trim()
          const cleanIdent = ident.replace(/\D/g, '')
          if (ident === student.email?.toLowerCase().trim()) isMatch = true
          else if (cleanCpf && cleanIdent === cleanCpf) isMatch = true
        }
        if (isMatch) {
          await supabase.from('student_grades').update({ attendance_score: score, student_id: studentId }).eq('id', grade.id)
          updatedAny = true
        }
      }
    }

    if (!updatedAny) {
      // Create missing grade record
      await supabase.from('student_grades').insert({
        student_id: studentId,
        student_name: student.name,
        student_identifier: student.email || student.cpf || studentId,
        discipline_id: disciplineId,
        attendance_score: score,
        exam_grade: 0,
        works_grade: 0,
        seminar_grade: 0,
        participation_bonus: 0,
        custom_divisor: 2,
        is_public: false,
        created_at: new Date().toISOString()
      })
    }
  }
  console.log("✅ [Sync] Sincronização concluída.");
}

// ─── Profile / Avatar Management ──────────────────────────────────────────

export async function uploadAvatar(file: File, userId: string, folder: 'students' | 'professors' | 'board' | 'testimonials'): Promise<string> {
  const type = folder === 'students' ? 'student' : folder === 'professors' ? 'professor' : 'board'
  const form = new FormData()
  form.append('file', file)
  form.append('type', type)
  const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Erro no upload.')
  return body.url as string
}

export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string,
  type: 'student' | 'professor' | 'board'
): Promise<void> {
  if (type === 'student') {
    await apiRequest(`/api/students/${userId}`, 'PATCH', { avatar_url: avatarUrl })
    return
  }
  if (type === 'professor') {
    await apiRequest(`/api/professors/${userId}`, 'PATCH', { avatar_url: avatarUrl })
    return
  }
  // 'board' (membros do conselho) ainda não foi migrado para o Neon.
  const supabase = createClient()
  const { error } = await supabase.from('board_members').update({ avatar_url: avatarUrl }).eq('id', userId)
  if (error) throw new Error(`Falha ao atualizar avatar: ${error.message}`)
}

export async function getStudentProfile(id: string): Promise<StudentProfile | null> {
  return apiRequest<StudentProfile | null>(`/api/students/${id}`)
}

export async function getClassmates(classId: string): Promise<StudentProfile[]> {
  return apiRequest<StudentProfile[]>(`/api/students/classmates?classId=${classId}`)
}

export async function getProfessorAccount(id: string): Promise<ProfessorAccount | null> {
  return apiRequest<ProfessorAccount | null>(`/api/professors/${id}`)
}
export async function syncStudentTuitionByDisciplines(studentId: string): Promise<void> {
  const supabase = createClient()

  // 1. Get Student and their Class
  const { data: student } = await supabase.from('students').select('class_id, created_at, modality, polo_id').eq('id', studentId).single()
  if (!student) return

  // Determine modality: if student has modality, or get class modality
  let studentModality: string = student.modality || 'presencial'
  if (student.class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id, modality')
      .eq('id', student.class_id)
      .maybeSingle()
    if (cls?.modality) {
      studentModality = cls.modality
    }
  }

  // 2. Grade curricular: cada turma tem sua própria sequência de disciplinas/meses
  // (class_curriculum). Turmas que ainda não têm grade própria cadastrada caem no
  // fallback da grade global por modalidade, para não quebrar cobranças já existentes.
  let disciplines: Discipline[] = []
  if (student.class_id) {
    const curriculumItems = await getClassCurriculum(student.class_id)
    if (curriculumItems.length > 0) {
      const { data: allDisciplineRows } = await supabase.from('disciplines').select('*')
      const disciplineById = new Map<string, Discipline>((allDisciplineRows || []).map((d: any) => [d.id, mapDiscipline(d)]))
      disciplines = curriculumItems
        .map(item => {
          const disc = disciplineById.get(item.disciplineId)
          if (!disc) return null
          return {
            ...disc,
            applicationMonth: item.applicationMonth ?? disc.applicationMonth,
            applicationYear: item.applicationYear ?? disc.applicationYear,
            isConcluded: item.isConcluded ?? disc.isConcluded,
          } as Discipline
        })
        .filter((d): d is Discipline => !!d)
    }
  }

  if (disciplines.length === 0) {
    disciplines = await resolveGlobalGradeDisciplines(studentModality, student.polo_id)
  }

  if (disciplines.length === 0) return

  const monthMap: Record<string, number> = {
    'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
    'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
  }

  // 3. Get Settings
  const settings = await getFinancialSettings()
  if (!settings) return

  // Every polo shares the same base fee. Polo-specific reductions (e.g. Salvador's discount)
  // are applied afterwards via the financial manager's bulk discount tool, not hardcoded here.
  const activeEnrollmentFee = settings.enrollmentFee
  const activeMonthlyFee = settings.monthlyFee

  const charges: any[] = []

  // 4. Add Enrollment Fee (Taxa de Matrícula) - ALWAYS FIRST
  const enrollmentDate = new Date(student.created_at || Date.now())
  enrollmentDate.setHours(0, 0, 0, 0)

  charges.push({
    student_id: studentId,
    type: 'enrollment',
    description: studentModality === 'online' ? 'Taxa de Matrícula (Online)' : 'Taxa de Matrícula',
    amount: activeEnrollmentFee,
    due_date: enrollmentDate.toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date().toISOString()
  })

  // 5. Add Discipline-based Monthly Fees (Exactly 18)
  disciplines.forEach((disp: any) => {
    let year = parseInt(disp.applicationYear || "2026")
    let monthNum = 1

    if (disp.applicationMonth) {
      if (monthMap[disp.applicationMonth]) {
        monthNum = monthMap[disp.applicationMonth]
      } else {
        monthNum = parseInt(disp.applicationMonth) || 1
      }
    }

    const dueDate = new Date(year, monthNum - 1, 10)

    charges.push({
      student_id: studentId,
      type: 'monthly',
      description: `Mensalidade: ${disp.name}`,
      discipline_id: disp.id,
      amount: activeMonthlyFee,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString()
    })
  })

  // 6. Reconcile charges preserving paid, bolsa100, bolsa50, and isento
  const { data: existing } = await supabase.from('financial_charges')
    .select('*')
    .eq('student_id', studentId)
    .neq('type', 'expense')

  const preservedStatuses = ['paid', 'bolsa100', 'bolsa50', 'isento']
  // Disciplines renamed between grades (e.g. EAD grade vs presencial grade) that refer to the same course.
  const DESCRIPTION_SYNONYMS: Record<string, string> = {
    'evangelismo e missoes': 'evangelismo e missiologia',
  }
  const norm = (s: string) => {
    const base = (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    return DESCRIPTION_SYNONYMS[base] || base
  }

  const finalCharges: any[] = []
  const handledExistingIds = new Set<string>()
  const toDeleteIds = new Set<string>()

  for (const nc of charges) {
    const matches = (existing || []).filter((ex: any) => {
      if (handledExistingIds.has(ex.id)) return false
      if (nc.type === 'enrollment' && ex.type === 'enrollment') return true
      if (nc.type === 'monthly' && ex.type === 'monthly') {
        if (ex.discipline_id && ex.discipline_id === nc.discipline_id) return true
        if (norm(ex.description) === norm(nc.description)) return true
      }
      return false
    })

    if (matches.length > 0) {
      const paidMatch = matches.find((m: any) => m.status === 'paid')
      const bolsaMatch = matches.find((m: any) => m.status === 'bolsa100' || m.status === 'bolsa50' || m.status === 'isento')
      const chosen = paidMatch || bolsaMatch || matches[0]

      handledExistingIds.add(chosen.id)

      if (preservedStatuses.includes(chosen.status)) {
        // Keep existing paid/bolsa, update due_date and discipline_id so sorting aligns with grade
        await supabase.from('financial_charges').update({
          due_date: nc.due_date,
          discipline_id: nc.discipline_id,
          description: nc.description
        }).eq('id', chosen.id)
      } else {
        // Update pending charge to canonical due_date, discipline_id and description
        await supabase.from('financial_charges').update({
          due_date: nc.due_date,
          amount: nc.amount,
          discipline_id: nc.discipline_id,
          description: nc.description
        }).eq('id', chosen.id)
      }

      // Mark the other duplicate matches to be deleted (if not paid)
      matches.forEach((m: any) => {
        if (m.id !== chosen.id && m.status !== 'paid') {
          toDeleteIds.add(m.id)
        }
      })
    } else {
      finalCharges.push(nc)
    }
  }

  // Delete leftover unhandled charges that are NOT preserved (duplicate EAD or rogue charges)
  (existing || []).forEach((ex: any) => {
    if (!handledExistingIds.has(ex.id) && ex.status !== 'paid') {
      toDeleteIds.add(ex.id)
    }
  })

  if (toDeleteIds.size > 0) {
    const deleteIds = Array.from(toDeleteIds)
    await supabase.from('financial_charges').delete().in('id', deleteIds)
  }

  // Insert any missing canonical charges
  if (finalCharges.length > 0) {
    const { error } = await supabase.from('financial_charges').insert(finalCharges)
    if (error) throw new Error(error.message)
  }
}

export async function settleFinancialCharge(id: string, data: {
  paidAmount: number,
  method: "cartao" | "pix" | "dinheiro",
  date: string
}): Promise<void> {
  await apiRequest('/api/finance/charges/settle', 'POST', { id, ...data })
}

export async function reverseFinancialCharge(id: string): Promise<void> {
  await apiRequest('/api/finance/charges/settle', 'POST', { id, action: 'reverse' })
}

export async function updateFinancialCharge(id: string, data: {
  amount?: number
  description?: string
  dueDate?: string
  status?: FinancialCharge["status"]
}): Promise<void> {
  await apiRequest(`/api/finance/charges/${id}`, 'PATCH', data)
}

// Build timestamp: 2026-03-13 10:59


// %%% EAD Lessons & Live Classroom Hub %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function parseEadMetadata(rawDescription?: string | null): { cleanDescription: string; meta: any } {
  if (!rawDescription) return { cleanDescription: '', meta: {} }
  const metaRegex = /<!--EAD_META:([\s\S]*?)-->/
  const match = rawDescription.match(metaRegex)
  if (match && match[1]) {
    try {
      const meta = JSON.parse(match[1])
      const cleanDescription = rawDescription.replace(metaRegex, '').trim()
      return { cleanDescription, meta }
    } catch {
      return { cleanDescription: rawDescription, meta: {} }
    }
  }
  return { cleanDescription: rawDescription, meta: {} }
}

function buildEadDescription(description?: string, meta?: any): string {
  const base = description ? description.trim() : ''
  if (!meta || Object.keys(meta).length === 0) return base
  return `${base}\n\n<!--EAD_META:${JSON.stringify(meta)}-->`.trim()
}

function mapEadLesson(row: any): EadLesson {
  const { cleanDescription, meta } = parseEadMetadata(row.description)
  
  return {
    id: row.id,
    disciplineId: row.discipline_id,
    title: row.title,
    description: cleanDescription,
    videoUrl: row.video_url || row.meet_url || meta.meetUrl || '',
    coverUrl: row.cover_url || meta.coverUrl || undefined,
    orderIndex: row.order_index,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    lessonType: row.lesson_type || meta.lessonType || (row.video_url?.includes('meet.google.com') ? 'live_meet' : 'recorded'),
    meetUrl: row.meet_url || meta.meetUrl || (row.video_url?.includes('meet.google.com') ? row.video_url : undefined),
    liveDate: row.live_date || meta.liveDate || (row.available_from ? row.available_from.substring(0, 10) : undefined),
    minMinutesForPresence: row.min_minutes !== undefined ? row.min_minutes : (meta.minMinutesForPresence !== undefined ? meta.minMinutesForPresence : 0),
    createdAt: row.created_at
  }
}

// Helper function to compress images before upload to ensure fast loading and prevent payload size limits
export async function compressImageFile(file: File, maxWidth = 1280, maxHeight = 720, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file
  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export async function uploadEadCover(file: File): Promise<string> {
  try {
    // 1. Compress image to optimal size (~100KB-300KB)
    const compressed = await compressImageFile(file, 1280, 720, 0.85)

    // 2. Upload through server-side endpoint with Supabase Admin privileges
    const formData = new FormData()
    formData.append("file", compressed)

    const res = await fetch("/api/admin/ead/upload", {
      method: "POST",
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      if (data.url) return data.url
    }

    // 3. Fallback to direct client upload if API endpoint failed
    const supabase = createClient()
    const fileExt = compressed.name.split('.').pop() || 'jpg'
    const fileName = `ead-cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `ead/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressed, { cacheControl: '3600', upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      if (data?.publicUrl) return data.publicUrl
    }

    // 4. Final lightweight fallback (compressed base64 data URL)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressed)
    })
  } catch (err) {
    console.error("uploadEadCover error:", err)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

async function safeExtractErrorMessage(res: Response, fallbackMsg: string): Promise<string> {
  try {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return json.error || json.message || fallbackMsg
    } catch {
      return text && text.length < 200 ? text : fallbackMsg
    }
  } catch {
    return fallbackMsg
  }
}

export async function getEadLessons(disciplineId: string): Promise<EadLesson[]> {
  try {
    const res = await fetch(`/api/admin/ead?disciplineId=${encodeURIComponent(disciplineId)}`)
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data.map(mapEadLesson)
    }
  } catch (err) {
    console.warn("API GET /api/admin/ead failed, falling back to direct client", err)
  }
  const supabase = createClient()
  const { data } = await supabase.from('ead_lessons').select('*').eq('discipline_id', disciplineId).order('order_index', { ascending: true })
  return (data || []).map(mapEadLesson)
}

export async function addEadLesson(lesson: Omit<EadLesson, 'id' | 'createdAt'>): Promise<void> {
  const res = await fetch('/api/admin/ead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lesson)
  })
  if (!res.ok) {
    const errMsg = await safeExtractErrorMessage(res, 'Erro ao cadastrar aula EAD')
    throw new Error(errMsg)
  }
}

export async function updateEadLesson(id: string, lesson: Partial<EadLesson>): Promise<void> {
  const res = await fetch('/api/admin/ead', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...lesson })
  })
  if (!res.ok) {
    const errMsg = await safeExtractErrorMessage(res, 'Erro ao atualizar aula EAD')
    throw new Error(errMsg)
  }
}

export async function deleteEadLesson(id: string): Promise<void> {
  const res = await fetch(`/api/admin/ead?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const errMsg = await safeExtractErrorMessage(res, 'Erro ao excluir aula EAD')
    throw new Error(errMsg)
  }
}

// ─── EAD Live Class Heartbeat & Attendance Tracking ───────────────────────────

const LOCAL_LIVE_TRACKING_KEY = 'fatec_ead_live_tracking_v1'

function getLocalLiveTracking(): EadLiveTracking[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_LIVE_TRACKING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalLiveTracking(list: EadLiveTracking[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_LIVE_TRACKING_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Error saving local live tracking:', err)
  }
}

export async function recordLiveSessionJoin(
  lessonId: string,
  studentId: string,
  studentName: string,
  disciplineId: string,
  lessonDate?: string,
  minMinutes: number = 0
): Promise<{ trackingId: string; isValidated: boolean; totalSeconds: number }> {
  return apiRequest('/api/ead/live/join', 'POST', { lessonId, studentId, studentName, disciplineId, lessonDate, minMinutes })
}

export async function pingLiveSessionHeartbeat(
  trackingId: string,
  secondsToAdd: number,
  studentId: string,
  disciplineId: string,
  date: string,
  minMinutes: number = 0
): Promise<{ totalSeconds: number; isValidated: boolean }> {
  return apiRequest('/api/ead/live/ping', 'POST', { trackingId, secondsToAdd, studentId, disciplineId, date, minMinutes })
}

export async function getLiveLessonTracking(lessonId: string): Promise<EadLiveTracking[]> {
  return apiRequest<EadLiveTracking[]>(`/api/ead/live?lessonId=${lessonId}`)
}


