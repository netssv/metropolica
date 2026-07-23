import { drawIsoTile } from '../../lib/isoRenderer';
import { T } from '../../lib/constants';
import { isTileInViewport } from './mapTileRenderers';

export function drawBuildingsLayer(
  ctx: CanvasRenderingContext2D,
  drawOrder: any[],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  margin: number,
  map: any[][],
  project: any,
  time: number,
  ox: number,
  oy: number,
  rotation: number,
  simState: any,
  housingByTile: Map<string, any>,
  houseRoles: Map<string, any>,
  markerSet: Set<string>
): { visibleTiles: number; proceduralBuildingMs: number } {
  let visibleTiles = 0;
  let proceduralBuildingMs = 0;

  for (const { tile, col, row, projected } of drawOrder) {
    if (!tile) continue;
    if (
      !tile.type.startsWith('bldg-') &&
      !tile.type.startsWith('zone-') &&
      tile.type !== T.POWER &&
      tile.type !== T.PARK
    )
      continue;
    if (!isTileInViewport(projected, canvasWidth, canvasHeight, zoom, margin)) continue;

    visibleTiles++;
    const district = simState?.districts?.find((d: any) => d.id === tile.owner);
    const growthTier = !district
      ? 0
      : district.population >= 2000 && district.economy?.averageIncome >= 2000 && district.approval >= 0.65
      ? 2
      : district.population >= 700 && district.economy?.averageIncome >= 1000 && district.approval >= 0.45
      ? 1
      : 0;

    const housing =
      tile.type === T.BLDG_R || tile.type === T.ZONE_R
        ? housingByTile.get(`${tile.owner ?? ''}:${col}:${row}`)
        : undefined;
    const occupiedResidentialTier = !housing ? 0 : housing.householdSize >= 2 ? 2 : 1;
    const builtStructureTier = tile.type.startsWith('bldg-') ? Math.max(1, growthTier) : growthTier;
    const effectiveGrowthTier =
      tile.type === T.BLDG_R || tile.type === T.ZONE_R ? occupiedResidentialTier : builtStructureTier;
    const houseRole = houseRoles.get(`${col}:${row}`);

    const start = performance.now();
    try {
      drawIsoTile(
        ctx,
        {
          ...tile,
          housing,
          houseRole,
          businessAccentTiles: markerSet.has(`${tile.type}:${col}:${row}`) ? [tile] : [],
          inCrisis: district?.social?.atRisk ?? false,
          growthTier: effectiveGrowthTier,
        },
        col,
        row,
        ox,
        oy,
        zoom,
        map,
        project,
        time,
        false,
        rotation
      );
    } catch (err) {
      console.error(`Error rendering building tile at (${col},${row}):`, err);
    }
    proceduralBuildingMs += performance.now() - start;
  }

  return { visibleTiles, proceduralBuildingMs };
}
