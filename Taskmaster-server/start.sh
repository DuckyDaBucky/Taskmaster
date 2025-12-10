#!/bin/bash

# Exit immediately if a command fails
set -e

# ---- CONFIG ----
PY_ENV=".venv/bin/activate"
NODE_DIR="./express-server"
PY_DIR="./flask-server"
NODE_ENTRY="server.js"
PY_ENTRY="server.py"
PY_REQS="$PY_DIR/requirements.txt"

# ---- CHECK PYTHON VENV ----
if [ ! -f "$PY_ENV" ]; then
  echo "Python virtual environment not found at $PY_ENV"
  echo "Create it first with: python3 -m venv .venv"
  exit 1
fi

echo "Activating Python virtual environment..."
# shellcheck disable=SC1090
source "$PY_ENV"

# ---- INSTALL PYTHON DEPENDENCIES ----
if [ -f "$PY_REQS" ]; then
  echo "Checking Python dependencies..."
  # Use pip list and compare installed packages with requirements
  pip install --upgrade pip >/dev/null
  pip install -r "$PY_REQS"
else
  echo "No requirements.txt found in $PY_DIR — skipping Python package install."
fi

# ---- NODE DEPENDENCIES ----
if [ ! -d "$NODE_DIR/node_modules" ]; then
  echo "Installing Node.js dependencies..."
  (cd "$NODE_DIR" && npm install)
else
  echo "Node.js dependencies already installed."
fi

# ---- SIGNAL HANDLING ----
# Gracefully stop both processes when user presses Ctrl+C
cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  echo "Shutdown complete."
  exit 0
}
trap cleanup INT

# ---- START SERVERS ----
echo "Starting servers..."

# Start Flask server
(
  echo "Starting Flask server..."
  cd "$PY_DIR"
  python3 "$PY_ENTRY"
) &

# Start Node server
(
  echo "Starting Node.js server..."
  cd "$NODE_DIR"
  node "$NODE_ENTRY"
) &

# ---- WAIT FOR BOTH ----
wait
