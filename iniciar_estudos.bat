@echo off
title Painel de Estudos - Concurso SES-DF Biologo
cd /d "%~dp0"

color 0A
cls
echo.
echo  ============================================================
echo   PAINEL DE ESTUDOS - CONCURSO SES-DF BIOLOGO
echo  ============================================================
echo.
echo  Iniciando... (pode demorar alguns segundos na primeira vez)
echo.

:: -----------------------------------------------------------
:: 1. Verifica Node.js de forma silenciosa
:: -----------------------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js nao encontrado.
    echo.
    echo  Por favor, instale o Node.js LTS em: https://nodejs.org/
    echo  (Baixe o instalador .msi, clique Next em tudo, REINICIE O PC)
    echo.
    pause
    exit /b 1
)

:: -----------------------------------------------------------
:: 2. Mata processos Node antigos nas portas comuns (silencioso)
:: -----------------------------------------------------------
for %%p in (5173 5174 5175 5176 5177) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p 2^>nul') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: -----------------------------------------------------------
:: 3. Instala dependencias se for a primeira vez
:: -----------------------------------------------------------
if not exist "node_modules\.bin\vite.cmd" (
    echo  Primeira execucao detectada - instalando dependencias...
    echo  (Isso so acontece uma vez, aguarde 1-3 minutos)
    echo.
    npm install >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  Erro ao instalar. Verifique sua internet e tente novamente.
        echo.
        pause
        exit /b 1
    )
    echo  Pronto! Dependencias instaladas.
    echo.
)

:: -----------------------------------------------------------
:: 4. Tenta subir o servidor na primeira porta livre
:: -----------------------------------------------------------
set PORT=5173
:TRY_PORT
netstat -ano | findstr :%PORT% >nul 2>&1
if errorlevel 1 (
    :: Porta livre - inicia o servidor
    echo  Abrindo no navegador: http://localhost:%PORT%
    echo.
    echo  ============================================================
    echo   MANTENHA ESTA JANELA ABERTA ENQUANTO ESTUDA
    echo   Para fechar: Ctrl+C ou clique no X desta janela
    echo  ============================================================
    echo.
    start "" "http://localhost:%PORT%"
    npx vite --port %PORT% --strictPort
    goto :END
) else (
    :: Porta ocupada - tenta a proxima
    set /a PORT=%PORT%+1
    if %PORT% LEQ 5177 goto TRY_PORT
    echo  Nao foi possivel encontrar porta livre (5173-5177).
    echo  Reinicie o computador e tente novamente.
    pause
    exit /b 1
)

:END
echo.
echo  Servidor finalizado.
pause