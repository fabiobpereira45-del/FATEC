"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react"

const FAQS = [
  {
    question: "Como funciona o pagamento da mensalidade?",
    answer: "Os valores de matrícula e mensalidade são informados na área de inscrição. O pagamento pode ser feito com total comodidade via PIX, Cartão de Crédito ou Boleto bancário através da nossa área financeira segura."
  },
  {
    question: "O curso é voltado apenas para pastores ou qualquer membro?",
    answer: "O curso é para todos os cristãos que desejam aprofundar seu conhecimento na Palavra de Deus: líderes, professores de EBD, diáconos, missionários, jovens e todo servo que queira entender com rigor a Teologia Bíblica e Sistemática."
  },
  {
    question: "Recebo certificado ao final do curso?",
    answer: "Sim! Ao concluir com aproveitamento os 3 semestres curriculares, você recebe o Certificado e Histórico Escolar Oficial emitido pelo Faculdade de Teologia e Cultura (FATEC), atestando sua formação acadêmica e ministerial."
  },
  {
    question: "Como posso estudar (presencial ou online)?",
    answer: "O FATEC disponibiliza turmas nos polos presenciais e também suporte para acompanhamento no formato EAD/Online, com acesso à plataforma onde você acompanha o calendário, avaliações e materiais didáticos."
  },
  {
    question: "Como faço a minha matrícula agora?",
    answer: "Basta clicar em qualquer botão 'Garantir Minha Vaga' ou 'Fazer Matrícula'. Você preencherá seus dados básicos, escolherá a turma/turno do seu polo e já receberá o acesso imediato ao sistema."
  }
]

export default function CursoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-amber-600 selection:text-white font-sans">
      
      {/* Barra de Aviso Superior */}
      <div className="bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#450a0a] border-b border-amber-500/20 text-center py-2 px-4 text-xs sm:text-sm font-semibold text-amber-200 tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
        <span>MATRÍCULAS ABERTAS PARA A NOVA TURMA — Vagas limitadas por polo com valor promocional!</span>
      </div>

      {/* Header Navegação */}
      <header className="sticky top-0 z-50 bg-[#0b1220]/95 backdrop-blur-md border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-16 h-16 shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/FATEC.png"
                alt="Brasão Oficial FATEC"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]"
              />
            </div>
            <div>
              <span className="block text-xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                FATEC
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-amber-400/90 font-medium">
                Faculdade de Teologia e Cultura
              </span>
              <span className="block text-[10px] text-slate-500">
                Aleteia · Sophia · Pistis
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#investimento" className="hover:text-amber-400 transition-colors">Mensalidade</a>
            <a href="#duvidas" className="hover:text-amber-400 transition-colors">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors"
            >
              Área do Aluno
            </Link>
            <Link
              href="/registrar"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Matricule-se Já</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        {/* Background Gradients & Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#7f1d1d]/30 via-amber-700/10 to-transparent blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-950/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Formação Ministerial & Teológica Rigorosa</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Aprofunde sua vocação e conheça as Escrituras com <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">autoridade bíblica</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                O <strong>Faculdade de Teologia e Cultura (FATEC)</strong> capacita líderes, obreiros e estudantes da Palavra com fidelidade exegética, ortodoxia teológica e prática eclesiástica transformadora.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/registrar"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base px-8 py-4 rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.5)] transition-all transform hover:-translate-y-0.5"
                >
                  <span>Matricule-se Já</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Selos de Confiança */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-slate-400 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Certificado Válido</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Professores Qualificados</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Presencial ou Online</span>
                </div>
              </div>

            </div>

            {/* Logo em destaque */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group w-full max-w-xs">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-[#7f1d1d] rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
                <div className="relative rounded-2xl border-2 border-amber-500/40 bg-[#0d1527] shadow-2xl p-10 flex items-center justify-center aspect-square">
                  <img
                    src="/FATEC.png"
                    alt="Brasão Oficial FATEC"
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NÚMEROS E IMPACTO */}
      <section className="border-y border-white/10 bg-[#0a101d]/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">18</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Disciplinas Teológicas</div>
              <div className="text-[11px] text-slate-500">Exegese, História e Doutrinas</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">3</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Semestres Completos</div>
              <div className="text-[11px] text-slate-500">Grade curricular balanceada</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">✓</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Certificado Reconhecido</div>
              <div className="text-[11px] text-slate-500">Emitido ao final do curso</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Fidelidade Bíblica</div>
              <div className="text-[11px] text-slate-500">Ortodoxia cristã inegociável</div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANO & INVESTIMENTO */}
      <section id="investimento" className="py-20 bg-[#070b13] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="space-y-4 mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              Transparência e Acessibilidade
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Investimento no seu Ministério
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Teologia de alta qualidade acessível a todos os irmãos e líderes.
            </p>
          </div>

          {/* Card Principal de Preço */}
          <div className="relative rounded-3xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border-2 border-amber-500/60 p-8 sm:p-12 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase px-5 py-2 rounded-full tracking-wider shadow-lg">
              Condição Especial para Nova Turma
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Mensalidade Regular do Curso
              </div>
              <p className="text-base text-slate-300 mt-4 mb-2 max-w-md mx-auto">
                Consulte os valores de matrícula e mensalidade na área de inscrição.
              </p>
              <p className="text-xs text-amber-300 font-medium mb-4">
                Sem taxa surpresa • Sem fidelidade abusiva
              </p>
            </div>

            {/* Material Didático */}
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl p-5 text-left mt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-white text-sm">Material Didático Incluso</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cada aluno recebe <strong className="text-amber-300">6 livros físicos</strong> — um por semestre, com 3 disciplinas cada — cobrindo todo o conteúdo do curso. O material é <strong className="text-amber-300">vitalício</strong>: fica definitivamente com o aluno para compor sua biblioteca pessoal.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 font-medium">6 livros físicos</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 font-medium">3 disciplinas por livro</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-medium">Seu para sempre ✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left my-10 py-8 border-y border-white/10 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>18 Disciplinas teológicas completas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Professores pastores e mestres</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>6 livros didáticos físicos inclusos</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Avaliações e testes de conhecimento</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Certificado e Histórico de Conclusão</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Pagamento facilitado no PIX ou Cartão</span>
              </div>
            </div>

            <Link
              href="/registrar"
              className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg px-8 py-5 rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1"
            >
              <span>Fazer Minha Matrícula Agora</span>
              <ArrowRight className="w-6 h-6" />
            </Link>

            <div className="mt-4 text-[12px] text-slate-500">
              Processamento seguro e garantia de vaga imediata na turma selecionada.
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="duvidas" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Tire Suas Dúvidas
          </span>
          <h2 className="text-3xl font-black text-white">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-[#0f172a]/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-200 hover:text-white"
                >
                  <span>{faq.question}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* BANNER FINAL CTA */}
      <section className="py-16 bg-gradient-to-r from-[#450a0a] via-[#1e293b] to-[#0f172a] border-t border-amber-500/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Texto CTA */}
            <div className="lg:col-span-2 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Pronto para dar o próximo passo na sua jornada bíblica?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                As turmas estão com matrículas abertas. Garanta sua vaga e comece a estudar com quem ama e ensina a Palavra com profundidade.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
                <Link
                  href="/registrar"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl text-base shadow-xl transition-all"
                >
                  <span>Matricule-se Já</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-4 rounded-xl text-sm border border-white/20 transition-all"
                >
                  <span>Acessar Painel Principal</span>
                </Link>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/60">
                {/* QR Code via API pública — aponta para fatec-rho.vercel.app */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://fatec-rho.vercel.app/&color=0f172a&bgcolor=ffffff"
                  alt="QR Code FATEC — fatec-rho.vercel.app"
                  width={160}
                  height={160}
                  className="block"
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Acesse pelo celular</div>
                <div className="text-[11px] text-slate-400 mt-0.5">fatec-rho.vercel.app</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050811] py-10 border-t border-white/10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo + Nome */}
            <div className="flex items-center gap-3">
              <img
                src="/FATEC.png"
                alt="Brasão FATEC"
                className="w-14 h-14 object-contain"
              />
              <div>
                <div className="text-slate-300 font-bold text-sm">FATEC — Faculdade de Teologia e Cultura</div>
                <div className="text-[11px] text-amber-500/80 mt-0.5">Aleteia · Sophia · Pistis</div>
              </div>
            </div>

            {/* Contato */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-[12px]">
              <a href="https://fatec-rho.vercel.app" target="_blank" rel="noopener noreferrer" className="text-amber-500/70 hover:text-amber-400 transition-colors">
                fatec-rho.vercel.app
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center sm:text-right">
              <div>© {new Date().getFullYear()} FATEC. Todos os direitos reservados.</div>
              <div className="mt-1 text-[11px] text-slate-600">
                Formação Teológica Cristã com Base nas Sagradas Escrituras.
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
