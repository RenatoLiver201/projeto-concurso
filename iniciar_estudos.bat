@echo off
title Painel de Estudos - SES-DF Biologo
cd /d "%~dp0"
color 0A
cls
echo.
echo ============================================================
echo  PAINEL DE ESTUDOS - CONCURSO SES-DF BIOLOGO
echo ============================================================
echo.

REM Verifica Node.js
echo [1] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao esta no PATH.
    echo Instale em https://nodejs.org/ (LTS) e REINICIE O PC.
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node -v') do echo      OK - Node.js %%v
echo.

REM Verifica npm
echo [2] Verificando npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo      ERRO: npm nao encontrado.
    pause
    exit /b 1
)
for /f %%v in ('npm -v') do echo      OK - npm %%v
echo.

REM Limpa portas
echo [3] Limpando portas 5173-5177...
for %%p in (5173 5174 5175 5176 5177) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p 2^>nul') do taskkill /PID %%a /F >nul 2>&1
)
echo      OK
echo.

REM Dependencias
echo [4] Verificando dependencias...
if not exist "node_modules\.bin\vite.cmd" (
    echo      Instalando (1-3 min)... AGUARDE.
    npm install
    if errorlevel 1 (echo ERRO ao instalar. & pause & exit /b 1)
    echo      OK
) else (
    echo      OK - ja instaladas
)
echo.

REM Porta livre
echo [5] Procurando porta...
set PORT=5173
:LOOP
netstat -ano | findstr :%PORT% >nul 2>&1
if errorlevel 1 (echo      Porta %PORT% livre & echo.) else (set /a PORT+=1 & if %PORT% LEQ 5177 goto LOOP & echo ERRO: sem porta livre. & pause & exit /b 1)

REM Inicia
echo.
echo ============================================================
echo  INICIANDO SERVIDOR NA PORTA %PORT%...
echo  Navegador abrira em 3 segundos.
echo ============================================================
echo.
echo  MANTENHA ESTA JANELA ABERTA. Para parar: Ctrl+C
echo ============================================================
echo.

ping 127.0.0.1 -n 4 >nul
start "" "http://localhost:%PORT%"
npx vite --port %PORT% --strictPort

echo.
echo Servidor finalizado.
pause