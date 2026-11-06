<#
.SYNOPSIS
    Inicia o Painel de Estudos para Concurso (React + Vite)
    Versão simples: roda Vite em primeiro plano, abre navegador após 3 seg
#>

$projectDir = $PSScriptRoot
$ports = 5173..5177

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
    Write-Host "`nPrimeira execução - instalando dependências (1-3 min)...`n"
    try {
        npm install 2>$null | Out-Null
        Write-Host "✓ Dependências instaladas`n"
    } catch {
        Write-Host "`n✗ Erro ao instalar. Verifique internet." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "✓ Dependências já instaladas`n"
}

# 5. Encontra porta livre
$chosenPort = $null
foreach ($port in $ports) {
    $inUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $inUse) {
        $chosenPort = $port
        break
    }
}

if (-not $chosenPort) {
    Write-Host "`n✗ Sem porta livre (5173-5177). Reinicie o PC.`n" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# 6. Inicia servidor e abre navegador
Write-Host "`nPorta $chosenPort livre. Iniciando servidor..."
Write-Host ""
Write-Host "============================================================"
Write-Host "  AGUARDE: servidor inicia + navegador abre automaticamente"
Write-Host "  (pode levar até 10 segundos na primeira vez)"
Write-Host "============================================================"
Write-Host ""

# Abre navegador após 3 segundos (job em background)
$browserJob = Start-Job -ScriptBlock {
    param($port)
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:$port"
} -ArgumentList $chosenPort

# Inicia Vite em primeiro plano (bloqueia aqui - É O QUE QUEREMOS)
try {
    & npx vite --port $chosenPort --strictPort
} catch {
    Write-Host "`nServidor finalizado."
}
# Limpa job do navegador se ainda estiver rodando
$browserJob | Remove-Job -Force -ErrorAction SilentlyContinue