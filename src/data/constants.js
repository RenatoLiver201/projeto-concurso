/**
 * Rótulos, tons de cor e tabelas fixas usadas pela interface e pelo motor de prioridades.
 */
export const CONCURSO_STATUS = {
  edital_publicado: {
    label: "Edital publicado",
    tone: "good",
  },
  autorizado: {
    label: "Concurso autorizado",
    tone: "info",
  },
  banca_definida: {
    label: "Banca definida",
    tone: "info",
  },
  anunciado: {
    label: "Anunciado oficialmente",
    tone: "warn",
  },
  previsto: {
    label: "Previsto / especulado",
    tone: "warn",
  },
  sem_perspectiva: {
    label: "Sem perspectiva oficial",
    tone: "muted",
  },
  historico: {
    label: "Histórico (só planejamento)",
    tone: "muted",
  },
};

export const SOURCE_KIND = {
  oficial: {
    label: "Oficial",
    tone: "good",
  },
  secundaria: {
    label: "Fonte secundária",
    tone: "warn",
  },
  historico: {
    label: "Histórico",
    tone: "muted",
  },
  projecao: {
    label: "Projeção",
    tone: "info",
  },
  hipotese: {
    label: "Hipótese",
    tone: "info",
  },
};

export const SESSION_TYPE_LABELS = {
  teoria: "Teoria",
  questoes: "Questões",
  revisao: "Revisão",
  simulado: "Simulado",
  correcao: "Correção de erros",
};

export const SESSION_TYPE_MODE = {
  teoria: "profundo",
  questoes: "consolidacao",
  revisao: "consolidacao",
  correcao: "consolidacao",
  simulado: "avaliacao",
};

export const MODE_LABELS = {
  profundo: "Estudo profundo",
  consolidacao: "Consolidação",
  avaliacao: "Avaliação",
};

export const SESSION_STATUS_LABELS = {
  planejada: "Planejada",
  feita: "Feita",
  parcial: "Parcial",
  adiada: "Adiada",
  cancelada: "Cancelada",
  backlog: "Backlog",
};

export const TOPIC_STATUS_LABELS = {
  nao_iniciado: "Não iniciado",
  estudando: "Estudando",
  estudado: "Teoria concluída",
};

export const FAMILIARITY_LABELS = {
  nao_avaliada: "Não avaliada",
  nenhuma: "Nunca estudei",
  pratica: "Uso na prática (não validado)",
  teoria: "Estudei a teoria",
};

export const CONFIDENCE_LABELS = {
  1: "Chute",
  2: "Baixa",
  3: "Média",
  4: "Alta",
  5: "Certeza",
};

export const STUDY_STAGES = {
  base: {
    label: "Base",
    profundo: 60,
    consolidacao: 30,
    avaliacao: 10,
  },
  consolidacao: {
    label: "Consolidação",
    profundo: 40,
    consolidacao: 45,
    avaliacao: 15,
  },
  reta_final: {
    label: "Reta final",
    profundo: 20,
    consolidacao: 45,
    avaliacao: 35,
  },
};

export const PRIORITY_FACTORS = {
  relevancia: {
    nome: "Relevância",
    ajuda: "Nota 1–5 que você atribui ao assunto (editável).",
  },
  peso: {
    nome: "Peso na prova",
    ajuda: "Pontos do bloco no edital ÷ nº de assuntos do bloco. Fica de fora quando não há dado.",
  },
  lacuna: {
    nome: "Lacuna de desempenho",
    ajuda:
      "1 − acerto suavizado (prior 50% com 4 questões de peso). Sem questões, vale 0,5: diagnóstico pendente.",
  },
  facilidade: {
    nome: "Custo baixo de aprender",
    ajuda: "Inverso da dificuldade (1–5). Favorece ganhos rápidos; use peso baixo.",
  },
  tempo: {
    nome: "Tempo desde o último contato",
    ajuda: "Dias desde a última sessão ou questão ÷ 30, limitado a 1. Nunca estudado = 1.",
  },
  esquecimento: {
    nome: "Taxa de esquecimento",
    ajuda: "Lapsos ÷ revisões feitas. Fica de fora com menos de 2 revisões.",
  },
  concursos: {
    nome: "Concursos beneficiados",
    ajuda: "Quantos concursos ativos usam o assunto, normalizado pelo máximo.",
  },
  proximidade: {
    nome: "Proximidade da prova",
    ajuda: "Só provas com data confirmada: 1 − dias/120. Fica de fora sem data.",
  },
};

export const CLASS_LABELS = {
  dominado: {
    nome: "Dominado",
    tone: "good",
  },
  parcial: {
    nome: "Parcialmente dominado",
    tone: "warn",
  },
  desconhecido: {
    nome: "Desconhecido / abaixo de 50%",
    tone: "crit",
  },
  pratica: {
    nome: "Prática, não validado em questões",
    tone: "info",
  },
  esquecimento: {
    nome: "Alto esquecimento",
    tone: "serious",
  },
  lento: {
    nome: "Velocidade é problema",
    tone: "serious",
  },
  pendente: {
    nome: "Diagnóstico pendente",
    tone: "muted",
  },
};

export const SESSION_TYPE_TONE = {
  teoria: "info",
  questoes: "good",
  revisao: "warn",
  simulado: "serious",
  correcao: "muted",
};

export const SESSION_STATUS_TONE = {
  planejada: "muted",
  feita: "good",
  parcial: "warn",
  adiada: "serious",
  cancelada: "muted",
  backlog: "muted",
};

export const REVIEW_OUTCOMES = {
  ok: ["Lembrei bem", "good"],
  parcial: ["Em parte", "warn"],
  esqueci: ["Esqueci", "crit"],
};

export const CORRECTNESS_BADGE = {
  true: ["Certa", "good"],
  false: ["Errada", "crit"],
  null: ["Em branco", "muted"],
};

export const EVIDENCE_BADGE = {
  suficiente: ["evidência suficiente", "good"],
  indicativa: ["indicativo", "warn"],
  insuficiente: ["dados insuficientes", "muted"],
};
