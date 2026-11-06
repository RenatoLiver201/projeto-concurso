/**
 * Dados iniciais (concursos, assuntos, configurações) e fábricas de novos registros.
 */
import { today, uid } from "../lib/dates.js";

const defaultSettings = () => ({
  provisorio: true,
  concursoPrincipal: "",
  horasDia: [0, 0, 0, 0, 0, 0, 0],
  bufferPct: 15,
  sessaoMin: 50,
  revisaoMin: 25,
  maxAssuntosDia: 3,
  metaHorasSemana: 0,
  metaQuestoesSemana: 0,
  metaAcerto: 0.8,
  amostraMin: 10,
  segPorItemMeta: 106,
  intervalos: [1, 7, 30],
  estagio: "auto",
  simuladoDia: 6,
  simuladoMin: 120,
  pesos: {
    relevancia: 3,
    peso: 2,
    lacuna: 3,
    facilidade: 1,
    tempo: 1.5,
    esquecimento: 1.5,
    concursos: 1.5,
    proximidade: 2.5,
  },
  tiposErro: [
    "Falta de conhecimento",
    "Interpretação",
    "Desatenção",
    "Confusão conceitual",
    "Aplicação incorreta de fórmula",
    "Erro de cálculo",
    "Gestão de tempo",
    "Armadilha característica da questão",
  ],
  bloqueios: [],
  compromissos: "",
  ciclo: { itens: [], ptr: 0 },
  tema: "system",
});

const makeFact = (a, s, t, r) => ({
  id: a.slice(0, 3) + Math.random().toString(36).slice(2, 5),
  rotulo: a,
  valor: s,
  tipo: t,
  fonte: r || "",
});

const makeSource = (a, s, t) => ({
  id: Math.random().toString(36).slice(2, 7),
  titulo: a,
  url: s,
  tipo: t,
});

const DEFAULT_VERIFICATION_DATE = "2026-10-20";

function defaultConcursos() {
  return [
    {
      id: "cgu",
      ativo: true,
      orgao: "Controladoria-Geral da União (CGU)",
      cargo: "Auditor Federal de Finanças e Controle (AFFC)",
      area: "TI – Ciência de Dados",
      banca: "Cebraspe",
      edital: "Edital nº 1 – CGU – AFFC, de 08/10/2026 (DOU 09/10/2026)",
      status: "edital_publicado",
      prioridade: 5,
      dataProva: "2026-12-13",
      verificacao: DEFAULT_VERIFICATION_DATE,
      fatos: [
        makeFact(
          "Requisitos",
          "Diploma de nível superior em qualquer área (MEC); 18 anos na posse; direitos políticos; quitação eleitoral/militar; aptidão física e mental.",
          "oficial",
          "Edital nº 1, itens 3.1–3.2",
        ),
        makeFact(
          "Remuneração",
          "R$ 20.000,00 (subsídio inicial, Classe A, Padrão I)",
          "oficial",
          "Edital nº 1, item 4",
        ),
        makeFact(
          "Jornada",
          "40 horas semanais, regime estatutário (Lei 8.112/1990)",
          "oficial",
          "Edital nº 1, item 4",
        ),
        makeFact(
          "Vagas (Ciência de Dados)",
          "10 imediatas em Brasília; limite de classificados na especialidade: 54",
          "oficial",
          "Edital nº 1, item 5",
        ),
        makeFact(
          "Taxa de inscrição",
          "R$ 170,00 (Pix via PagTesouro)",
          "oficial",
          "Edital nº 1, item 7",
        ),
        makeFact(
          "Inscrição única",
          "Uma inscrição por CPF: não é possível concorrer em duas especialidades",
          "secundaria",
          "Magistrar Educacional",
        ),
        makeFact(
          "Pontuação C/E",
          "Cada erro anula um acerto; branco e marcação dupla valem zero",
          "secundaria",
          "Gran Cursos / Magistrar (confirmar no edital completo)",
        ),
        makeFact(
          "Notas mínimas",
          "P1 ≥ 8 · P2 ≥ 12 · P3 ≥ 54 · soma objetivas ≥ 78 · P4 ≥ 50",
          "secundaria",
          "Gran Cursos / Magistrar (confirmar no edital completo)",
        ),
      ],
      blocos: [
        {
          id: "cgu-p1",
          nome: "P1 · Conhecimentos básicos",
          tipo: "objetiva",
          itens: 40,
          peso: 1,
          notaMin: 8,
        },
        {
          id: "cgu-p2",
          nome: "P2 · Conhecimentos complementares",
          tipo: "objetiva",
          itens: 40,
          peso: 1,
          notaMin: 12,
        },
        {
          id: "cgu-p3",
          nome: "P3 · Conhecimentos específicos",
          tipo: "objetiva",
          itens: 90,
          peso: 2,
          notaMin: 54,
        },
        {
          id: "cgu-p4",
          nome: "P4 · Discursiva (2 questões)",
          tipo: "discursiva",
          itens: 2,
          peso: null,
          notaMin: 50,
          pontosMax: 100,
        },
      ],
      scoring: {
        modelo: "Cebraspe certo/errado",
        acerto: 1,
        erro: 1,
        nota: "Peso do bloco multiplica acerto e erro. Fonte secundária; confirmar no edital completo.",
      },
      prazos: [
        {
          id: "p1",
          rotulo: "Fim das inscrições",
          data: "2026-11-04",
          tipo: "oficial",
        },
        {
          id: "p2",
          rotulo: "Limite para pagar a taxa",
          data: "2026-11-06",
          tipo: "oficial",
        },
        {
          id: "p3",
          rotulo: "Consulta aos locais de prova",
          data: "2026-12-02",
          tipo: "oficial",
        },
        {
          id: "p4",
          rotulo: "Provas objetiva e discursiva",
          data: "2026-12-13",
          tipo: "oficial",
        },
        {
          id: "p5",
          rotulo: "Resultado final da objetiva",
          data: "2027-01-14",
          tipo: "secundaria",
        },
        {
          id: "p6",
          rotulo: "Resultado final do concurso",
          data: "2027-04-15",
          tipo: "secundaria",
        },
      ],
      fontes: [
        makeSource(
          "Edital nº 1 – CGU – AFFC (PDF, Cebraspe)",
          "https://cdn.cebraspe.org.br/concursos/cgu_26_affc/arquivos/C7A60D15CB0DDDFA92233056D728C555505D6B935D7048646D49445EB346F825.pdf",
          "oficial",
        ),
        makeSource(
          "Cebraspe · divulgação do edital",
          "https://www.cebraspe.org.br/cgu-divulga-edital-para-cargos-de-auditor-federal-de-financas-e-controle/",
          "oficial",
        ),
        makeSource(
          "gov.br/CGU · publicação do edital",
          "https://www.gov.br/cgu/pt-br/assuntos/noticias/2026/defeso-eleitoral/cgu-publica-edital-de-concurso-para-60-vagas-de-auditor-federal-de-financas-e-controle",
          "oficial",
        ),
        makeSource(
          "Gran Cursos · cronograma, provas e pontuação",
          "https://blog.grancursosonline.com.br/concurso-cgu/",
          "secundaria",
        ),
        makeSource(
          "Magistrar · estrutura das provas",
          "https://magistrarcursos.com.br/blog/concurso-cgu-como-serao-as-provas-do-certame-entenda/",
          "secundaria",
        ),
        makeSource(
          "Direção Concursos · o que estudar",
          "https://www.direcaoconcursos.com.br/noticias/concurso-cgu-o-que-estudar-2026",
          "secundaria",
        ),
      ],
      pendencias: [
        "Subtópicos oficiais do conteúdo programático (anexo do edital): só as macroáreas foram obtidas",
        "Confirmar pesos, notas mínimas e regra do erro no edital completo (hoje vêm de fonte secundária)",
        "Confirmar a data do gabarito preliminar (fontes divergem: 15/12 ou 18/12)",
        "Confirmar que a inscrição foi feita (prazo até 04/11/2026)",
      ],
    },
    {
      id: "sefazdf",
      ativo: true,
      orgao: "Secretaria de Fazenda do Distrito Federal (SEFAZ-DF)",
      cargo: "Auditor Fiscal",
      area: "Receita do DF",
      banca: "Cebraspe",
      edital: "Edital não publicado. Referência histórica: edital de 2019.",
      status: "banca_definida",
      prioridade: 3,
      dataProva: "",
      verificacao: DEFAULT_VERIFICATION_DATE,
      fatos: [
        makeFact(
          "Autorização",
          "Concurso autorizado em 23/12/2024 (publicado no DODF em 26/12/2024)",
          "secundaria",
          "Estratégia Concursos",
        ),
        makeFact(
          "Banca",
          "Cebraspe, contrato formalizado; 1º termo aditivo de 11/06/2026",
          "secundaria",
          "Estratégia Concursos / Gran Cursos",
        ),
        makeFact(
          "Vagas",
          "265 (115 imediatas + 150 cadastro de reserva)",
          "secundaria",
          "Estratégia Concursos",
        ),
        makeFact(
          "Vencimento básico",
          "R$ 23.597,07 (com gratificações pode passar de R$ 36 mil)",
          "secundaria",
          "Estratégia Concursos; confirmar no edital",
        ),
        makeFact(
          "Requisitos",
          "Nível superior em qualquer área",
          "secundaria",
          "Gran Cursos; confirmar no edital",
        ),
        makeFact(
          "Prova esperada",
          "Objetiva com 150 itens certo/errado + discursiva (2 questões de até 20 linhas e dissertação de até 60) no mesmo domingo",
          "projecao",
          "Estratégia Concursos; sem edital",
        ),
        makeFact(
          "Edital 2019",
          "120 vagas, Cespe/Cebraspe, 40 h; Administração Pública incluída com 6 questões",
          "historico",
          "Direção Concursos",
        ),
      ],
      blocos: [],
      scoring: {
        modelo: "Cebraspe certo/errado (hipótese)",
        acerto: 1,
        erro: 1,
        nota: "Hipótese: confirmar no edital, que ainda não saiu.",
      },
      prazos: [],
      fontes: [
        makeSource(
          "Estratégia · Sefaz DF 2026",
          "https://portal.estrategia.com/concursos/concurso-sefaz-df-2026-edital-proximo-com-265-oportunidades/",
          "secundaria",
        ),
        makeSource(
          "Gran Cursos · Sefaz DF",
          "https://blog.grancursosonline.com.br/concurso-sefaz-df/",
          "secundaria",
        ),
        makeSource(
          "Direção Concursos · edital 2019",
          "https://www.direcaoconcursos.com.br/noticias/edital-sefaz-df",
          "historico",
        ),
      ],
      pendencias: [
        "Edital (conteúdo programático, pesos, data de prova, remuneração)",
        "Fonte oficial (DODF / Cebraspe) para confirmar vagas e remuneração",
      ],
    },
    {
      id: "sesdf",
      ativo: true,
      orgao: "Secretaria de Estado de Saúde do DF (SES-DF)",
      cargo: "Especialista em Saúde – Estatístico (a confirmar)",
      area: "Especialista em Saúde",
      banca: "Cebraspe",
      edital: "Edital não publicado. Referência histórica: concurso de 2018 (IADES).",
      status: "banca_definida",
      prioridade: 3,
      dataProva: "",
      verificacao: DEFAULT_VERIFICATION_DATE,
      fatos: [
        makeFact(
          "Banca",
          "Cebraspe: contrato nº 058085/2026, assinado em 08/10/2026, extrato no DODF de 13/10/2026",
          "secundaria",
          "Nova Concursos (cita o DODF)",
        ),
        makeFact(
          "Vagas",
          "2.379 (322 imediatas + 2.057 cadastro de reserva); distribuição por especialidade não divulgada",
          "secundaria",
          "Nova Concursos",
        ),
        makeFact(
          "Cargo noticiado",
          "Especialista em Saúde Pública. A especialidade Estatístico NÃO apareceu em nenhuma fonte consultada",
          "hipotese",
          "Pesquisa de 20/10/2026",
        ),
        makeFact(
          "Remuneração",
          "R$ 3.055 (20 h) a R$ 6.110 (40 h) iniciais, Lei 5.249/2013. O valor de ~R$ 4,2 mil do planejamento não foi confirmado",
          "secundaria",
          "Gran Cursos / Nova Concursos",
        ),
        makeFact(
          "Prova de 2018 (IADES)",
          "50 itens de múltipla escolha: 25 básicos (Português 8, Raciocínio lógico e matemática 4, leis do GDF 5, SUS 5, atualidades 3) + 25 específicos",
          "historico",
          "Gran Cursos",
        ),
      ],
      blocos: [],
      scoring: {
        modelo: "A definir",
        acerto: 1,
        erro: 0,
        nota: "Sem regra confirmada.",
      },
      prazos: [],
      fontes: [
        makeSource(
          "Nova Concursos · banca e vagas",
          "https://www.novaconcursos.com.br/portal/?p=316716",
          "secundaria",
        ),
        makeSource(
          "Gran Cursos · edital anterior",
          "https://blog.grancursosonline.com.br/edital-ses-df/amp/",
          "historico",
        ),
      ],
      pendencias: [
        "Confirmar se existe a especialidade Estatístico no novo edital",
        "Edital: conteúdo, pesos, requisitos (registro no CONRE?)",
        "Conferir o edital de 2018 diretamente: o PDF do IADES encontrado era de residência, não do concurso",
      ],
    },
    {
      id: "bacen",
      ativo: true,
      orgao: "Banco Central do Brasil (BACEN)",
      cargo: "Auditor",
      area: "Áreas ainda não divulgadas",
      banca: "A definir (meta interna: até 16/10/2026)",
      edital: "Edital não publicado. Prazo legal para publicar: até 03/01/2027.",
      status: "autorizado",
      prioridade: 3,
      dataProva: "",
      verificacao: DEFAULT_VERIFICATION_DATE,
      fatos: [
        makeFact(
          "Autorização",
          "Autorizado em julho/2026 pelo MGI: 170 vagas (100 Auditor, 50 Técnico, 20 Procurador)",
          "secundaria",
          "Gran Cursos (sem número da portaria)",
        ),
        makeFact(
          "Banca",
          "Ainda não definida; meta de contratação até 16/10/2026 não é compromisso formal",
          "secundaria",
          "Gran Cursos",
        ),
        makeFact(
          "Remuneração",
          "Faixa citada de R$ 8,3 mil a R$ 27,6 mil, sem separar por cargo",
          "secundaria",
          "Gran Cursos",
        ),
        makeFact(
          "Edital de 2024 (referência)",
          "Foi para ANALISTA (Economia e Finanças ou TI), Cebraspe, 40 h, R$ 20.924,80. Não era Auditor",
          "historico",
          "Edital nº 1 – BCB, 15/01/2024 (oficial)",
        ),
        makeFact(
          "Pontuação 2024",
          "Acerto +1, erro −0,5; P1 50 itens (mín. 10), P2 70 itens (mín. 21), conjunto mín. 36; discursivas mín. 40",
          "historico",
          "Edital nº 1 – BCB/2024",
        ),
        makeFact(
          "Ciência de Dados em 2024",
          "14 de 70 itens da P2 da área de TI",
          "historico",
          "Edital nº 1 – BCB/2024",
        ),
      ],
      blocos: [],
      scoring: {
        modelo: "Referência 2024: acerto +1, erro −0,5",
        acerto: 1,
        erro: 0.5,
        nota: "Apenas histórico; a regra de 2026 depende do edital.",
      },
      prazos: [
        {
          id: "b1",
          rotulo: "Prazo legal para publicar o edital",
          data: "2027-01-03",
          tipo: "secundaria",
        },
      ],
      fontes: [
        makeSource(
          "Edital nº 1 – BCB/2024 (Analista)",
          "https://www.bcb.gov.br/content/acessoinformacao/analista_2024/Edital-n-1-de-Abertura-do-concurso.pdf",
          "oficial",
        ),
        makeSource(
          "Gran Cursos · BACEN banca e prazos",
          "https://blog.grancursosonline.com.br/concurso-bacen-pca-escolha-banca-2026/",
          "secundaria",
        ),
      ],
      pendencias: [
        "Portaria de autorização (número e data) no DOU",
        "Banca e edital",
        "Áreas e conteúdo do cargo Auditor",
        "Conferir se o plano de estudo deve se basear no edital de Analista 2024 como proxy",
      ],
    },
  ];
}

const seedTopic = (a, s, t, r) => ({
  id: a,
  concursos: ["cgu"],
  disciplina: s,
  nome: t,
  parentId: null,
  blocoId: r,
  relevancia: 3,
  dificuldade: 3,
  estMin: 180,
  status: "nao_iniciado",
  familiaridade: "nao_avaliada",
  notas: "",
  materiais: "",
  subPendentes: true,
  rev: {
    stage: 0,
    due: null,
    lapses: 0,
    history: [],
  },
});

function defaultTopics() {
  return [
    seedTopic(
      "b1",
      "Conhecimentos Básicos",
      "Estado, democracia, direitos e ciência política",
      "cgu-p1",
    ),
    seedTopic(
      "b2",
      "Conhecimentos Básicos",
      "Sociedade brasileira, desigualdades, diversidade e desenvolvimento",
      "cgu-p1",
    ),
    seedTopic(
      "b3",
      "Conhecimentos Básicos",
      "Ética pública e responsabilidade profissional",
      "cgu-p1",
    ),
    seedTopic(
      "b4",
      "Conhecimentos Básicos",
      "Administração pública e fundamentos de políticas públicas",
      "cgu-p1",
    ),
    seedTopic(
      "c1",
      "Conhecimentos Complementares",
      "Governança, riscos e integridade pública e privada",
      "cgu-p2",
    ),
    seedTopic(
      "c2",
      "Conhecimentos Complementares",
      "Transparência, ouvidoria e participação social",
      "cgu-p2",
    ),
    seedTopic(
      "c3",
      "Conhecimentos Complementares",
      "Direito público aplicado, controle e responsabilização",
      "cgu-p2",
    ),
    seedTopic(
      "c4",
      "Conhecimentos Complementares",
      "Evidências, dados e inteligência artificial",
      "cgu-p2",
    ),
    seedTopic(
      "c5",
      "Conhecimentos Complementares",
      "Auditoria governamental e atuação integrada da CGU",
      "cgu-p2",
    ),
    seedTopic(
      "e1",
      "Específicos · Ciência de Dados",
      "Estatística, programação e análise de dados",
      "cgu-p3",
    ),
    seedTopic(
      "e2",
      "Específicos · Ciência de Dados",
      "Engenharia, arquitetura e governança de dados",
      "cgu-p3",
    ),
    seedTopic(
      "e3",
      "Específicos · Ciência de Dados",
      "Aprendizado de máquina e inteligência artificial",
      "cgu-p3",
    ),
    seedTopic(
      "e4",
      "Específicos · Ciência de Dados",
      "Operação, governança e gestão de soluções de dados e IA",
      "cgu-p3",
    ),
  ];
}

export function createInitialState({ legacyExamples = false } = {}) {
  return {
    v: 1,
    settings: defaultSettings(),
    concursos: legacyExamples ? defaultConcursos() : [],
    topics: legacyExamples ? defaultTopics() : [],
    sessions: [],
    questions: [],
    simulados: [],
    notebooks: [],
    decisions: [],
  };
}

export const newConcurso = () => ({
  id: uid(),
  ativo: true,
  orgao: "",
  cargo: "",
  area: "",
  banca: "",
  edital: "",
  status: "previsto",
  prioridade: 3,
  dataProva: "",
  verificacao: today(),
  fatos: [],
  blocos: [],
  scoring: {
    modelo: "",
    acerto: 1,
    erro: 0,
    nota: "Sem penalização por erro presumida; verificar o edital.",
  },
  prazos: [],
  fontes: [],
  pendencias: [],
});

export const newTopic = (a) => ({
  id: uid(),
  concursos: a.settings.concursoPrincipal ? [a.settings.concursoPrincipal] : [],
  disciplina: "",
  nome: "",
  parentId: null,
  blocoId: "",
  relevancia: 3,
  dificuldade: 3,
  estMin: 180,
  status: "nao_iniciado",
  familiaridade: "nao_avaliada",
  notas: "",
  materiais: "",
  subPendentes: false,
  rev: {
    stage: 0,
    due: null,
    lapses: 0,
    history: [],
  },
});

export const newQuestion = (a) => {
  let s = a.concursos.find((t) => t.id === a.settings.concursoPrincipal);
  return {
    id: uid(),
    date: today(),
    concursoId: s?.id || "",
    banca: s?.banca?.split(" ")[0] || "",
    topicId: "",
    fonte: "",
    correto: true,
    tempoSeg: null,
    tipoErro: "",
    justificativa: "",
    confianca: 3,
    revisar: false,
    notebookRef: "",
  };
};

export const newSimuladoRow = () => ({
  id: uid(),
  nome: "",
  itens: 0,
  acertos: 0,
  erros: 0,
  brancos: 0,
  peso: 1,
  notaMin: null,
  topicId: "",
});

export const rowsFromConcurso = (a) =>
  (a?.blocos || [])
    .filter((s) => s.tipo === "objetiva")
    .map((s) => ({
      id: uid(),
      nome: s.nome,
      itens: s.itens,
      acertos: 0,
      erros: 0,
      brancos: s.itens,
      peso: s.peso ?? 1,
      notaMin: s.notaMin,
      topicId: "",
    }));

export const newNotebookEntry = (a) => ({
  id: uid(),
  notebook: "",
  concursoId: a.settings.concursoPrincipal,
  fonte: "",
  pagina: "",
  topicId: "",
  resumo: "",
  duvidas: "",
  link: "",
  atualizado: today(),
});
