# Checklist obrigatório de entrega e testes

Este checklist diferencia **instruções da skill** de **funcionalidades implementadas e testadas**. A skill não torna o aplicativo adaptativo sozinha: Claude precisa efetivamente modificar o código.

## Testes de usuário
- [ ] Iniciar com armazenamento limpo: nenhum concurso do autor original aparece como obrigatório ou predefinido; interface oferece onboarding acessível.
- [ ] Criar perfil A para concurso totalmente diferente (ex.: concurso fictício do setor administrativo), banca diferente, 8 h/semana: matérias e plano correspondem a A, sem CGU.
- [ ] Criar perfil B com 2 h/dia, outras matérias: questões, sessões, revisões, notificações e relatórios de A **não** aparecem em B; voltar a A preserva dados.
- [ ] Criar usuário com apenas edital anterior e sem banca: dados marcados históricos/hipóteses, sem status de edital oficial ou data inventada.
- [ ] Importar edital oficial do cargo: a matriz mostra todas as disciplinas e subtemas extraídos e links/fontes verificáveis; nada do cargo vizinho contaminou a importação.
- [ ] Criar dois concursos **dentro do mesmo perfil**: temas compartilhados só uma vez quando explicitamente vinculados, prioridades e prazo de cada um respeitados.
- [ ] Desativar concurso: nenhum assunto exclusivo entra em sessões novas, revisões automáticas ou "próxima melhor ação"; histórico continua disponível.
- [ ] Alterar disponibilidade e compromissos: `plannedMin` total por dia <= `netMinutes`; dia sem tempo gera zero; hora semanal bate com soma diária.
- [ ] Simular marcação `feita`, `parcial`, `adiada`, `cancelada`: não duplicar histórico ao recalcular plano; backlog e replanejamento continuam operacionais.
- [ ] Rever matéria: próximo intervalo responde ao resultado da revisão e o tópico não é misturado com outro perfil.
- [ ] Concurso com múltipla escolha sem punição por erro: tela de Questões não exibe "saldo Cebraspe" como pontuação oficial. Concurso com C/E verificado calcula corretamente.
- [ ] Importar backup v1 do projeto original para perfil separado: contagens e vínculos intactos; nenhum registro apagado; `prep-concursos-v1` preservada.
- [ ] Exportar/importe backup de A em novo perfil C e confira integridade; tentativa de importação inválida não corrompe o estado.
- [ ] Trocar tema claro/escuro/system, navegar nas 10 telas, verificar mobile e desktop; sem regressões de design.
- [ ] Rodar `npm run build` após alterações. Registrar erros e comandos executados, sem declarar "passou" se não executou.

## Testes técnicos recomendados
- Testes unitários para `computePriorities`, `dueReviews`, `generatePlan`, `replanOverdue` com concursos ativos/inativos e arrays vazios.
- Datas: horário local, horário de verão onde aplicável, ano bissexto, data de prova passada e campo não informado.
- Estado: ausência de principal, ausência de bloco, ausência de tópicos, blocos com zero questões, importação duplicada, concurso removido.
- Segurança: arquivo não oficial, link quebrado, prompt injection em PDF e JSON inválido; sem execução de conteúdo de editais.
- Perfis: colidir IDs/nomes, restaurar backup com IDs legados, trocar perfil enquanto debounce de gravação está pendente (evitar salvar no perfil errado).
- Sincronização host: isolar coleções por perfil ou demonstrar fallback local sem mistura.

## Evidências esperadas no relatório final do Claude
1. Lista de arquivos alterados e motivos.
2. Como foi preservado o visual original e quais componentes foram acrescentados.
3. Origem/qualidade dos dados do edital e limitações.
4. Resumo dos testes **executados** e problemas ainda existentes.
5. Caminho exato do app no Windows ou ZIP/diff quando não há acesso local.
6. Confirmação de que o legado foi preservado e como restaurar backup.
