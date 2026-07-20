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
command -v npm >/dev/null || { record_failure "npm is not installed or is not on PATH"; exit 1; }

ensure_frontend_dependencies() {
  if [[ -x "$ROOT_DIR/frontend/node_modules/.bin/next" ]]; then
    return
  fi

  printf 'Frontend dependencies are missing; installing them...\n'
  local install_command
  if [[ -f "$ROOT_DIR/frontend/package-lock.json" ]]; then
    install_command=(npm ci --prefer-offline --no-audit --no-fund)
  elif [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
    install_command=(npm install --prefer-offline --no-audit --no-fund)
  else
    record_failure "Frontend dependency manifest not found"
    return 1
  fi

  local installed=0 attempt
  for attempt in 1 2 3; do
    if (cd "$ROOT_DIR/frontend" && "${install_command[@]}" ); then
      installed=1
      break
    fi
    if (( attempt < 3 )); then
      printf 'Dependency installation failed; retrying (%d/3)...\n' "$((attempt + 1))" >&2
      sleep 2
    fi
  done

  if (( ! installed )); then
    record_failure "Unable to install frontend dependencies; npm could not reach the package registry. Check network/proxy settings and retry"
    return 1
  fi

  [[ -x "$ROOT_DIR/frontend/node_modules/.bin/next" ]] || {
    record_failure "Frontend dependency installation completed without installing Next.js"
    return 1
  }
}

if ! ensure_frontend_dependencies; then
  exit 1
fi

if (exec 3<>"/dev/tcp/127.0.0.1/3000") 2>/dev/null; then
  exec 3>&-; record_failure "Port 3000 is already in use"; exit 1
fi
if (exec 3<>"/dev/tcp/127.0.0.1/3001") 2>/dev/null; then
  exec 3>&-; record_failure "Port 3001 is already in use"; exit 1
fi

# Development servers reload themselves when source files change: Next.js
# handles frontend HMR, while Node watches the backend and its imports.
node --watch "$ROOT_DIR/scripts/serve.ts" >"$BACKEND_LOG" 2>&1 &
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
