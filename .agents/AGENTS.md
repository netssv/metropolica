# Rules

## Refactoring Rule
- Files MUST NOT exceed 200 lines. Modularize your code using components, imports, and clear directory structures.

## DevMode Live-Tune Verification Rule
- Whenever creating or modifying building/structure renderers or isometric visual assets, ensure they are registered and verifiable via DevMode live tuning (`genericTuneState.ts` / `DevInspectorPanel.tsx`).
- Structure parameters such as height, peak, base offset, scale (X/Y), rotation, opacity, and accent colors MUST be exposed in raw form so perspective data can be inspected, shared, and tuned dynamically in real time.
## Isometric Layer Depth-Sorting Rule
- All 3D structures and dynamic entities (buildings, traffic light signals, vehicles, pedestrians) MUST be rendered in strict isometric depth order (`depth = view.col + view.row`).
- Dynamic entities such as vehicles MUST NOT be rendered in a separate global overlay pass after all buildings have already finished drawing. They must be interleaved or rendered tile-by-tile according to their grid tile depth so that foreground buildings correctly occlude background vehicles.
