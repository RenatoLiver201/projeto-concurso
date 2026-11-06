# Relatório técnico — Integração do projeto.zip com Mentor de Concursos 2.0

## Escopo entregue

- Mantidos os componentes e dez módulos originais (Hoje, Concursos, Matriz, Cronograma, Revisões, Questões, Simulados, NotebookLM, Relatório e Configurações), com menu lateral, tema e Tailwind.
- Adicionado assistente de 4 etapas: estudante → concurso → edital/conteúdo → rotina, diagnóstico e plano.
- Adicionado gerenciamento de perfis com estado isolado em `prep-concursos-workspace-v2` e migração não destrutiva da chave `prep-concursos-v1` (se acessível na mesma origem).
- Adicionada importação de PDF pesquisável (pdf.js via CDN sob demanda), TXT, Markdown, CSV e JSON, com revisão humana das matérias, deduplicação por concurso e metadados de fonte.
- Corrigidos padrões pessoais: instalação nova não inclui concursos e ciclo específicos; metas/dias começam vazios.
- Corrigidos filtragem de assuntos ativos no motor, revisões de concursos inativos, simulado sem concurso principal, pontuação variável por edital e cálculo de déficit baseado em dados reais.
- Criado recurso de recalcular 4 semanas de sessões **automáticas futuras não iniciadas**, preservando concluídas, parciais e manuais.
- Backup JSON de perfil ativo e conjunto completo de perfis; importação não destrutiva como novos perfis.
- Incluída skill Claude Code 2.0 com referências de implementação V3.

## Testes executados

- `node --test tests/*.test.js`: **16 testes aprovados**.
- Análise sintática JS/JSX: 39 arquivos verificados usando TypeScript `createSourceFile`, **0 erros de sintaxe**.
- `node --check` para módulos JavaScript: passou.
- O comando `npm ci` **não pôde completar** neste ambiente por indisponibilidade de DNS/acesso a `registry.npmjs.org` (`EAI_AGAIN`). Por isso o build Vite e testes visuais no navegador **não foram executados** aqui. Recomendamos `npm ci`, `npm test` e `npm run build` no computador do usuário.

## Cautelas

- A visualização prévia de PDF é heurística e não representa transcrição auditada; arquivos escaneados/imagem requerem texto manual/OCR externo. PDF.js é carregado sob demanda por CDN e não funciona offline até que o leitor esteja disponível; TXT/CSV/JSON e uso do painel não dependem dessa conexão.
- Busca oficial na web é aberta por link, sem importação automática de resultados; edital enviado pelo estudante não é validado oficialmente.
- Não há autenticação/servidor: perfis são separados na instância do navegador, não contas seguras entre dispositivos.
- O `window.claude` DB legado não está conectado à nova camada multi-perfil, para evitar cruzamento de registros. Faça exportação JSON pelo painel antigo caso só tenha dados nesse DB.
- Dados de `projeto.zip` de origem continuam no projeto; defaults históricos estão disponíveis somente para migração/testes e não são carregados em instalação nova.

## Arquivos centrais

- `src/components/Onboarding.jsx` (novo)
- `src/data/workspace.js` (novo)
- `src/lib/edital.js`, `src/lib/editalFile.js` (novos)
- `src/App.jsx`, `src/data/defaults.js`, `src/lib/planner.js` (adaptados)
- `src/screens/{Concursos,Today,Settings,Reviews,Schedule,Questions,Simulados,Matrix,Notebook}Screen.jsx` (integrações)
- `src/lib/stats.js` (pontuação)
- `tests/mentor.test.js` (novo)
- `.claude/skills/mentor-concursos-personalizado/` (skill)

## Como avançar

Após instalar dependências, validar visualmente cada tela e o PDF com um edital real, especialmente importação de conteúdo e preservação de histórico na mesma origem. A interface principal é a original, com inclusões mínimas de novos botões e assistente.
