// Depoimentos exibidos na página inicial.
// IMPORTANTE: estes são textos de exemplo (placeholder). Substitua pelos depoimentos
// reais dos seus alunos antes de divulgar a página — nome, polo e frase.
export type Testimonial = {
  id: string
  name: string
  role: string
  polo: string
  quote: string
  // Opcional: URL de uma foto do aluno (ex: link do Supabase Storage ou qualquer imagem pública).
  // Se não informar, o card mostra um avatar com as iniciais do nome.
  photoUrl?: string
}

export const TESTIMONIALS: Testimonial[] = []
