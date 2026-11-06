# Inicia o painel nesta pasta sem alterar o projeto original do usuário.
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js nao encontrado. Instale a versao LTS em https://nodejs.org/ e execute novamente." -ForegroundColor Yellow
    exit 1
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Host "npm nao encontrado no PATH." -ForegroundColor Yellow
    exit 1
}
Write-Host "Mentor de Concursos - Painel Personalizado" -ForegroundColor Cyan
Write-Host "Pasta: $PSScriptRoot"
if (-not (Test-Path "node_modules/.bin/vite.cmd")) {
    Write-Host "Instalando dependencias npm..." -ForegroundColor Cyan
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw "Falha no npm ci. Verifique conexao com internet e Node.js." }
}
Write-Host "Servidor de desenvolvimento iniciado. Abra o endereco mostrado abaixo no navegador." -ForegroundColor Green
& npm.cmd run dev
