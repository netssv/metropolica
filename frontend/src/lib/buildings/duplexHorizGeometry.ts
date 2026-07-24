/**
 * Geometry calculations for Horizontal Duplex (2 tiles left-to-right).
 * Computes footprint, lot insets, camera rotation, and wall projection vectors.
 */

import type { DrawArgs } from './types.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import type { DuplexHorizTuneParams } from './duplexHorizTuneState.ts';

export interface DuplexHorizGeometry {
  fX0: number;
  fY0: number;
  fX1: number;
  fY1: number;
  bX0: number;
  bY0: number;
  bX1: number;
  bY1: number;
  depthX: number;
  depthY: number;
  rot: number;
  isRearView: boolean;
  showEntranceFacade: boolean;
}

export function computeDuplexHorizGeometry(
  args: DrawArgs,
  tune: DuplexHorizTuneParams
): DuplexHorizGeometry {
  const { px, py, zoom, project, tileCol, tileRow } = args;

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  const pA = project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow)
    : { x: px, y: py };
  const pB = project && tileCol != null && tileRow != null
    ? project(tileCol + 1, tileRow)
    : { x: pA.x + TW / 2, y: pA.y + TH / 2 };
  const pS = project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow + 1)
    : { x: pA.x - TW / 2, y: pA.y + TH / 2 };

  const cameraRot = Math.round(args.rotation ?? 0) % 4;
  const rot = (Math.round(tune.rotation) + cameraRot + 4) % 4;
  const isRearView = rot === 2 || rot === 3;
  const showEntranceFacade = rot === 0;

  const baseH = tune.baseH * zoom;

  const u = { x: pB.x - pA.x, y: pB.y - pA.y };
  const v = { x: pS.x - pA.x, y: pS.y - pA.y };
  const center = { x: pA.x + TW / 2, y: pA.y + TH / 2 };
  const p00 = { x: center.x - u.x * 0.5 - v.x * 0.5, y: center.y - u.y * 0.5 - v.y * 0.5 };
  const p20 = { x: center.x + u.x * 1.5 - v.x * 0.5, y: center.y + u.y * 1.5 - v.y * 0.5 };
  const p21 = { x: center.x + u.x * 1.5 + v.x * 0.5, y: center.y + u.y * 1.5 + v.y * 0.5 };
  const p01 = { x: center.x - u.x * 0.5 + v.x * 0.5, y: center.y - u.y * 0.5 + v.y * 0.5 };

  const endInset = 0.08;
  const curbInset = 0.14;
  const q00 = { x: p00.x + u.x * endInset + v.x * curbInset, y: p00.y + u.y * endInset + v.y * curbInset };
  const q20 = { x: p20.x - u.x * endInset + v.x * curbInset, y: p20.y - u.y * endInset + v.y * curbInset };
  const q21 = { x: p21.x - u.x * endInset - v.x * curbInset, y: p21.y - u.y * endInset - v.y * curbInset };
  const q01 = { x: p01.x + u.x * endInset - v.x * curbInset, y: p01.y + u.y * endInset - v.y * curbInset };

  let fX0 = 0, fY0 = 0, fX1 = 0, fY1 = 0, depthX = 0, depthY = 0;
  switch (rot) {
    case 1:
      fX0 = q01.x; fY0 = q01.y;
      fX1 = q21.x; fY1 = q21.y;
      depthX = q01.x - q00.x; depthY = q01.y - q00.y;
      break;
    case 2:
      fX0 = q20.x; fY0 = q20.y;
      fX1 = q00.x; fY1 = q00.y;
      depthX = q20.x - q21.x; depthY = q20.y - q21.y;
      break;
    case 3:
      fX0 = q00.x; fY0 = q00.y;
      fX1 = q20.x; fY1 = q20.y;
      depthX = q00.x - q01.x; depthY = q00.y - q01.y;
      break;
    default:
      fX0 = q01.x; fY0 = q01.y;
      fX1 = q21.x; fY1 = q21.y;
      depthX = q01.x - q00.x; depthY = q01.y - q00.y;
  }

  fY0 -= baseH;
  fY1 -= baseH;

  const bX0 = fX0 - depthX;  const bY0 = fY0 - depthY;
  const bX1 = fX1 - depthX;  const bY1 = fY1 - depthY;

  return {
    fX0, fY0, fX1, fY1,
    bX0, bY0, bX1, bY1,
    depthX, depthY,
    rot, isRearView, showEntranceFacade,
  };
}
