Write-Host "--- Démarrage de SOS Planète v2 (Unified Mode) ---" -ForegroundColor Cyan

# 1. Nettoyage radical
Write-Host "[1/3] Nettoyage des containers (Actuels et Orphelins)..." -ForegroundColor Yellow
# Supprime les containers applicatifs (pas la DB pour préserver le mode dev)
docker rm -f sos_admin_v2 sos_backend_v2 sos_jeu_v1 sos_backend_local sos_admin_local sos_frontend_local 2>$null

Write-Host "Libération du port 3011 (Windows)..." -ForegroundColor Yellow
$port3011 = Get-NetTCPConnection -LocalPort 3011 -ErrorAction SilentlyContinue
if ($port3011) {
    Stop-Process -Id $port3011.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Port 3011 libéré." -ForegroundColor Green
}

# 2. Lancement via Docker Compose
Write-Host "[2/3] Build et Lancement groupé (Docker Compose)..." -ForegroundColor Yellow
docker-compose up -d --build

# 3. Statut final
Write-Host "[3/3] Terminé ! État des services :" -ForegroundColor Green
docker-compose ps

Write-Host "`nL'Admin est disponible sur : http://localhost:3000" -ForegroundColor Cyan
Write-Host "Le Backend est disponible sur : http://localhost:3011" -ForegroundColor Cyan
Write-Host "`nVos services sont maintenant groupés dans l'interface Docker Desktop." -ForegroundColor Gray
