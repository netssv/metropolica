---
name: metropolica-design
description: Apply Metropolica's layered, deterministic browser-simulation architecture when implementing or reviewing this repository.
---

# DESIGN PHILOSOPHY

- Keep `simulation/` and `core/` headless and free of imports from `rendering/` and `ui/`.
- Keep the simulation deterministic and multi-scale: rendering is independent; domain systems subscribe to daily, weekly or monthly ticks; support x1/x5/x20/x100 fast-forward.
- Give every event a traceable cause chain. Avoid unexplained randomness.
- Keep UI commands separate from state changes: UI dispatches typed commands and never mutates simulation state directly.
- Never put LLMs or generative models in the core simulation loop; generated text is cosmetic only.
- Keep policies, events, occupations and scenarios as declarative data under `content/`; use generic interpreters to apply them.
- **Ethical Use Constraint (Nemotron-Personas-El-Salvador)**: The Nemotron-Personas-El-Salvador dataset is synthetic (CC BY 4.0) and must NOT be treated as an objective representation of Salvadoran society. Its text patterns may contain stereotypes or unverified cultural associations. Concretely:
  - The dataset may inform variety and flavor in generated citizen profiles (occupation, skills, interests, aspirations, household composition) — it must NOT be used to derive crime propensity, corruption propensity, or political leaning tied to demographic attributes.
  - Crime risk, corruption risk, and political lean must continue to come ONLY from the existing institutional/economic simulation formulas (unemployment, trust, coverage, inequality) — never from a citizen's dataset-derived demographic profile directly.


## Structure

- `src/core/`: clock, seeded random, events, commands and serialization.
- `src/simulation/`: headless city-domain state and systems.
- `src/rendering/`: poly-art scene and visual representations.
- `src/ui/`: panels, maps, reports and notifications.
- `src/content/`: declarative game data.

## Scaling rule

Start with city and district aggregates, then household cohorts. Promote an individual citizen only when a specific event, policy, organization or player inspection makes their detail useful. Never run full individual-agent simulation for the whole population.

## CODING STANDARDS

- Keep each source file to approximately 200 lines or fewer. Going past that is a signal to split by responsibility, such as separating district services, economy and social logic into files under `district/`.
- Do not duplicate calculations across cohorts, households and citizens. Put shared formulas—utility scoring, needs satisfaction, risk curves and similar logic—in `core/` or a shared `simulation/formulas/` module and import them.
- Every system exposes a small, explicit public interface: a few typed functions or types. Keep calculation details private; consumers use the interface rather than internal state.
- Before adding a system or expanding one, search for an existing formula or utility that solves a similar problem. Extend or reuse it instead of creating a parallel implementation.
- After functionality works, perform a short refactor pass: extract repeated blocks, clarify names and remove dead code before moving on. Do not defer routine cleanup to a later sprint.
- Keep content data declarative in `content/`. Logic that reads and applies content stays generic—one interpreter, not one function per policy or event.
- Tests and pure logic in `core/` and `simulation/` must never import from `rendering/` or `ui/`. This preserves both layering and small, single-purpose files.

## Trigger

Use this skill automatically for every Metropolica coding, architecture, simulation, content, performance or scope decision in this repository.
