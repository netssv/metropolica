# Metropolica

Metropolica is a headless-first TypeScript city simulation focused on public resource management, city administration, and contemporary metropolitan problems.

## Start everything

Run `bash scripts/start.sh` from the project root. It starts the backend on port 3000 and the frontend on port 3001, waits for both health checks, and stops both processes together with Ctrl+C. Output is written to `.metropolica/logs/`; startup failures are appended to `STARTUP_BACKLOG.md`.

## Credits & Acknowledgments

- **Micropolis / MicropolisCore**: The tile-based city-grid rendering approach used in `src/rendering/` takes conceptual inspiration from [Micropolis](https://github.com/SimHacker/micropolis) and [MicropolisCore](https://github.com/SimHacker/MicropolisCore), originally created by Will Wright and updated/refactored by Don Hopkins. Metropolica's codebase is an original implementation written from scratch; no code, graphics, or assets were copied or translated. Micropolis is licensed under GPL-3.0, and "Micropolis" is a registered trademark of Micropolis GmbH, referenced here for acknowledgment purposes only.
- **Nemotron (NVIDIA)**: Synthetic citizen profile data used for flavor in the Level-2/Level-3 citizen subset (skills, aspirations, traits) is derived from NVIDIA's Nemotron persona models. As per architecture rules, this dataset is synthetic and is never used to derive crime, corruption, or political-leaning propensities from demographic or textual attributes.
