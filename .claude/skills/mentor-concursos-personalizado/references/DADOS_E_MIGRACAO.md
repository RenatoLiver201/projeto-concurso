# Perfis de estudo, backup, compatibilidade e migração

## Situação original
`src/data/storage.js` usa `localStorage['prep-concursos-v1']` e opcionalmente `window.claude.use('db')`. `createInitialState()` tem `v:1`, settings e coleções; `src/lib/backup.js` valida JSON v1. **Não apagar essa chave ao atualizar**.

## Modelo alvo recomendado (não está implementado no ZIP original)
Criar um catálogo `prep-concursos-profiles-v2` de metadados **sem dados de estudo compartilhados**:
```json
{
  "version": 2,
  "activeProfileId": "perfil-uuid",
  "profiles": [
    {"id": "perfil-uuid", "name": "Meu perfil", "createdAt": "ISO", "updatedAt": "ISO"}
  ]
}
```
Cada perfil possui estado de estudo próprio em chave `prep-concursos-profile-v2:<id>` (ou armazenagem IndexedDB equivalente, se for bem justificada). Internamente, mantenha as coleções v1 do painel com schema versionado e incrementado por migrador, separado do catálogo. **Não** misturar tudo em `settings` para evitar alterações em todas as telas.

## Migração segura
1. Detectar legado (`prep-concursos-v1`) **sem escrever nele**.
2. Validar objeto e arrays obrigatórios, preservar `decisions` e campos desconhecidos na medida possível.
3. Oferecer opção: `Importar histórico existente como novo perfil` ou `Criar perfil vazio e manter legado intacto`. Não migrar silenciosamente dados pessoais para uma sessão de outra pessoa.
4. Ao aceitar importação: clonar em nova chave por perfil, atribuir ID seguro ao perfil, ajustar referências apenas quando necessário e verificar integridade de foreign keys (`concursoId`, `topicId`, `topicIds`, `concursoIds`). Guardar cópia do JSON v1, nunca sobrescrever o original.
5. Se falhar: reverter catálogo/novas chaves incompletas e continuar oferecendo o original intacto.
6. Depois do sucesso: testes de contagem (`concursos`, `topics`, `sessions`, `questions`, `simulados`, `notebooks`, `decisions`), seleção correta e consultas isoladas.
7. Excluir legado somente por opção explícita separada e com exportação confirmada; preferência por preservação.

## Novo perfil vazio
Estado recomendado:
```js
{
  v: 1,
  settings: { ...configuracaoNeutra, concursoPrincipal: "", ciclo: { itens: [], ptr: 0 } },
  concursos: [], topics: [], sessions: [], questions: [],
  simulados: [], notebooks: [], decisions: []
}
```
`configuracaoNeutra` deve preservar campos esperados pelo planner e telas, com horários zero ou uma proposta editável não definitiva, bloqueios vazios, tema system, metas explicitamente provisórias. NÃO criar `newTopic()` que retorne `concursos: [""]` ou `[null]`.

## Backup
- Exportação por perfil deve indicar `format`, `schemaVersion`, `profileId`, `exportedAt` e **estado completo**, sem abrir mão de exportar/importar JSON v1.
- Importação com preview de concurso/assuntos/sessões/questões, validação, confirmação do destino (novo perfil vs substituir perfil atual), e **backup do destino antes de substituir**.
- Nunca permitir importação de backup de um perfil apagar dados de outros perfis. Proteger tamanho do arquivo, estrutura, datas inválidas e referências inexistentes.
- Tratar ajustes de nomenclatura/ID dos tópicos do edital sem perder vínculo com histórico.
- O modo do usuário no navegador é local por dispositivo e domínio; não afirmar contas multiusuário/sincronização remota. Múltiplos perfis no mesmo navegador não são autenticação nem garantia de privacidade entre pessoas com acesso ao aparelho.

## Integração opcional com Claude host
As coleções de `window.claude` atuais não são namespaced; **não** habilitar sincronização de vários perfis usando a coleção compartilhada antiga. Ou prefixar por perfil e adicionar migração transacional e rollback, ou desativar essa integração para perfis v2 até implementar separação comprovada. O fallback local continua funcional.

## Princípios para arquitetar
Adaptar `useApp()` para operar sobre `activeProfileState`; criar `profileStore`/`profileContext` enxuto; evitar reescrever cada tela. Todas as funções puras do planner recebem exclusivamente o estado do perfil ativo, com filtros por concurso ativo quando pertinente.
