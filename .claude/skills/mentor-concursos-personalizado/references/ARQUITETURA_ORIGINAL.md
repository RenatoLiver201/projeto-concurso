# Mapeamento real do projeto ZIP (06/11/2026)

Fonte: código `projeto.zip` enviado pelo usuário, extraído em `projeto/`. A documentação PDF dentro do projeto descreve a mesma estrutura. Não confundir este inventário com uma implementação já personalizada.

## Stack e navegação
- React 18.3.1, Vite 5, Tailwind 3.4.17, lucide-react, gráficos SVG/CSS; arquivo `package.json` com scripts `dev`, `build`, `preview`, `format`.
- Roteamento por `location.hash` implementado em `src/App.jsx` (`NAV_ITEMS` e `routeFromHash`).
- Contexto central via `src/context/AppContext.js`; estado e handlers em `src/App.jsx`.
- Tema e tokens CSS em `src/index.css`, `tailwind.config.js`; preservar layout claro/escuro/system e menus responsivos.
- Componentes reutilizáveis `src/components/ui/{Badge,Button,Card,Modal,feedback,form,table}.jsx`, gráficos `src/components/charts` e `src/components/SessionModal.jsx`.

## Dez telas que não devem desaparecer
| Rota | Componente | Contrato de preservação |
|---|---|---|
| `#hoje` | `TodayScreen.jsx` | próxima melhor ação, métricas, riscos |
| `#concursos` | `ConcursosScreen.jsx` | seleção, fontes, fatos, blocos, pendências, comparação |
| `#matriz` | `MatrixScreen.jsx` | disciplinas, temas/subtemas, prioridades, diagnóstico, importação em massa |
| `#cronograma` | `ScheduleScreen.jsx` | semana, mês, ciclo e backlog, plano/replanejamento |
| `#revisoes` | `ReviewsScreen.jsx` | revisão espaçada e registro de resultado |
| `#questoes` | `QuestionsScreen.jsx` | registro e lote, caderno de erros, confiança versus acerto |
| `#simulados` | `SimuladosScreen.jsx` | blocos, pontuação configurável e evolução |
| `#notebook` | `NotebookScreen.jsx` | organização de notas e prompts para NotebookLM |
| `#relatorio` | `ReportScreen.jsx` | relatório semanal e nível de evidência |
| `#config` | `SettingsScreen.jsx` | horários, bloqueios, metas, pesos, tema e backups |

## Modelos em produção
`src/data/defaults.js` contém `createInitialState()`, `newConcurso()`, `newTopic()`, `newQuestion()`, `newSimuladoRow()`, `rowsFromConcurso()` e `newNotebookEntry()`.

Estado inicial **real**:
```js
{
  v: 1,
  settings,
  concursos,
  topics,
  sessions: [],
  questions: [],
  simulados: [],
  notebooks: [],
  decisions: []
}
```

`settings` inclui `concursoPrincipal`, `horasDia` (**minutos**, ordem segundo `weekdayIndex`, conferir `src/lib/dates.js`), `bufferPct`, `sessaoMin`, `revisaoMin`, `maxAssuntosDia`, `metaHorasSemana`, `metaQuestoesSemana`, `metaAcerto`, `intervalos`, `estagio`, `simuladoDia`, `simuladoMin`, `pesos`, `bloqueios`, `ciclo`, `tema`.

`newConcurso()` cria `id`, `ativo`, `orgao`, `cargo`, `area`, `banca`, `edital`, `status`, `prioridade`, `dataProva`, `verificacao`, `fatos`, `blocos`, `scoring`, `prazos`, `fontes`, `pendencias`.

`newTopic()` cria `id`, `concursos: []`, `disciplina`, `nome`, `parentId`, `blocoId`, `relevancia`, `dificuldade`, `estMin`, `status`, `familiaridade`, `notas`, `materiais`, `subPendentes` e `rev {stage,due,lapses,history}`. Para novo perfil sem principal, não aceitar `[undefined]` em `concursos`.

`sessions` são objetos com `id`, `date`, `status`, `plannedMin`, `actualMin`, `notes`, `prioridade`, `auto`, `why`, `tipo`, `topicIds`, `concursoIds` (ver `generatePlan`).

`questions` têm `concursoId`, `banca`, `topicId`, `correto`, `tempoSeg`, `tipoErro`, `justificativa`, `confianca`, `revisar`.

`simulados` contêm linhas `rows` com `itens`, `acertos`, `erros`, `brancos`, `peso`, `notaMin`, `topicId`; a estrutura definitiva deve ser verificada na tela correspondente antes da migração.

## Motor atual
`src/lib/planner.js`: `computePriorities`, `classifyTopic`, `computeReview`, `applyReview`, `scheduleFirstReview`, `dueReviews`, `netMinutes`, `grossMinutes`, `plannedMinutes`, `currentStage`, `generatePlan`, `replanOverdue`, `coverageStats`, `buildAlerts`, `nextBestAction`, `weekSummary`, `errorBreakdown`.

`s​​​​rc/lib/stats.js`: cálculos de questões, tempo, intervalo de Wilson, score de simulado. Preserve cálculos, mas remova suposições de banca dos textos e generalize as regras quando necessário.

## Persistência
- `src/data/storage.js`: chave `localStorage` **`prep-concursos-v1`**; objetos `v: 1`, sincronização opcional por `window.claude.use("db")`.
- `src/lib/backup.js`: exportação JSON/CSV e `validateBackup` para esquema v1.
- Importar backup na tela de configurações atualmente substitui o estado inteiro: adicionar proteção e confirmação.
- A documentação indica app sem backend; novos perfis ficam isolados **nesse navegador** até que se implemente autenticação/sincronização explícita, que não está incluída na base.

## Critério da interface-mestre
O conjunto dos 10 componentes/screens, o menu, a hierarquia visual, espaçamento, cores, layout mobile e semântica de UX são a **referência**. Acrescente onboarding modular, seletor de perfil e origem das fontes no mesmo sistema de design. Não use "clone visual" gerado do zero.
