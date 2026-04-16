# Script de lancement SOS Planète v2 (Robust Mode)
# ---------------------------------------------------------
# Usage : .\dev.ps1  (depuis le dossier sos-planete/)
# ---------------------------------------------------------

Set-Location $PSScriptRoot
$originalDir = Get-Location

# Fonction de nettoyage et retour
function FinalCleanup {
    Write-Host "[EXIT] Retour au repertoire racine..." -ForegroundColor Gray
    Set-Location $originalDir
}

# Chargement des fichiers d'environnement
$envFiles = @(".env", ".env.local")
$envLoaded = $false

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "[CONFIG] Chargement des variables depuis $file..." -ForegroundColor Gray
        Get-Content $file | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
            $name, $value = $_.Split('=', 2)
            $varName = $name.Trim()
            $varValue = if ($value) { $value.Trim() } else { '' }
            
            if ([string]::IsNullOrWhiteSpace($varValue)) {
                # Valeur vide = effacer la variable (permet à .env.local de "vider" une valeur de .env)
                [System.Environment]::SetEnvironmentVariable($varName, $null)
                Remove-Item -Path "Env:\$varName" -ErrorAction SilentlyContinue
            } else {
                [System.Environment]::SetEnvironmentVariable($varName, $varValue)
                Set-Item -Path "Env:\$varName" -Value $varValue
            }
        }
        $envLoaded = $true
    }
}

if (-not $envLoaded) {
    Write-Host "[WARNING] Aucun fichier d'environnement (.env.local ou .env) trouvé. Utilisation des valeurs par défaut." -ForegroundColor Yellow
}

# Piège pour l'arrêt (Ctrl+C)
# Note: Dans un script interactif PowerShell, le comportement peut varier,
# on va donc aussi s'assurer que la dernière commande ne change pas le PID shell.

Write-Host "[CLEAN] Arret des anciens processus..." -ForegroundColor Magenta

# Nettoyage par ports (3010 = Admin, 3011 = Back, 3012 = Jeu v1)
$ports = @(3010, 3011, 3012)
foreach ($port in $ports) {
    $pidsToKill = @()

    # Méthode 1 : Get-NetTCPConnection
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        if ($conn.OwningProcess -gt 0 -and $conn.OwningProcess -ne 4) {
            $pidsToKill += $conn.OwningProcess
        }
    }

    # Méthode 2 : netstat
    $netstatLines = netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
        if ($_ -match '\s(\d+)\s*$') { [int]$Matches[1] }
    }
    if ($netstatLines) { $pidsToKill += $netstatLines }

    # Dédoublonner et tuer
    $pidsToKill = $pidsToKill | Sort-Object -Unique | Where-Object { $_ -gt 0 -and $_ -ne 4 }
    foreach ($processId in $pidsToKill) {
        Write-Host "  - Liberation du port $port (PID: $processId)..." -ForegroundColor Gray
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# Nettoyage par nom (Backup : tue tout process node lié à sos-planete)
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*sosplanete*" } |
    ForEach-Object {
        Write-Host "  - Kill node sos-planete (PID: $($_.ProcessId))..." -ForegroundColor Gray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

# Vérification : attendre que les ports soient réellement libérés
Start-Sleep -Seconds 1
foreach ($port in $ports) {
    $retries = 0
    while ($retries -lt 5) {
        $still = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Where-Object { $_.State -eq 'Listen' }
        if (-not $still) { break }
        Write-Host "  - Port $port encore occupe, attente..." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
        $retries++
    }
}

# 1. Vérification / Démarrage Docker Desktop
Write-Host "[CHECK] Verification de Docker..." -ForegroundColor Yellow
docker version >$null 2>&1
if ($LastExitCode -ne 0) {
    Write-Host "[DOCKER] Docker n'est pas lance. Tentative de demarrage de Docker Desktop..." -ForegroundColor Cyan
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "  - En attente du demarrage complet de Docker (cela peut prendre du temps)..." -ForegroundColor Gray
        $dockerReady = $false
        $timeout = 60 # 5 minutes (5s * 60)
        $elapsed = 0
        while (-not $dockerReady -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 5
            docker version >$null 2>&1
            if ($LastExitCode -eq 0) { $dockerReady = $true }
            $elapsed++
        }
        if (-not $dockerReady) {
            Write-Host "ERREUR : Docker n'a pas demarre a temps." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERREUR : Docker Desktop non trouve au chemin par defaut." -ForegroundColor Red
        exit 1
    }
}

# 2. Vérification Base de données (Conteneur local)
Write-Host "[CHECK] Verification des conteneurs (DB)..." -ForegroundColor Yellow
$dockerStatus = docker-compose -f docker-compose.local.yml ps --format json
if ($dockerStatus -notlike "*running*") {
    Write-Host "[DOCKER] Demarrage des conteneurs via docker-compose.local.yml..." -ForegroundColor Gray
    docker-compose -f docker-compose.local.yml up -d
}

# 3. Démarrage Backend-v2
Write-Host "[BACK] Demarrage du Backend (Port 3011)..." -ForegroundColor Cyan
# On force le port via variable d'environnement
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/backend-v2; `$env:PORT=3011; npm run start:dev" -WindowStyle Normal

# 4. Démarrage Admin-v2
Write-Host "[ADMIN] Attente de la disponibilite du Backend..." -ForegroundColor Cyan
npx wait-on tcp:3011 --timeout 30000
if ($LastExitCode -ne 0) {
    Write-Host "ERREUR : Le Backend n'a pas demarre a temps sur le port 3011." -ForegroundColor Red
    Write-Host "Verifiez les logs de la fenetre Backend." -ForegroundColor Gray
    exit 1
}

Write-Host "[ADMIN] Lancement de l'Admin (Port 3010)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/admin-sosplanete-v2; `$env:PORT=3010; npm run dev" -WindowStyle Normal

# 5. Démarrage Jeu-v1
Write-Host "[JEU] Lancement du Jeu v1 (Port 3012)..." -ForegroundColor Cyan
# Exécution dans un bloc fils pour bloquer le shell appelant
& {
    Set-Location apps/sosplanete-v1
    $env:PORT=3012
    npm run dev
}
FinalCleanup
