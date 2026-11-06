# Plano de refatoração orientado pelo código REAL

## Problemas verificados na base recebida
1. `src/data/defaults.js`: `defaultConcursos()` retorna quatro concursos do usuário original (CGU, SEFAZ-DF, SES-DF e BACEN). `defaultTopics()` retorna tópicos atrelados a CGU. `defaultSettings()` fixa `concursoPrincipal: "cgu"`, horas padrão, metas, ciclo de Ciência de Dados e dados de rotina originais.
2. `src/App.jsx`: inicialização usa `createInitialState()` + estado carregado; ao mudar perfil seria possível combinar defaults de um perfil com dados de outro se não houver armazenamento e escopo adequados.
3. `src/data/storage.js`: há uma única chave `prep-concursos-v1`; sem gerenciador de perfis. A sincronização opcional `window.claude` usa coleções compartilhadas sem prefixo de perfil.
4. `src/lib/planner.js`: `computePriorities` percorre todos os tópicos; os sem concursos ativos ainda recebem nota. `dueReviews` também percorre todos os tópicos. `generatePlan` recebe prioridades globais, agendas e revisões globais. Logo, concursos desativados ou pertencentes a outro contexto podem entrar no plano. `currentStage()` depende do conjunto de concursos ativos.
5. `src/screens/QuestionsScreen.jsx`: exibe "saldo líquido (certas − erradas)" como regra Cebraspe C/E, mesmo para outras bancas; precisa condicionar cálculo/rótulo à regra do concurso.
6. `src/screens/MatrixScreen.jsx`: importação em massa aceita lista por disciplina/concurso, mas não extrai automaticamente o conteúdo programático do PDF; melhorar importação estruturada mantendo importação manual.
7. `src/screens/SettingsScreen.jsx`: "Restaurar painel inicial" recria os quatro concursos do seed antigo; deve ir para estado vazio/onboarding. Importação JSON substitui todos os dados sem mecanismo de prévia / isolamento por perfil.
8. `src/lib/backup.js`: valida apenas esquema v1, sem modelo de perfis, versão de migração ou rotinas de preservação/reversão.
9. `src/screens/TodayScreen.jsx` e `ReportScreen.jsx`: rankings e resumo podem misturar sessões/performance do conjunto antigo; os filtros devem ter comportamento claro por perfil e por concursos ativos.

## Ordem de implementação sugerida (sequencial, com checkpoints)
### Fase A — Confiança e inventário
- Criar branch/backup; executar build do estado original se possível; guardar `projeto.zip` sem alterações.
- Mapear exatos campos das coleções e todos os consumidores de `settings.concursoPrincipal`; gerar lista de acoplamentos. Usar busca no código, não só esta referência.
- Definir testes de migração de backup v1 e fixtures com dois perfis.

### Fase B — Estado inicial realmente neutro
- Introduzir `createEmptyProfileState()` ou parâmetro explícito em `createInitialState`, sem concursos/tópicos pré-carregados e com `settings.concursoPrincipal: null` (ou `""` caso componentes exijam, mas sempre consistente).
- Separar `createLegacyDemoState()` (somente para importação de histórico/exemplo, nunca boot/reset) dos defaults neutros. Remover nomes pessoais, compromissos e concursos fixos dos padrões.
- Garantir que todos os componentes funcionem com listas vazias e `concursoPrincipal` ausente (estado vazio contextual com CTA de configurar concurso).

### Fase C — Perfis independentes
- Adotar armazenamento por perfil com migração v1: veja `DADOS_E_MIGRACAO.md`.
- No seletor de perfis, criar/renomear/duplicar com opção explícita/remover com confirmação/exportar. Não apagar outro perfil ao limpar o atual.
- `AppContext` e `useApp()` devem operar **somente no perfil ativo** e seus concursos vinculados. Chaves e IDs estáveis, sem colisões.
- Se integração `window.claude` estiver habilitada, isolar coleções por perfil ou manter desligada até haver estratégia de migração segura; nunca gravar dois perfis na mesma coleção indistintamente.

### Fase D — Onboarding e edital
- Novo assistente simples com etapas: Perfil → Concurso/Cargo → Edital ou histórico → Diagnóstico → Disponibilidade por dia → Preferências/metas → Prévia do plano.
- Pré-carregar dados de formulário se usuário já respondeu no chat; não perguntar de novo.
- Importar dados estruturados para `newConcurso` e `newTopic`, preservando hierarquia e vínculo de concurso/bloco. Validar duplicatas e fazer preview de mudanças antes de confirmar.
- Se dados de edital estiverem pendentes, adicionar marcador de `hipotese/historico`, não atribuir peso inventado nem status "edital publicado".

### Fase E — Motor orientado ao contexto
- Criar seleção canônica `eligibleTopicIds` = tópicos vinculados a >=1 concurso ativo do perfil, descontando concursos/assuntos descartados; compartilhar matéria apenas por vínculo explícito.
- Usar essa seleção em `computePriorities`, `dueReviews`, `generatePlan`, `nextBestAction`, `buildAlerts`, `coverageStats`, `ReportScreen`, `TodayScreen` e componentes de questões/revisões.
- Não marcar `concursoIds` de sessão com IDs desativados; não gerar sessão em calendário de outro perfil.
- Se nada elegível: plano vazio e explicação ("Inclua assuntos no edital"), não preencher com dados demo.
- Ajustar scoring de simulados por concurso, via blocos; nunca usar um saldo C/E em outro tipo de prova por hábito.
- Tratar ausência de data como estágio de preparação básico/provisório com reavaliação quando confirmado.

### Fase F — Regressão e entrega
- Validar `npm run build`, onze ou mais cenários de aceitação, navegação/responsividade/tema e importação/exportação.
- Preservar fallback `localStorage` e nenhum backend obrigatório.
- Documentar versão de estado, migração v1, modo de instalação, uso offline e limites da pesquisa automática de edital no browser (API/CORS).

## Antipadrões a evitar
- Alterar a cor geral ou substituir cards/tabelas por novo kit visual.
- Usar o nome da CGU como placeholder de novo perfil.
- Gerar sessões para matérias de concurso inativo.
- Compartilhar automaticamente histórico de questões entre pessoas porque a disciplina tem o mesmo nome.
- Limpar `localStorage` na primeira inicialização por considerar v1 "desatualizado".
- Afirmar "pesquisei o edital" quando acesso web não estava disponível.
- Prometer extração de PDFs diretamente no navegador sem implementar biblioteca/serviço adequado (o Claude pode extrair fora do browser e importar JSON).
