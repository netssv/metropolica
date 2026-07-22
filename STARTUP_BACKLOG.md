# Startup backlog

The launcher appends a timestamped item here whenever a required startup check fails.

Entries are appended below in timestamp order. Historical entries are retained for incident context; new unresolved incidents should include the root cause and resolution. Runtime PID/port metadata is in `.metropolica/run/`.

## Resolved by launcher hardening — 2026-07-21

- [x] Orphaned launcher/Next locks, stale PID metadata, occupied preferred ports, incomplete shutdown, and socket-only health checks were hardened in `scripts/start.sh`.
- [x] The launcher now uses an atomic instance lock, project-scoped process validation, automatic free-port fallback, strict explicit-port errors, layered backend/frontend/proxy checks, and bounded process-group cleanup.

- [2026-07-19T21:32:43-06:00] Backend API did not become healthy
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-19T21:41:46-06:00] Backend API did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-20T07:43:41-06:00] Frontend dependencies are missing; run npm install in frontend/
  - Backend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/frontend.log

- [2026-07-20T07:47:15-06:00] Frontend dependency installation completed without installing Next.js
  - Backend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/frontend.log

- [2026-07-20T22:01:20-06:00] Backend API did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-20T22:01:38-06:00] Port 3000 is already in use
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T07:55:39-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/frontend.log

- [2026-07-21T12:57:04-06:00] Port 3000 is already in use
  - Backend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/cachy/Proyectos/metropolica/.metropolica/logs/frontend.log

- [2026-07-21T20:13:46-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:15:26-06:00] Backend API did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:15:36-06:00] Port 3000 is already in use
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:42:16-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:45:02-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:51:43-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T21:53:10-06:00] Frontend did not become healthy (see the service logs for the underlying error)
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

- [2026-07-21T22:11:43-06:00] backend health check failed (process 1005380); backend tail: Metropolica Server running at http://localhost:3200 ; frontend tail: ▲ Next.js 16.2.10 (webpack) - Local:         http://localhost:3201 - Network:       http://192.168.68.54:3201 ✓ Ready in 432ms  
  - Backend log: /home/netss/Projects/Metropolica/.metropolica/logs/backend.log
  - Frontend log: /home/netss/Projects/Metropolica/.metropolica/logs/frontend.log

