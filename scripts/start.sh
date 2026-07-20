#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.metropolica"
LOG_DIR="$RUN_DIR/logs"
BACKLOG_FILE="$ROOT_DIR/STARTUP_BACKLOG.md"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$LOG_DIR"

record_failure() {
  local message="$1"
  {
    printf '\n- [%s] %s\n' "$(date -Is)" "$message"
    printf '  - Backend log: %s\n' "$BACKEND_LOG"
    printf '  - Frontend log: %s\n' "$FRONTEND_LOG"
  } >> "$BACKLOG_FILE"
  printf 'Startup failure: %s\nSee %s\n' "$message" "$BACKLOG_FILE" >&2
}

cleanup() {
  trap - EXIT INT TERM
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT_DIR"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"

command -v node >/dev/null || { record_failure "Node.js is not installed or is not on PATH"; exit 1; }
[[ -x "$ROOT_DIR/frontend/node_modules/.bin/next" ]] || {
  record_failure "Frontend dependencies are missing; run npm install in frontend/"; exit 1;
}

if (exec 3<>"/dev/tcp/127.0.0.1/3000") 2>/dev/null; then
  exec 3>&-; record_failure "Port 3000 is already in use"; exit 1
fi
if (exec 3<>"/dev/tcp/127.0.0.1/3001") 2>/dev/null; then
  exec 3>&-; record_failure "Port 3001 is already in use"; exit 1
fi

node "$ROOT_DIR/scripts/serve.ts" >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
(
  cd "$ROOT_DIR/frontend"
  exec ./node_modules/.bin/next dev -p 3001
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

wait_for_url() {
  local url="$1" attempts=0
  until curl -fsS --max-time 2 "$url" >/dev/null 2>&1; do
    ((attempts+=1))
    if ! kill -0 "$2" 2>/dev/null || (( attempts >= 30 )); then
      record_failure "$3 did not become healthy (see the service logs for the underlying error)"
      return 1
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
}

wait_for_url "http://127.0.0.1:3000/api/state" "$BACKEND_PID" "Backend API"
wait_for_url "http://127.0.0.1:3001/" "$FRONTEND_PID" "Frontend"

printf 'Metropolica is running:\n  Backend:  http://localhost:3000\n  Frontend: http://localhost:3001\n  Logs:     %s\n  Backlog:  %s\nPress Ctrl+C to stop both services.\n' "$LOG_DIR" "$BACKLOG_FILE"
wait
