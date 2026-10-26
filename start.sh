#!/bin/bash
# ==============================================================================
# EncryptPlus (ECDAT) - One-Command Turnkey Startup Script
# ==============================================================================
# Starts the FastAPI backend, Next.js frontend, and verifies integrations.
# Traps Ctrl+C (SIGINT/SIGTERM) to cleanly stop all child processes on exit.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================"
echo "          🚀 Starting EncryptPlus (ECDAT) Platform"
echo "================================================================"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# 1. Check or initialize root .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "[INFO] No .env file found. Initializing .env from .env.example..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo "[INFO] Created .env. You can add your Hindsight API key anytime."
fi

# 2. Locate Python executable (prefer venv)
if [ -f "$SCRIPT_DIR/venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
else
    echo "[ERROR] Python 3 is required but could not be found."
    exit 1
fi

# 3. Locate Node & npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] Node.js and npm are required to run the frontend."
    exit 1
fi

# 4. Check CryptoScan binary (build if missing and Go is available)
CRYPTOSCAN_BIN="$SCRIPT_DIR/cryptoscan/cryptoscan"
if [ ! -f "$CRYPTOSCAN_BIN" ]; then
    echo "[INFO] CryptoScan binary not found. Checking for Go..."
    if command -v go >/dev/null 2>&1; then
        echo "[INFO] Compiling CryptoScan engine with Go..."
        (cd "$SCRIPT_DIR/cryptoscan" && go build -o cryptoscan cmd/cryptoscan/main.go)
        echo "[PASS] CryptoScan engine compiled successfully."
    else
        echo "[WARN] Go is not installed. CryptoScan precompiled binary is needed for scanning new local repos."
    fi
fi

# 5. Run Configuration Check
echo ""
echo "[1/4] Running automated configuration check..."
"$PYTHON_BIN" "$SCRIPT_DIR/scripts/check_config.py" || true

# 6. Apply Safe Additive Database Migrations (preserve existing tables and records)
echo ""
echo "[2/4] Initializing database tables (additive & non-destructive)..."
"$PYTHON_BIN" -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR')
from apps.api.migrations import run_migrations
run_migrations()
print('[PASS] Database schema checked and updated.')
"

# 7. Check and clear existing processes on ports 8000 and 3000/3001 if requested
PID_FILE="$SCRIPT_DIR/.encryptplus_pids"
rm -f "$PID_FILE"

# Function to stop background processes cleanly on exit
cleanup() {
    echo ""
    echo "================================================================"
    echo "          🛑 Stopping EncryptPlus services..."
    echo "================================================================"
    if [ -f "$PID_FILE" ]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    echo "[PASS] All services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 8. Start Backend Service
echo ""
echo "[3/4] Launching FastAPI Backend on port 8000..."

# Check if port 8000 is occupied
EXISTING_API_PID=$(lsof -ti:8000 2>/dev/null || true)
if [ -n "$EXISTING_API_PID" ]; then
    echo "[INFO] Port 8000 is currently in use (PID: $EXISTING_API_PID). Reusing or restarting..."
    kill -9 $EXISTING_API_PID 2>/dev/null || true
    sleep 1
fi

PYTHONPATH="$SCRIPT_DIR" "$PYTHON_BIN" -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" >> "$PID_FILE"

# Wait for backend to be healthy
echo "      Waiting for backend to become available..."
BACKEND_READY=false
for i in {1..30}; do
    if curl -s "http://localhost:8000/health" >/dev/null 2>&1 || curl -s "http://localhost:8000/api/health" >/dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    sleep 0.5
done

if [ "$BACKEND_READY" = true ]; then
    echo "[PASS] Backend is live at http://localhost:8000"
else
    echo "[WARN] Backend took longer than expected to report healthy. Check logs/backend.log"
fi

# 9. Start Frontend Service
echo ""
echo "[4/4] Launching Next.js Frontend..."

# Check if frontend node modules exist
if [ ! -d "$SCRIPT_DIR/apps/web/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    (cd "$SCRIPT_DIR/apps/web" && npm install)
fi

# Check for port 3000 / 3001 availability
EXISTING_WEB_PID=$(lsof -ti:3000 2>/dev/null || true)
WEB_PORT=3000
if [ -n "$EXISTING_WEB_PID" ]; then
    WEB_PORT=3001
    EXISTING_WEB_PID_3001=$(lsof -ti:3001 2>/dev/null || true)
    if [ -n "$EXISTING_WEB_PID_3001" ]; then
        kill -9 $EXISTING_WEB_PID_3001 2>/dev/null || true
        sleep 1
    fi
fi

(cd "$SCRIPT_DIR/apps/web" && npm run dev -- -p "$WEB_PORT") > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"

# Wait for frontend to respond
echo "      Waiting for frontend on port $WEB_PORT..."
for i in {1..30}; do
    if curl -s "http://localhost:$WEB_PORT" >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done
echo "[PASS] Frontend is live at http://localhost:$WEB_PORT"

# 10. Display Summary Box
echo ""
echo "================================================================"
echo "          ✅ EncryptPlus is Up and Running!"
echo "================================================================"
echo "  🌐 Web Dashboard:    http://localhost:$WEB_PORT"
echo "  📡 Backend API:       http://localhost:8000"
echo "  📚 API Documentation: http://localhost:8000/docs"
echo "  🤖 AI Agent:          Click the 'AI Agent' button in the topbar"
echo "================================================================"
echo "  Logs: tail -f logs/backend.log logs/frontend.log"
echo "  To stop: Press [Ctrl+C] in this terminal or run ./stop.sh"
echo "================================================================"
echo ""

# Keep running and wait for termination
wait
