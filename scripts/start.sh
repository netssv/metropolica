#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.metropolica/run"
LOG_DIR="$ROOT_DIR/.metropolica/logs"
BACKLOG_FILE="$ROOT_DIR/STARTUP_BACKLOG.md"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
LOCK_FILE="$RUN_DIR/launcher.lock"
NEXT_LOCK="$ROOT_DIR/frontend/.next/dev/lock"
BACKEND_EXPLICIT=0; FRONTEND_EXPLICIT=0
[[ -n "${METROPOLICA_BACKEND_PORT:-}" ]] && BACKEND_EXPLICIT=1
[[ -n "${METROPOLICA_FRONTEND_PORT:-}" ]] && FRONTEND_EXPLICIT=1
BACKEND_PORT="${METROPOLICA_BACKEND_PORT:-3000}"
FRONTEND_PORT="${METROPOLICA_FRONTEND_PORT:-3001}"
PORT_START="${METROPOLICA_PORT_START:-3000}"
PORT_END="${METROPOLICA_PORT_END:-3999}"
mkdir -p "$RUN_DIR" "$LOG_DIR"

record_failure() {
  local message="$1"
  { printf '\n- [%s] %s\n' "$(date -Is)" "$message"; printf '  - Backend log: %s\n  - Frontend log: %s\n' "$BACKEND_LOG" "$FRONTEND_LOG"; } >> "$BACKLOG_FILE"
  printf 'Startup failure: %s\nSee %s\n' "$message" "$BACKLOG_FILE" >&2
}
port_in_use() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
port_owner() {
  local port="$1" line pid
  if command -v lsof >/dev/null 2>&1; then
    line="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -Fpct 2>/dev/null | sed -n '1,3p')"
    pid="$(printf '%s\n' "$line" | sed -n 's/^p//p' | head -1)"
    [[ -n "$pid" ]] && { printf 'PID %s: ' "$pid"; ps -p "$pid" -o args= 2>/dev/null || true; return; }
  fi
  printf 'owner unavailable (install lsof for PID/command details)'
}
valid_port() { [[ "$1" =~ ^[0-9]+$ ]] && (( 1 <= 10#$1 && 10#$1 <= 65535 )); }
select_port() {
  local preferred="$1" port
  if port_in_use "$preferred"; then
    for ((port=PORT_START; port<=PORT_END; port++)); do
      if ! port_in_use "$port" && [[ "$port" != "$FRONTEND_PORT" ]]; then printf '%s' "$port"; return; fi
    done
    return 1
  fi
  printf '%s' "$preferred"
}
process_is_ours() {
  local pid="$1" cwd args comm
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  read -r comm cwd args < <(ps -p "$pid" -o comm= -o cwd= -o args= 2>/dev/null) || return 1
  [[ "$cwd" == "$ROOT_DIR" || "$cwd" == "$ROOT_DIR/frontend" ]] || return 1
  [[ "$comm" == node || "$comm" == nodejs || "$args" == *"$ROOT_DIR/scripts/serve.ts"* || "$args" == *"$ROOT_DIR/frontend"*next* ]]
}
cleanup_pid() {
  local pid="$1"; process_is_ours "$pid" || return 0
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  sleep 1
  kill -0 "$pid" 2>/dev/null && { kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true; }
}
cleanup() {
  trap - EXIT INT TERM
  cleanup_pid "${FRONTEND_PID:-}"; cleanup_pid "${BACKEND_PID:-}"
  rm -f "$RUN_DIR/backend.pid" "$RUN_DIR/frontend.pid" "$RUN_DIR/ports" "$RUN_DIR/launcher.pid" "$LOCK_FILE"
}
trap cleanup EXIT INT TERM

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  old="$(cat "$RUN_DIR/launcher.pid" 2>/dev/null || true)"
  record_failure "Another Metropolica launcher is active (PID ${old:-unknown}); it was not terminated"
  exit 1
fi
printf '%s\n' "$$" > "$RUN_DIR/launcher.pid"
cd "$ROOT_DIR"
: > "$BACKEND_LOG"; : > "$FRONTEND_LOG"
command -v node >/dev/null || { record_failure "Node.js is not installed or is not on PATH"; exit 1; }
command -v npm >/dev/null || { record_failure "npm is not installed or is not on PATH"; exit 1; }
for p in "$BACKEND_PORT" "$FRONTEND_PORT" "$PORT_START" "$PORT_END"; do valid_port "$p" || { record_failure "Invalid port: $p"; exit 1; }; done
(( BACKEND_PORT != FRONTEND_PORT )) || { record_failure "Backend and frontend ports must be different"; exit 1; }

ensure_frontend_dependencies() {
  [[ -x "$ROOT_DIR/frontend/node_modules/.bin/next" ]] && return
  local -a cmd=(npm install --prefer-offline --no-audit --no-fund)
  [[ -f "$ROOT_DIR/frontend/package-lock.json" ]] && cmd=(npm ci --prefer-offline --no-audit --no-fund)
  (cd "$ROOT_DIR/frontend" && "${cmd[@]}") || { record_failure "npm could not install frontend dependencies; check the exact npm error above"; return 1; }
  [[ -x "$ROOT_DIR/frontend/node_modules/.bin/next" ]] || { record_failure "Dependency installation completed without installing Next.js"; return 1; }
}
ensure_frontend_dependencies || exit 1

# A Next lock is safe to remove only when no matching process from this checkout exists.
if [[ -e "$NEXT_LOCK" ]]; then
  lock_pid="$(sed -n 's/[^0-9]*\([0-9][0-9]*\).*/\1/p' "$NEXT_LOCK" 2>/dev/null | head -1 || true)"
  if [[ -z "$lock_pid" ]] || ! process_is_ours "$lock_pid"; then rm -f "$NEXT_LOCK"; fi
fi
if (( BACKEND_EXPLICIT )); then port_in_use "$BACKEND_PORT" && { record_failure "Backend port $BACKEND_PORT is occupied ($(port_owner "$BACKEND_PORT")). Choose METROPOLICA_BACKEND_PORT=<free-port>."; exit 1; }; else BACKEND_PORT="$(select_port "$BACKEND_PORT")" || { record_failure "No free backend port in $PORT_START-$PORT_END"; exit 1; }; fi
if (( FRONTEND_EXPLICIT )); then
  if port_in_use "$FRONTEND_PORT"; then
    record_failure "Frontend port $FRONTEND_PORT is occupied ($(port_owner "$FRONTEND_PORT")). Choose METROPOLICA_FRONTEND_PORT=<free-port>."
    exit 1
  fi
fi
if (( ! FRONTEND_EXPLICIT )); then FRONTEND_PORT="$(select_port "$FRONTEND_PORT")" || { record_failure "No free frontend port in $PORT_START-$PORT_END"; exit 1; }; fi
(( BACKEND_PORT != FRONTEND_PORT )) || { record_failure "Could not select distinct backend/frontend ports"; exit 1; }
printf 'backend=%s\nfrontend=%s\n' "$BACKEND_PORT" "$FRONTEND_PORT" > "$RUN_DIR/ports"

METROPOLICA_BACKEND_PORT="$BACKEND_PORT" node --watch "$ROOT_DIR/scripts/serve.ts" >"$BACKEND_LOG" 2>&1 & BACKEND_PID=$!
printf '%s\n' "$BACKEND_PID" > "$RUN_DIR/backend.pid"
(cd "$ROOT_DIR/frontend" && METROPOLICA_BACKEND_PORT="$BACKEND_PORT" METROPOLICA_FRONTEND_PORT="$FRONTEND_PORT" exec ./node_modules/.bin/next dev --webpack -p "$FRONTEND_PORT") >"$FRONTEND_LOG" 2>&1 & FRONTEND_PID=$!
printf '%s\n' "$FRONTEND_PID" > "$RUN_DIR/frontend.pid"

json_health() { curl -fsS --max-time 2 "$1" -o "$RUN_DIR/health.json" && node -e 'const x=require(process.argv[1]); if(x.day == null || !x.cityDimensions || !Array.isArray(x.districts)) process.exit(1)' "$RUN_DIR/health.json"; }
wait_health() {
  local kind="$1" pid="$2" url="$3" tries=0 ok=0
  while (( tries < 40 )); do
    if [[ "$kind" == backend || "$kind" == proxy ]]; then json_health "$url" && ok=1; else curl -fsS --max-time 2 "$url" -o "$RUN_DIR/frontend.html" && grep -Eq '__next|_next/' "$RUN_DIR/frontend.html" && ok=1; fi
    (( ok )) && return 0; kill -0 "$pid" 2>/dev/null || break; ((tries++)); sleep 1
  done
  record_failure "$kind health check failed (process $pid); backend tail: $(tail -n 8 "$BACKEND_LOG" 2>/dev/null | tr '\n' ' '); frontend tail: $(tail -n 8 "$FRONTEND_LOG" 2>/dev/null | tr '\n' ' ')"; return 1
}
wait_health backend "$BACKEND_PID" "http://127.0.0.1:$BACKEND_PORT/api/state" || exit 1
wait_health frontend "$FRONTEND_PID" "http://127.0.0.1:$FRONTEND_PORT/" || exit 1
wait_health proxy "$FRONTEND_PID" "http://127.0.0.1:$FRONTEND_PORT/api/state" || exit 1
printf 'Metropolica is running:\n  Backend:  http://localhost:%s\n  Frontend: http://localhost:%s\n  Proxy API: http://localhost:%s/api/state\n  Runtime:  %s\n  Logs:     %s\nPress Ctrl+C to stop both services.\n' "$BACKEND_PORT" "$FRONTEND_PORT" "$FRONTEND_PORT" "$RUN_DIR" "$LOG_DIR"
wait
