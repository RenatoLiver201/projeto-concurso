<#
.SYNOPSIS
    Inicia o Painel de Estudos para Concurso (React + Vite)
    Funciona com duplo clique no Windows (PowerShell)
#>

# Configurações
$projectDir = $PSScriptRoot
$ports = 5173..5177

# Cores no console
$host.UI.RawUI.BackgroundColor = "Black"
$host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

Write-Host "`n============================================================"
Write-Host "  PAINEL DE ESTUDOS - CONCURSO SES-DF BIOLOGO"
Write-Host "============================================================`n"
Write-Host "Iniciando... (pode demorar alguns segundos na primeira vez)`n"

# 1. Verifica Node.js
try {
    $nodeVersion = node -v 2>$null
    if (-not $nodeVersion) { throw "Node não encontrado" }
    Write-Host "✓ Node.js $nodeVersion encontrado"
} catch {
    Write-Host "`n✗ ERRO: Node.js não está instalado ou não está no PATH." -ForegroundColor Red
    Write-Host "`nSOLUÇÃO:"
    Write-Host "  1. Acesse: https://nodejs.org/"
    Write-Host "  2. Baixe a versão LTS (botão verde)"
    Write-Host "  3. Instale clicando 'Next' em tudo"
    Write-Host "  4. IMPORTANTE: Marque 'Automatically install the necessary tools'"
    Write-Host "  5. REINICIE O COMPUTADOR (obrigatório!)`n"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# 2. Mata processos nas portas comuns
Write-Host "`nLimpando portas antigas..."
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 3. Entra na pasta do projeto
Set-Location $projectDir

# 4. Instala dependências se primeira vez
$vitePath = Join-Path $projectDir "node_modules\.bin\vite.cmd"
if (-not (Test-Path $vitePath)) {
    Write-Host "`nPrimeira execução detectada - instalando dependências..."
    Write-Host "(Isso só acontece uma vez, aguarde 1-3 minutos)`n"
    try {
        npm install 2>$null | Out-Null
        Write-Host "✓ Dependências instaladas com sucesso`n"
    } catch {
        Write-Host "`n✗ Erro ao instalar dependências. Verifique sua internet." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "✓ Dependências já instaladas`n"
}

# 5. Tenta primeira porta livre
$chosenPort = $null
foreach ($port in $ports) {
    $inUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $inUse) {
        $chosenPort = $port
        break
    }
}

if (-not $chosenPort) {
    Write-Host "`n✗ Não foi possível encontrar porta livre (5173-5177)." -ForegroundColor Red
    Write-Host "Reinicie o computador e tente novamente.`n"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# 6. Abre navegador e inicia servidor
Write-Host "`n============================================================"
Write-Host "  ABRINDO: http://localhost:$chosenPort"
Write-Host "============================================================`n"
Write-Host "MANTENHA ESTA JANELA ABERTA ENQUANTO ESTUDA"
Write-Host "Para parar: Ctrl+C ou feche esta janela"
Write-Host "============================================================`n"

# Abre no navegador padrão
Start-Process "http://localhost:$chosenPort"

# Inicia Vite (bloqueia aqui até fechar)
try {
    & npx vite --port $chosenPort --strictPort
} catch {
    Write-Host "`nServidor finalizado."
    Read-Host "Pressione Enter para sair"
}