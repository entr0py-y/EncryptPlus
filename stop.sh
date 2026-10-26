#!/bin/bash
# ==============================================================================
# EncryptPlus (ECDAT) - Stop Script
# Cleanly terminates all running backend and frontend processes.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.encryptplus_pids"

echo "================================================================"
echo "          🛑 Stopping EncryptPlus Services"
echo "================================================================"

# Kill processes recorded in PID file
if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping process $pid..."
            kill "$pid" 2>/dev/null || true
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Clean up any lingering processes on ports 8000, 3000, 3001
for port in 8000 3000 3001; do
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Clearing lingering process on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
    fi
done

echo "[PASS] EncryptPlus services stopped."
