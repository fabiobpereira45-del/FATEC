-- =============================================================================
-- FATEC - schema do Neon (PostgreSQL)
-- Derivado das interfaces de lib/store.ts e lib/books.ts.
-- Autenticação (user, session, account, verification) vem do Better Auth:
-- ver sql/auth-schema.sql (gerado pelo @better-auth/cli).
-- Para revisar antes de aplicar. Banco novo, sem dados.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Institucional e acadêmico ────────────────────────────────────────────────

CREATE TABLE semesters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  order_index   int  NOT NULL DEFAULT 0,
  shift         text,
  modality      text,
  polo_id       text,
  is_concluded  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disciplines (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  description        text,
  semester_id        uuid REFERENCES semesters(id) ON DELETE SET NULL,
  semester_order     int,
  semester_name      text,
  polo_id            text,
  professor_name     text,
  day_of_week        text,
  shift              text,
  order_index        int NOT NULL DEFAULT 0,
  application_month  text,
  application_year   text,
  is_concluded       boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_materials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id  uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  file_url       text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  shift         text NOT NULL CHECK (shift IN ('morning','afternoon','evening','ead')),
  day_of_week   text,
  max_students  int NOT NULL DEFAULT 30,
  modality      text CHECK (modality IN ('presencial','semi_presencial','online')),
  polo_id       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE class_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  discipline_id   uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  professor_name  text,
  day_of_week     text,
  time_start      text,
  time_end        text,
  lessons_count   int NOT NULL DEFAULT 0,
  workload        int NOT NULL DEFAULT 0,
  start_date      date,
  end_date        date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE class_curriculum (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id           uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  discipline_id      uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  order_index        int NOT NULL DEFAULT 0,
  application_month  text,
  application_year   text,
  is_concluded       boolean NOT NULL DEFAULT false,
  professor_name     text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ── Professores (perfil; login fica no Better Auth, tabela "user") ───────────

CREATE TABLE professor_accounts (
  id          text PRIMARY KEY,               -- = user.id do Better Auth
  role        text NOT NULL CHECK (role IN ('master','professor','secretary')),
  avatar_url  text,
  bio         text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE professor_disciplines (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id   text NOT NULL REFERENCES professor_accounts(id) ON DELETE CASCADE,
  discipline_id  uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professor_id, discipline_id)
);

-- ── Alunos ───────────────────────────────────────────────────────────────────

CREATE TABLE students (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id       text UNIQUE,            -- = user.id do Better Auth
  name               text NOT NULL,
  email              text NOT NULL,
  cpf                text NOT NULL UNIQUE,
  enrollment_number  text NOT NULL UNIQUE,
  phone              text,
  address            text,
  church             text,
  pastor_name        text,
  class_id           uuid REFERENCES classes(id) ON DELETE SET NULL,
  payment_status     text,
  avatar_url         text,
  bio                text,
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','inactive')),
  polo_id            text,
  modality           text CHECK (modality IN ('presencial','semi_presencial','online')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attendances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  discipline_id  uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  date           date NOT NULL,
  is_present     boolean NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, discipline_id, date)
);

CREATE TABLE attendance_locks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id  uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  date           date NOT NULL,
  locked_by      text NOT NULL,
  locked_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (discipline_id, date)
);

CREATE TABLE chats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  discipline_id    uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  message          text NOT NULL,
  is_from_student  boolean NOT NULL,
  read             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Avaliações ───────────────────────────────────────────────────────────────

CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id   uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('multiple-choice','true-false','discursive','incorrect-alternative','fill-in-the-blank','matching')),
  text            text NOT NULL,
  choices         jsonb NOT NULL DEFAULT '[]'::jsonb,
  pairs           jsonb,
  correct_answer  text NOT NULL DEFAULT '',
  points          numeric(6,2) NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assessments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  discipline_id        uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  professor            text,
  institution          text,
  question_ids         jsonb NOT NULL DEFAULT '[]'::jsonb,
  points_per_question  numeric(6,2) NOT NULL DEFAULT 1,
  total_points         numeric(8,2) NOT NULL DEFAULT 0,
  open_at              timestamptz,
  close_at             timestamptz,
  is_published         boolean NOT NULL DEFAULT false,
  archived             boolean NOT NULL DEFAULT false,
  shuffle_variants     boolean NOT NULL DEFAULT false,
  time_limit_minutes   int,
  logo_base64          text,
  rules                text,
  release_results      boolean NOT NULL DEFAULT false,
  modality             text CHECK (modality IN ('public','private')),
  is_final_exam        boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_submissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id         uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id            uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name          text,
  student_email         text,
  answers               jsonb NOT NULL DEFAULT '[]'::jsonb,
  score                 numeric(8,2) NOT NULL DEFAULT 0,
  total_points          numeric(8,2) NOT NULL DEFAULT 0,
  percentage            numeric(6,2) NOT NULL DEFAULT 0,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  time_elapsed_seconds  int NOT NULL DEFAULT 0,
  focus_lost_count      int NOT NULL DEFAULT 0,
  UNIQUE (assessment_id, student_id)
);

CREATE TABLE student_grades (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid REFERENCES students(id) ON DELETE CASCADE,
  student_identifier  text,                   -- CPF/e-mail legado
  student_name        text,
  discipline_id       uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  is_public           boolean NOT NULL DEFAULT false,
  exam_grade          numeric(6,2) NOT NULL DEFAULT 0,
  works_grade         numeric(6,2) NOT NULL DEFAULT 0,
  seminar_grade       numeric(6,2) NOT NULL DEFAULT 0,
  participation_bonus numeric(6,2) NOT NULL DEFAULT 0,
  attendance_score    numeric(6,2) NOT NULL DEFAULT 0,
  custom_divisor      numeric(6,2) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE grade_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_weight     numeric(6,2) NOT NULL DEFAULT 0,
  test_weight     numeric(6,2) NOT NULL DEFAULT 0,
  work_weight     numeric(6,2) NOT NULL DEFAULT 0,
  bonus_weight    numeric(6,2) NOT NULL DEFAULT 0,
  presence_value  numeric(6,2) NOT NULL DEFAULT 0,
  divisor         numeric(6,2) NOT NULL DEFAULT 1,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Desafios ─────────────────────────────────────────────────────────────────

CREATE TABLE challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id   uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  week            int NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  type            text NOT NULL CHECK (type IN ('riddle','quiz','reflection','decoding')),
  content         jsonb,
  correct_answer  text,
  points          numeric(6,2) NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE challenge_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  answer          text NOT NULL,
  is_correct      boolean NOT NULL DEFAULT false,
  earned_points   numeric(6,2) NOT NULL DEFAULT 0,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

-- ── EAD ──────────────────────────────────────────────────────────────────────

CREATE TABLE ead_lessons (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id             uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  title                     text NOT NULL,
  description               text,
  video_url                 text NOT NULL,
  cover_url                 text,
  order_index               int NOT NULL DEFAULT 0,
  available_from            timestamptz,
  available_until           timestamptz,
  lesson_type               text CHECK (lesson_type IN ('recorded','live_meet')),
  meet_url                  text,
  live_date                 timestamptz,
  min_minutes_for_presence  int NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ead_live_tracking (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      uuid NOT NULL REFERENCES ead_lessons(id) ON DELETE CASCADE,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name   text,
  discipline_id  uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  date           date NOT NULL,
  joined_at      timestamptz NOT NULL DEFAULT now(),
  last_ping_at   timestamptz NOT NULL DEFAULT now(),
  total_seconds  int NOT NULL DEFAULT 0,
  is_validated   boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'online' CHECK (status IN ('online','offline'))
);

-- ── Financeiro ───────────────────────────────────────────────────────────────

CREATE TABLE financial_settings (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_fee             numeric(12,2) NOT NULL DEFAULT 0,
  monthly_fee                numeric(12,2) NOT NULL DEFAULT 0,
  enrollment_fee_online      numeric(12,2),
  monthly_fee_online         numeric(12,2),
  second_call_fee            numeric(12,2) NOT NULL DEFAULT 0,
  final_exam_fee             numeric(12,2) NOT NULL DEFAULT 0,
  total_months               int NOT NULL DEFAULT 0,
  pro_labore_fee_per_lesson  numeric(12,2) NOT NULL DEFAULT 0,
  credit_card_url            text,
  pix_key                    text,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- Chave de API do Asaas: acesso restrito ao master na aplicação.
CREATE TABLE asaas_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key     text NOT NULL,
  mode        text NOT NULL CHECK (mode IN ('sandbox','production')),
  pix_key     text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE paypal_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   text NOT NULL,
  secret      text NOT NULL,
  mode        text NOT NULL CHECK (mode IN ('sandbox','production')),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE financial_charges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid REFERENCES students(id) ON DELETE CASCADE,
  type                text NOT NULL CHECK (type IN ('enrollment','monthly','second_call','final_exam','other','expense')),
  description         text NOT NULL,
  amount              numeric(12,2) NOT NULL,
  due_date            date NOT NULL,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','cancelled','late','bolsa100','bolsa50','isento')),
  payment_date        timestamptz,
  payment_method      text CHECK (payment_method IN ('cartao','pix','dinheiro','other')),
  actual_paid_amount  numeric(12,2),
  discipline_id       uuid REFERENCES disciplines(id) ON DELETE SET NULL,
  professor_id        text REFERENCES professor_accounts(id) ON DELETE SET NULL,
  class_id            uuid REFERENCES classes(id) ON DELETE SET NULL,
  asaas_payment_id    text,
  pix_qrcode          text,
  pix_copy_paste      text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description  text NOT NULL,
  amount       numeric(12,2) NOT NULL,
  category     text NOT NULL,
  due_date     date NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  paid_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Biblioteca ───────────────────────────────────────────────────────────────

CREATE TABLE books (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  subtitle         text,
  author           text NOT NULL,
  publisher        text,
  publication_year text,
  isbn             text,
  category         text NOT NULL,
  cover_url        text,
  synopsis         text NOT NULL DEFAULT '',
  total_copies     int NOT NULL DEFAULT 1,
  available_copies int NOT NULL DEFAULT 1,
  location_shelf   text,
  polo_id          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE book_loans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id           uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title        text NOT NULL,
  book_author       text NOT NULL,
  book_cover_url    text,
  student_id        uuid REFERENCES students(id) ON DELETE SET NULL,
  student_name      text NOT NULL,
  student_email     text,
  student_phone     text,
  student_cpf       text,
  polo_id           text,
  requested_at      timestamptz NOT NULL DEFAULT now(),
  borrowed_at       timestamptz,
  due_date          timestamptz,
  returned_at       timestamptz,
  status            text NOT NULL DEFAULT 'reserved'
                      CHECK (status IN ('reserved','active','returned','late','cancelled')),
  notes             text,
  registered_by     text,
  renewed           boolean NOT NULL DEFAULT false,
  cancelled_at      timestamptz,
  cancelled_by      text CHECK (cancelled_by IN ('student','admin')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Site e registros ─────────────────────────────────────────────────────────

CREATE TABLE board_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  role        text NOT NULL,
  category    text NOT NULL,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE testimonials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  role          text,
  polo          text,
  quote         text NOT NULL,
  photo_url     text,
  is_published  boolean NOT NULL DEFAULT false,
  order_index   int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text,
  user_email  text,
  user_name   text,
  role        text,
  action      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Índices de consulta frequente ────────────────────────────────────────────
CREATE INDEX idx_disciplines_semester ON disciplines(semester_id);
CREATE INDEX idx_students_class       ON students(class_id);
CREATE INDEX idx_questions_discipline ON questions(discipline_id);
CREATE INDEX idx_assessments_disc     ON assessments(discipline_id);
CREATE INDEX idx_submissions_assess   ON student_submissions(assessment_id);
CREATE INDEX idx_charges_student      ON financial_charges(student_id);
CREATE INDEX idx_attendance_disc      ON attendances(discipline_id, date);
CREATE INDEX idx_loans_status         ON book_loans(status);
