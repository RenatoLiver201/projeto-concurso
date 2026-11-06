# 🎯 Painel de Estudos para Concurso SES-DF Biólogo

> **Sistema completo de organização e planejamento de estudos para concursos públicos** — roda 100% no seu navegador, sem precisar instalar nada além do Node.js uma única vez.

---

## 📋 O que este programa faz?

Este painel ajuda você a **organizar, planejar e acompanhar** seus estudos para o concurso **SES-DF Biólogo** (ou qualquer outro concurso). Ele reúne tudo em um só lugar:

| Funcionalidade | Para que serve |
|----------------|----------------|
| 📅 **Cronograma Semanal** | Gera automaticamente seu plano de estudos baseado nas horas que você tem disponível |
| 🌳 **Matéria de Assuntos** | Organiza todas as matérias do edital com prioridades calculadas automaticamente |
| 🔄 **Revisões Espaçadas** | Sistema SM-2 que avisa quando revisar cada assunto para não esquecer |
| ❓ **Caderno de Questões** | Registra questões resolvidas, identifica erros e mostra seu aproveitamento |
| ⏱ **Simulados** | Lança resultados de simulados por bloco, calcula nota conforme a banca (Cebraspe, FGV, etc.) |
| 📓 **Caderno de Anotações** | Anotações por assunto com prompts prontos para IA |
| 📊 **Relatório Semanal** | Resumo do que fez, alertas de atraso, disciplinas sem contato há muito tempo |
| 👤 **Múltiplos Perfis** | Cada pessoa da casa pode ter seu próprio planejamento isolado |

---

## 🚀 Como começar (Método recomendado: linha de comando)

### Pré-requisito: Instalar Node.js (uma vez só)
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (botão verde)
3. Instale clicando em "Next" até o final
4. **IMPORTANTE**: Marque "Automatically install the necessary tools"
5. **REINICIE O COMPUTADOR** (obrigatório!)
6. Teste: abra o Prompt de Comando (`cmd`) e digite `node -v` — deve aparecer algo como `v20.x.x` ou `v22.x.x`

---

### ✅ Método Principal: Prompt de Comando (cmd) — **Mais confiável**

```cmd
1. Tecla Windows + R → digite: cmd → Enter
2. Cole este comando e aperte Enter:
   cd /d "C:\Users\Amanda Rocha\Documents\Renato\projeto-concurso\projeto-concurso" && npm run dev -- --port 5173 --strictPort
3. Aguarde aparecer: "VITE v5.x.x ready in XXXms" e "Local: http://localhost:5173/"
4. O navegador abre automaticamente (ou clique no link acima)
5. MANTENHA ESSA JANELA ABERTA enquanto estuda
6. Para parar: Ctrl+C nesta janela
```

> **Dica**: Se a porta 5173 estiver ocupada, troque `--port 5173` por `--port 5174` (ou 5175, 5176...).

---

### 🔄 Métodos Alternativos (se o principal falhar)

#### Opção 2: PowerShell
```powershell
1. Botão direito no Iniciar → "Terminal (Admin)" ou "Windows PowerShell"
2. Cole e Enter:
   cd "C:\Users\Amanda Rocha\Documents\Renato\projeto-concurso\projeto-concurso"; npm run dev -- --port 5173 --strictPort
```

#### Opção 3: Arquivo .bat (duplo clique)
```
1. Abra a pasta: C:\Users\Amanda Rocha\Documents\Renato\projeto-concurso\projeto-concurso
2. Duplo clique em: iniciar_estudos.bat
3. Se não abrir: botão direito → "Executar como administrador"
```

#### Opção 4: PowerShell via arquivo .ps1
```
1. Na mesma pasta, botão direito em: iniciar_estudos.ps1
2. "Executar com PowerShell"
3. Se der erro de política: use a Opção 1 (cmd)
```

---

## 🎓 Primeira vez? Siga o assistente!

Ao abrir pela primeira vez, você verá um **assistente de 4 passos**:

1. **Estudante** → Seu nome ou apelido
2. **Concurso** → Órgão, cargo, banca, data da prova (se souber)
3. **Edital e matérias** → Importe o conteúdo programático (TXT/CSV/JSON/PDF) ou pule se não tiver
4. **Rotina e plano** → Horas por dia (Seg a Dom), experiência, preferências

> 💡 **Dica**: Não sabe algum dado? Deixe em branco e edite depois na tela **Configurações** ou **Concursos**.

---

## 📱 Como usar no dia a dia

### Menu lateral (esquerda) - Suas 10 telas:
```
🏠 Hoje           → O que fazer AGORA, alertas, próximo passo
🎯 Concursos      → Cadastro do edital, blocos, prazos, fontes
🌳 Matriz         → Todas as matérias, prioridades, importar lista do edital
📅 Cronograma     → Semana inteira, arrastar sessões, replanejar atrasos
🔄 Revisões       → Lista do que revisar hoje (espaçamento SM-2)
❓ Questões       → Registrar questões, caderno de erros, estatísticas
⏱ Simulados      → Lançar simulados por bloco, ver evolução da nota
📓 Notebook       → Anotações por assunto, prompts para IA
📊 Relatório      → Resumo semanal, gráficos, alertas baseados em dados
⚙️ Configurações  → Horas/dia, bloqueios, metas, tema, backup
```

### Topo da tela:
- **Seletor de perfil** → Troca entre pessoas/concursos diferentes
- **Botão "Concurso guiado"** → Adiciona novo concurso ao perfil atual
- **Botão "Novo perfil"** → Cria planejamento totalmente separado

---

## 💾 Seus dados ficam seguros

- ✅ **Tudo no seu navegador** (localStorage) — não vai para nuvem nenhuma
- ✅ **Funciona offline** — depois da primeira abertura, não precisa de internet
- ✅ **Backup fácil**: Configurações → **Exportar JSON** (salva tudo)
- ✅ **Restaurar**: Configurações → **Importar JSON**
- ✅ **Múltiplos perfis** → Cada um exporta/importa independente

> ⚠️ **Importante**: Limpar dados do navegador (Ctrl+Shift+Delete) **apaga tudo**. Faça backups semanais!

---

## 🔧 Personalizando para SEU concurso

O painel vem **vazio** para você configurar **qualquer concurso**:

1. Vá em **🎯 Concursos** → "Novo concurso"
2. Preencha: Órgão, Cargo, Banca, Status do edital
3. Se tiver edital: Cole o conteúdo programático em **🌳 Matriz** → "Importar"
4. Ajuste horas/dia em **⚙️ Configurações**
5. Pronto! O cronograma se adapta automaticamente

**Bancas suportadas**: Cebraspe, FGV, Vunesp, Cesgranrio, FCC, AOCP, IDECAN, IBFC, Consulplan, Verbena, outras (configurável)

---

## ❓ Problemas comuns

| Problema | Solução |
|----------|---------|
| "`npm` não é reconhecido" | Instale Node.js (link acima), **reinicie o PC**, teste `node -v` no cmd |
| "Porta 5173 em uso" | Use `--port 5174` (ou 5175, 5176...) no comando |
| Tela branca / erro | Feche o navegador, abra novamente. Ou **Ctrl+F5** para forçar recarregar |
| "ExecutionPolicy" no PowerShell | Use o **Prompt de Comando (cmd)** — Opção 1 acima |
| Quer usar em outro PC | Exporte JSON (Configurações) → Copie arquivo → Importe no outro PC |
| Duplo clique no .bat não abre | Use o **método principal (cmd)** acima — funciona sempre |

---

## 🎯 Atalhos úteis

| Tecla | Ação |
|-------|------|
| `F11` | Tela cheia |
| `Ctrl + F5` | Recarregar forçado (limpa cache) |
| `Ctrl + Shift + R` | Recarregar forçado (alternativo) |

---

## 📁 Estrutura da pasta (para curiosos)

```
projeto-concurso/
├── iniciar_estudos.bat     ← Alternativa: duplo clique
├── iniciar_estudos.ps1     ← Alternativa: PowerShell
├── package.json            ← Configuração do projeto
├── src/                    ← Código fonte (React + Vite)
│   ├── components/         ← Botões, cards, modais, gráficos
│   ├── screens/            ← As 10 telas principais
│   ├── lib/                ← Motor de planejamento (SM-2, prioridades)
│   └── data/               ← Dados, storage, defaults
└── dist/                   ← Gerado pelo 'npm run build' (site estático)
```

---

## 🆘 Precisa de ajuda?

1. Use o **Método Principal (cmd)** acima — é o que sempre funciona
2. Verifique se Node.js está instalado: abra cmd e digite `node -v`
3. Se nada funcionar, reinstale Node.js (LTS), **reinicie o PC**, e tente novamente

---

## 📄 Licença

Uso pessoal para estudos. Código baseado em projeto open-source React/Vite/Tailwind.

---

**Desenvolvido para tornar seus estudos organizados, eficientes e adaptáveis.**  
**Boa sorte no concurso SES-DF Biólogo! 🍀**