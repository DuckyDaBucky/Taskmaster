@echo off
setlocal enabledelayedexpansion

REM ---- CONFIG ----
set PY_ENV=.venv\Scripts\activate
set NODE_DIR=express-server
set PY_DIR=flask-server
set NODE_ENTRY=server.js
set PY_ENTRY=server.py
set PY_REQS=%PY_DIR%\requirements.txt

REM ---- CHECK PYTHON ENV ----
if not exist "%PY_ENV%" (
    echo Python virtual environment not found at %PY_ENV%
    echo Create it first with: python -m venv .venv
    exit /b 1
)

echo Activating Python virtual environment...
call %PY_ENV%

REM ---- INSTALL PYTHON DEPENDENCIES ----
if exist "%PY_REQS%" (
    echo Installing Python dependencies from requirements.txt...
    pip install --upgrade pip >nul
    pip install -r "%PY_REQS%"
) else (
    echo No requirements.txt found in %PY_DIR% — skipping Python dependency install.
)

REM ---- INSTALL NODE DEPENDENCIES ----
if not exist "%NODE_DIR%\node_modules" (
    echo Installing Node.js dependencies...
    pushd %NODE_DIR%
    call npm install
    popd
) else (
    echo Node.js dependencies already installed.
)

REM ---- START SERVERS ----
echo Starting servers...

start "Flask Server" cmd /k "cd %PY_DIR% && python %PY_ENTRY%"
start "Node Server" cmd /k "cd %NODE_DIR% && node %NODE_ENTRY%"

echo.
echo Both servers started in separate windows!
echo Close the windows or press Ctrl+C here to stop them.
