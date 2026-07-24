import type { DrawArgs } from './types.ts';
import { getBuildingFacing, type StreetOrientation } from './streetOrientation.ts';

export interface Building3DVolume {
  /** Screen center x coordinate of the base diamond */
  cx: number;
  /** Screen bottom y coordinate of the base diamond */
  base: number;
  /** Half width of building footprint */
  hw: number;
  /** Half height of building footprint */
  hh: number;
  /** Scaled height in pixels */
  height: number;
  /** Calculated effective camera rotation index (0 to 3) accounting for camera rotation & street facing */
  effectiveRot: number;
  /** World street facing direction ('south', 'west', 'north', 'east') */
  facing: StreetOrientation;
  /** Active camera quarter-turn rotation (0, 1, 2, 3) */
  cameraRot: number;
}

const FACING_OFFSET_MAP: Record<StreetOrientation, number> = {
  south: 0, // Road on SE side -> Door on SE screen face at camera rot 0
  west: 1,  // Road on SW side -> Door on SW screen face at camera rot 0
  north: 2, // Road on NW side -> Door on NW screen face at camera rot 0
  east: 3,  // Road on NE side -> Door on NE screen face at camera rot 0
};

/**
 * Computes unified 3D volume parameters for building renderers.
 * Guarantees that street facing magnet behavior, 3D face orientation,
 * and camera rotation occlusion are cleanly synchronized across all structures.
 */
export function computeBuilding3DVolume(
  args: DrawArgs,
  cx: number,
  base: number,
  rawHw: number,
  rawHh: number,
  buildingHeight: number,
  scaleX = 0.75,
  scaleY = 1.0
): Building3DVolume {
  const { zoom, map, tileCol, tileRow, rotation = 0 } = args;
  const cameraRot = ((Math.round(rotation) % 4) + 4) % 4;

  const facing = (tileCol != null && tileRow != null)
    ? getBuildingFacing(map, tileCol, tileRow)
    : 'west';

  const effectiveRot = (cameraRot + FACING_OFFSET_MAP[facing]) % 4;

  return {
    cx,
    base,
    hw: rawHw * scaleX,
    hh: rawHh * scaleY,
    height: buildingHeight * zoom,
    effectiveRot,
    facing,
    cameraRot,
  };
}

/**
 * Draws solid 3D box walls with dynamic lighting according to 3D orientation.
 */
export function draw3DVolumeWalls(
  ctx: CanvasRenderingContext2D,
  vol: Building3DVolume,
  wallLight: string,
  wallShade: string
) {
  const { cx, base, hw, hh, height, effectiveRot } = vol;

  const swColor = effectiveRot === 0 || effectiveRot === 3 ? wallLight : wallShade;
  const seColor = effectiveRot === 0 || effectiveRot === 1 ? wallShade : wallLight;

  // SW wall (screen bottom-left)
  ctx.fillStyle = swColor;
  ctx.beginPath();
  ctx.moveTo(cx - hw, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // SE wall (screen bottom-right)
  ctx.fillStyle = seColor;
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.closePath();
  ctx.fill();
}
