@echo off
title Painel de Estudos SES-DF Biólogo
cd /d "%~dp0"

color 0A
echo.
echo  ============================================================
echo   PAINEL DE ESTUDOS - CONCURSO SES-DF BIOLOGO
echo  ============================================================
echo.
echo  [1/4] Verificando Node.js...

:: Tenta vários caminhos comuns do Node.js
set NODE_CMD=
where node >nul 2>&1 && set NODE_CMD=node
if not defined NODE_CMD (
    if exist "%ProgramFiles%\nodejs\node.exe" set NODE_CMD="%ProgramFiles%\nodejs\node.exe"
)
if not defined NODE_CMD (
    if exist "%ProgramFiles(x86)%\nodejs\node.exe" set NODE_CMD="%ProgramFiles(x86)%\nodejs\node.exe"
)
if not defined NODE_CMD (
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set NODE_CMD="%LOCALAPPDATA%\Programs\nodejs\node.exe"
)
if not defined NODE_CMD (
    for /f "tokens=*" %%a in ('where node 2^>nul') do set NODE_CMD=%%a
)

if not defined NODE_CMD (
    echo.
    echo  ERRO: Node.js nao encontrado no sistema!
    echo.
    echo  O Node.js precisa estar instalado e no PATH do Windows.
    echo.
    echo  COMO RESOLVER:
    echo  1. Acesse: https://nodejs.org/
    echo  2. Baixe a versao LTS (botao verde grande)
    echo  3. Rode o instalador .msi clicando "Next" em tudo
    echo  4. IMPORTANTE: Marque "Automatically install the necessary tools"
    echo  5. REINICIE O COMPUTADOR (obrigatorio!)
    echo.
    echo  DEPOIS de reiniciar, teste abrindo o "Prompt de Comando" e digitando:
    echo     node -v
    echo  Deve aparecer algo como: v20.12.0 (ou v18, v22, etc.)
    echo.
    pause
    exit /b 1
)

:: Mostra a versão encontrada
for /f "tokens=*" %%v in ('%NODE_CMD% -v') do set NODE_VERSION=%%v
echo  OK - Node.js %NODE_VERSION% encontrado!
echo.

echo  [2/4] Verificando npm...
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VERSION=%%v
if defined NPM_VERSION (
    echo  OK - npm %NPM_VERSION% encontrado!
) else (
    echo  AVISO: npm nao encontrado no PATH, mas Node.js esta OK.
    echo  Tentando continuar mesmo assim...
)
echo.

echo  [3/4] Liberando porta 5173 (se estiver ocupada)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  OK - Porta liberada!
echo.

echo  [4/4] Verificando dependencias do projeto...
if not exist "node_modules\.bin\vite.cmd" (
    echo  Primeira vez? Instalando dependencias (pode demorar 1-3 min)...
    echo  Isso so acontece na primeira execucao.
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo  ERRO ao instalar dependencias.
        echo  Verifique: (1) Internet funcionando, (2) Node.js instalado corretamente
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  OK - Dependencias instaladas com sucesso!
) else (
    echo  OK - Dependencias ja instaladas!
)
echo.

echo  ============================================================
echo   INICIANDO SERVIDOR...
echo   Abra: http://localhost:5173
echo  ============================================================
echo.
echo  PRIMEIRA VEZ? O assistente guia voce em 6 passos:
echo   1. Nome do plano (ex: SES-DF Biologo 2026)
echo   2. Dados do concurso (orgao, cargo, banca)
echo   3. Seu nivel e dificuldades
echo   4. Horas por dia (Seg a Dom)
echo   5. Metodos e metas de estudo
echo   6. Confirmar e criar cronograma
echo.
echo  DICA: Mantenha esta janela ABERTA enquanto estuda.
echo  Para parar: Ctrl+C ou feche esta janela.
echo  ============================================================
echo.

start "" "http://localhost:5173"
npm run dev -- --port 5173 --strictPort

echo.
echo  Servidor finalizado.
pause