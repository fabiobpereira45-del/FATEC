// Fonte única da identidade visual e institucional.
// Para trocar de instituição, altere apenas este arquivo (e o logo em /public).

export const BRAND = {
  name: "Faculdade de Teologia e Cultura",
  shortName: "FATEC",
  slogan: "Desde 2005",
  logo: "/FATEC.png",
  siteUrl: "https://fatec-rho.vercel.app",
  // Domínio fictício usado para contas de aluno criadas a partir do CPF
  emailDomain: "student.fatec.com.br",
  // Prefixo das chaves do localStorage, para não colidir com outras instalações
  storagePrefix: "fatec_",
  colors: {
    background: "#000000",
    gold: "#B8962E",
    olive: "#6B6B2E",
    white: "#FFFFFF",
  },
} as const
