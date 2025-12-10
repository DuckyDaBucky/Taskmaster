# Exit immediately on error
$ErrorActionPreference = "Stop"

# ---- CONFIG ----
$pyEnv = ".\.venv\Scripts\Activate.ps1"
$nodeDir = ".\express-server"
$pyDir = ".\flask-server"
$nodeEntry = "server.js"
$pyEntry = "server.py"
$pyReqs = "$pyDir\requirements.txt"

# ---- CHECK PYTHON ENV ----
if (-Not (Test-Path $pyEnv)) {
    Write-Host "Python virtual environment not found at $pyEnv"
    Write-Host "Create it first with: python -m venv .venv"
    exit 1
}

Write-Host "Activating Python virtual environment..."
& $pyEnv

# ---- INSTALL PYTHON DEPENDENCIES ----
if (Test-Path $pyReqs) {
    Write-Host "Installing Python dependencies from requirements.txt..."
    pip install --upgrade pip | Out-Null
    pip install -r $pyReqs
} else {
    Write-Host "No requirements.txt found in $pyDir — skipping Python dependency install."
}

# ---- INSTALL NODE DEPENDENCIES ----
if (-Not (Test-Path "$nodeDir\node_modules")) {
    Write-Host "Installing Node.js dependencies..."
    Push-Location $nodeDir
    npm install
    Pop-Location
} else {
    Write-Host "Node.js dependencies already installed."
}

# ---- START SERVERS ----
Write-Host "Starting servers..."

# Start Flask server in background job
$flaskJob = Start-Job -ScriptBlock {
    Write-Host "Starting Flask server..."
    Set-Location ".\flask-server"
    python "server.py"
}

# Start Node.js server in background job
$nodeJob = Start-Job -ScriptBlock {
    Write-Host "Starting Node.js server..."
    Set-Location ".\express-server"
    node "server.js"
}

# ---- HANDLE SHUTDOWN ----
Write-Host "`nBoth servers started! Press Ctrl+C to stop them.`n"

# Graceful exit on Ctrl+C
$terminationHandler = {
    Write-Host "`nStopping servers..."
    Stop-Job $flaskJob, $nodeJob -Force | Out-Null
    Remove-Job $flaskJob, $nodeJob -Force | Out-Null
    Write-Host "👋 Shutdown complete."
    exit
}
Register-EngineEvent PowerShell.Exiting -Action $terminationHandler | Out-Null

# Wait indefinitely
Wait-Job -Job $flaskJob, $nodeJob
