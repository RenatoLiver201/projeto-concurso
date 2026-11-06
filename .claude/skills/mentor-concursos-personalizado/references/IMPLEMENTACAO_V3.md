# Projeto personalizado — V3 já implementado

Não reimplementar do zero: o projeto entregue neste ZIP já tem onboarding e gestão de perfis. Estas modificações são o estado atual e devem ser preservadas em futuras tarefas do Claude Code:

- `src/App.jsx`: gerencia `workspace` com perfil ativo, switcher no menu, wizard guiado, atualização da tela ativa e export/import de perfis. As dez telas originais permanecem.
- `src/data/defaults.js`: `createInitialState()` começa vazio, com horas 0; dados históricos CGU/SEFAZ-DF/SES-DF/BACEN só são acessíveis via `createInitialState({legacyExamples:true})`, não são semeados na instalação nova.
- `src/data/workspace.js`: novo `localStorage` `prep-concursos-workspace-v2`, migração de `prep-concursos-v1` sem apagar a chave antiga; troca e importação de perfis isolados.
- `src/components/Onboarding.jsx`: entrevista em quatro etapas, cadastro concurso/cargo/banca, análise da origem do edital, upload e revisão de tópicos, horários por dia, preferências e geração inicial de sessões.
- `src/lib/edital.js`, `src/lib/editalFile.js`: TXT/CSV/JSON locais; PDF pesquisável requer carregar PDF.js da CDN quando selecionado, mas o documento não é enviado para servidor. PDF escaneado não é OCR; pedir texto estruturado ao usuário.
- `src/lib/planner.js`: `activeTopics`, `dueReviews`, `computePriorities`, `generatePlan`, `regenerateUpcomingPlan` respeitam concursos ativos e disponibilidade. Regeneração preserva `feita`, `parcial` e sessões manuais.
- `src/screens/SettingsScreen.jsx`: exportação do perfil e workspace, importação como perfil novo, reset restrito ao perfil ativo.
- `src/screens/ScheduleScreen.jsx`: botão de atualizar planejamento para 4 semanas.
- `src/screens/QuestionsScreen.jsx` e `src/screens/SimuladosScreen.jsx`: pontuação usa regra cadastrada, não assume Cebraspe.
- `tests/mentor.test.js`: testes unitários via `npm test`.

Regras de evolução: preservar `prep-concursos-v1` e `prep-concursos-workspace-v2`; oferecer migrações com backup; não retirar componentes/telas; revisar fontes para cargos/anos e não inventar datas ou pesos. Se necessário, refinar heurísticas PDF e adicionar origem verificável, sempre com confirmação humana. Não apresentar os dados históricos do arquivo `defaults.js` como edital atual.
