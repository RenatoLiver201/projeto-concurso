# Motor adaptativo — aproveitar o que existe e corrigir escopo

## Fundamentos existentes
Em `src/lib/planner.js`, `computePriorities` calcula nota a partir de relevância, peso no edital, lacuna, facilidade, tempo desde contato, taxa de esquecimento, concursos cobertos e proximidade. `generatePlan` organiza teoria, questões, correção, revisões e simulado. `computeReview` e `applyReview` agendam revisão; `replanOverdue` remaneja o passado. `STUDY_STAGES` define proporções iniciais 60/30/10 (base), 40/45/15 (consolidação) e 20/45/35 (reta final).

Esses valores são **configurações iniciais alteráveis**, não prescrições científicas obrigatórias. A prioridade muda com desempenho real e prazo; não apresentar cálculo como garantia de aprovação.

## Escopo correto
Definir `perfilAtivo` e `concursosAtivos` antes de qualquer score. Um tópico elegível deve pertencer ao perfil e ter ligação explícita com ao menos um concurso ativo, ou constar de fila de base geral que o estudante tenha escolhido conscientemente. Tópicos de histórico importado de concurso inativo ficam visíveis quando solicitados, mas não ganham tarefas automáticas.

Compartilhamento entre concursos **dentro do mesmo perfil**: um tópico de Português pode atender dois editais, mas vínculos e conteúdos precisam ser comparáveis; o componente de interseção pode sugerir vínculo, não fundir registros automaticamente. Entre perfis: nunca compartilhar histórico de desempenho por padrão.

## Cálculo de capacidade
- `horasDia` são **minutos brutos por dia**. `netMinutes` aplica bloqueios e `bufferPct`. Conferir convenção `weekdayIndex` antes de mapear segunda a domingo; o seed atual usa domingo na primeira posição.
- Tempo líquido = `max(0, minutos disponíveis − bloqueios) × (1 − buffer%)`, com arredondamento consistente.
- Horas semanais exibidas devem ser calculadas a partir dos dias, e não apenas copiadas da meta.
- Programar zero sessões em dias com zero disponibilidade; não ultrapassar `maxAssuntosDia` nem encaixar sessão com duração zero/negativa.
- Revisões vencidas, erros e questões competem com a mesma capacidade; quando faltarem horas, avisar o déficit e priorizar por impacto e data.
- Para horários variáveis, permitir ajustes semanais sem invalidar passado.

## Priorização e evidência
- Se número/peso de questões por disciplina for oficial, usar como fator de relevância e normalizar com o total do **concurso específico**, evitando `NaN`/divisão por zero para blocos vazios.
- Se não existir peso confirmado, definir componente `peso` como indisponível (`null`) e redistribuir pesos **apenas** entre fatores existentes, de forma transparente.
- Sem questões suficientes, classificar como diagnóstico pendente — não tratar 50% estimados como desempenho observado.
- Disciplinas difíceis podem precisar de mais tempo, não apenas favorecer "ganhos rápidos". Evitar viés de só assuntos fáceis.
- Ajustar sessões quando acertos/erros e intervalo de confiança sinalizarem lacuna, mantendo amostra visível.
- Pode usar diagnóstico inicial por microteste por disciplina, se questões reais e classificadas forem fornecidas legalmente; não inventar desempenho.

## Distribuição do plano
1. Identificar próximas datas verificadas; caso nenhuma, planejar por ciclos recorrentes e metas de aprendizagem, sem falsa "reta final" baseada em especulação.
2. Reservar revisões vencidas e correção de erros com prioridade; distribuir teoria, questões e simulados conforme estágio, conteúdo e duração disponível.
3. Gerar sessões com `date`, `topicIds`, `concursoIds`, `tipo`, `plannedMin`, `prioridade`, `why`, `status`; IDs consistentes.
4. Se usuário já marcou tarefa como `feita`, `parcial` ou `cancelada`, não recriar, duplicar nem apagar histórico para dar lugar a novo plano.
5. Simulados: usar configuração do concurso e janela de tempo viável; para pessoa com apenas sessões curtas, propor mini-simulados em blocos.
6. Informar estimativa de cobertura, déficit de carga e motivo das prioridades (ex.: questão recente, peso oficial, revisão vencida, prova próxima confirmada).
7. Replanejamento após mudanças: preservar passado, redefinir futuro, prevenir duplicidade `(perfil, concurso/tópico, tipo, data/intervalo)`, respeitar bloqueios e registrar decisão.

## Regras de pontuação
- `src/lib/stats.js`, `src/screens/QuestionsScreen.jsx`, `src/screens/SimuladosScreen.jsx` devem usar `concurso.scoring` e `blocos` (ou dados equivalentes), **nunca** assumir C/E quando a banca/cargo não confirmar.
- Diferenciar taxa de acerto (acertos / questões válidas) e nota líquida (varia por edital). A taxa de acerto é exibível em qualquer banca; a segunda depende das regras verificadas.
- Prova discursiva, títulos, TAF, informática prática etc. podem exigir atividades específicas ou marcadores de preparação, mas não atribuir pesos falsos.

## Indicadores esperados
Carga planejada e executada semanal, cobertura de disciplinas/tópicos, revisões em dia e vencidas, acerto por assunto e por concurso, tempo médio por questão, evolução de simulados e risco por prazo. Mostrar nível de evidência e distinguir dados reais de hipótese.
