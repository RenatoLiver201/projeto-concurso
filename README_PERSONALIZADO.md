# Mentor de Concursos — Painel Interativo Personalizado (v2.0)

Esta versão foi construída em cima do `projeto.zip` original: preserva as dez telas React/Vite/Tailwind e integra entrevista guiada, seleção livre de concurso/cargo/banca, perfis separados, importação de conteúdos de editais e planejamento adaptativo.

## Iniciar no Windows

1. Descompacte o ZIP em uma **pasta nova**, por exemplo `C:\Users\Renat\Desktop\Importante\Concurso\mentor-personalizado`. **Não sobrescreva a pasta do seu projeto antigo**.
2. Instale [Node.js LTS](https://nodejs.org/) (se necessário).
3. Abra um terminal PowerShell nessa pasta (a que contém `package.json`).
4. Execute `npm ci`, depois `npm run dev`. Abra a URL local que o Vite exibir (geralmente `http://localhost:5173`).
5. Opcionalmente: `npm test`, `npm run build`, `npm run preview`.

> A primeira abertura **sem dados antigos** mostra o questionário. Se você já tinha dados v1 **no mesmo navegador e na mesma origem (URL)**, o aplicativo cria automaticamente o perfil "Meu histórico original". Mudança de `localhost` para outra URL/porta **não** transfere localStorage: exporte backup JSON no app antigo e importe no novo.

## Primeiro acesso

O questionário pergunta nome/apelido; órgão e cargo; banca e data se conhecidas; origem do edital; conteúdo programático; minutos disponíveis em cada dia; experiência, dificuldade e forma de estudo. Todos os dados não informados continuam editáveis. O cronograma inicial só é criado se houver **assuntos e horas**; nunca gera matérias fictícias.

No menu lateral: **Novo perfil** cria estudante independente; **Concurso guiado** adiciona objetivo ao perfil atual. Cada perfil tem suas próprias questões, simulados, revisões, configurações e relatórios. A aba Concursos conserva o cadastro manual original. Matriz permite importar listas e compartilhar assuntos entre concursos **manualmente**.

## Formatos de edital

- **TXT / Markdown:** uma linha por assunto `Disciplina | Assunto`, ou `Disciplina:` seguido de assuntos em linhas separadas.
- **CSV:** cabeçalhos `disciplina;assunto` ou `disciplina,assunto`, com aspas opcionais.
- **JSON:** `{ "disciplinas": [{ "nome": "Português", "topicos": ["Interpretação", "Concordância"] }] }`.
- **PDF com texto selecionável:** o navegador carrega a biblioteca PDF.js **sob demanda, pela internet**, de uma versão fixa no CDN. O PDF selecionado é processado localmente, não enviado a um servidor. A extração de matérias é **heurística** e pode não reconhecer o conteúdo. Revise a prévia e cole manualmente a lista, se necessário. PDF apenas escaneado/imagem não tem OCR nesta versão; converta o conteúdo programático para texto.

Arquivos são limitados a 16 MB. O PDF e seu texto integral não são armazenados permanentemente no navegador; somente a lista revisada de matérias e os metadados informados são salvos.

**Não há busca automática oficial integrada ao navegador.** O botão de pesquisar abre uma busca na internet para que o estudante localize o edital oficial/histórico e o importe. O aplicativo **não comprova a autenticidade** do material enviado. Não inventa notas mínimas, penalizações, datas, bancas ou pesos. O estudante deve validar no edital atualizado; conteúdo provisório fica sinalizado.

## Acompanhamento e adaptação

O planejador original continua em `src/lib/planner.js` e prioriza lacunas de questões, revisões, relevância, dificuldade e proximidade quando há data de prova. A primeira geração já respeita a capacidade de cada dia e a margem para imprevistos. Em **Cronograma → Atualizar plano (4 semanas)**, sessões futuras automáticas ainda não iniciadas são recalculadas; sessões manuais, concluídas e parciais ficam intactas. Se alterar horários ou prioridades, utilize esse botão para refletir as mudanças.

## Persistência e recuperação

- Os perfis são salvos em `localStorage` sob `prep-concursos-workspace-v2` (isolamento **lógico por perfil no navegador**, não contas com login nem sincronização entre dispositivos).
- Se houver `prep-concursos-v1` válido na mesma origem na primeira abertura, ele é copiado para um perfil legado, sem excluir nem modificar o original.
- Backup do perfil ativo: JSON compatível v1; backup de todos os perfis: JSON v2. Importar JSON cria **novos** perfis, sem apagar os atuais.
- O armazenamento do banco proprietário `window.claude` da versão antiga **não é usado** por esta versão; se seus dados só existem nesse banco, **exporte-os pelo painel anterior primeiro**.
- Limpar cookies/localStorage pode apagar os dados. Faça backups, principalmente antes de transferir para outra URL/computador.

## Testes e verificações

`npm test` executa os testes unitários incluídos. `npm run build` faz o build Vite. Se `npm ci` falhar por falta de acesso ao registro NPM, repita com conexão de internet no seu computador; o ZIP inclui código e lockfile, não contém `node_modules`.

## Claude Code

A skill está instalada dentro do repositório em `.claude/skills/mentor-concursos-personalizado/SKILL.md`; leia também `references/IMPLEMENTACAO_V3.md`. O Claude deve evoluir **este código** sem substituir o layout e sem semear os concursos antigos para estudantes novos.

## Limitações atuais

A interface não verifica editais automaticamente na web, não faz OCR nem tem login ou nuvem. A extração de PDF requer internet para obter a biblioteca de leitura. O planejamento é baseado em regras transparentes e no que o estudante informar/registrar — não é uma previsão de aprovação.
