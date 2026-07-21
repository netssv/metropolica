## Active refactor: CanvasMap.tsx / serve.ts modularization
Goal: split by responsibility, zero behavior change, per
PROJECT_STATUS.md architecture rules.

### Done (do not re-derive, just trust this)
- serve.ts split into server/http.ts, apiState.ts, apiCommands.ts,
  apiPersistence.ts, staticFiles.ts, types.ts. Shared state via
  ServerContext. Tests passing.
- useMapCamera.ts extracted from CanvasMap.tsx. Contract:
  { values(), project, gridAt, panBy(), zoomAt(), centerOn(), follow() }.
  Consumed by render and hit-testing — no local zoom/offset derivation
  remains anywhere else.

### Established contracts (reuse, do not redesign)
- traffic/citizenTransit: live instances are being moved into
  useMapRenderer.ts hook refs, updated every frame. Exposed as stable wrapper handles:
  { traffic: { getCarAt, getPosition }, citizenTransit: { getCitizenAt } }.
  useMapInteraction.ts must call these exact wrappers — never snapshot
  or recreate instances.
- hover/selection state: stays in CanvasMap.tsx (hoverCol/hoverRow,
  selectedEntityRef), passed as read-only inputs to the renderer,
  updated via callbacks from interaction. Avoids circular dependency
  between renderer and interaction hooks.
- Animation-frame cleanup: owned by useMapRenderer.ts after this phase.
  CanvasMap.tsx no longer owns the render loop or disposes citizen transit.

### Completed
`useMapInteraction.ts` now owns mouse down/move/up, hover tracking, wheel,
tile/citizen hit-testing, selection and PLACE_ZONE/DEMOLISH_TILE dispatch.
It consumes `useMapCamera` and the stable citizenTransit wrapper. Citizen
consumption `postCommand` remains inside citizens/transit.ts and is not part
of interaction. Traffic handles remain compatibility wrappers because the
current anonymous traffic system has no live vehicle instance.

### Not started yet
Further composition cleanup is optional; renderer and interaction extraction
are complete.

Instructions for whoever (human or agent) resumes this: read only this
file plus the two already-modified files before proceeding. Do not
re-read PROJECT_STATUS.md's full sprint history unless the architecture
rules section is unclear.
