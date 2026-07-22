# Metropolica

Metropolica is a headless-first TypeScript city simulation focused on public resource management, city administration, and contemporary metropolitan problems.

## Start everything

Run `./scripts/start.sh` from the project root. It starts the backend on port 3000 and the frontend on port 3001, validates the backend JSON contract and the frontend proxy, and stops both process groups together with Ctrl+C. Runtime metadata is kept in `.metropolica/run/` and logs in `.metropolica/logs/`.

If either preferred port is occupied by an unrelated process, the launcher chooses free ports in `METROPOLICA_PORT_START`–`METROPOLICA_PORT_END` (default `3000`–`3999`) and prints the effective URLs. Explicit ports are strict and fail with the owning PID/command when occupied:

```bash
METROPOLICA_BACKEND_PORT=3200 METROPOLICA_FRONTEND_PORT=3201 ./scripts/start.sh
```

Useful diagnostics are `cat .metropolica/run/ports`, `cat .metropolica/run/backend.pid`, `cat .metropolica/run/frontend.pid`, and `tail -n 80 .metropolica/logs/{backend,frontend}.log`. A healthy second launcher is rejected by the instance lock and is never killed. To stop an identified instance, send `TERM` to its launcher PID; Ctrl+C performs the normal group cleanup. Startup failures are appended to `STARTUP_BACKLOG.md`.

## Credits & Acknowledgments

- **Micropolis / MicropolisCore**: The tile-based city-grid rendering approach used in `src/rendering/` takes conceptual inspiration from [Micropolis](https://github.com/SimHacker/micropolis) and [MicropolisCore](https://github.com/SimHacker/MicropolisCore), originally created by Will Wright and updated/refactored by Don Hopkins. Metropolica's codebase is an original implementation written from scratch; no code, graphics, or assets were copied or translated. Micropolis is licensed under GPL-3.0, and "Micropolis" is a registered trademark of Micropolis GmbH, referenced here for acknowledgment purposes only.
- **isometric-city**: Metropolica adapts the isometric coordinate conversion utilities from [amilich/isometric-city](https://github.com/amilich/isometric-city) and uses its `sprites_red_water_new.png` and `water.png` assets in the frontend. This project is distributed under the MIT License. See [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) for the complete attribution and license text.
- **Nemotron (NVIDIA)**: Synthetic citizen profile data used for flavor in the Level-2/Level-3 citizen subset (skills, aspirations, traits) is derived from NVIDIA's Nemotron persona models. As per architecture rules, this dataset is synthetic and is never used to derive crime, corruption, or political-leaning propensities from demographic or textual attributes.
