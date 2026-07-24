declare let lastFrameTs: number;
declare let gameTime: number;
declare let gameCanvas: HTMLCanvasElement;
declare let gameCtx: CanvasRenderingContext2D;
declare let TILE_SIZE: number;
declare let MAP_COLS: number;
declare let MAP_ROWS: number;
declare let cam: { x: number; y: number; zoom: number };
declare let tileMap: any[][];
declare let hoveredTile: { col: number; row: number } | null;
declare let currentTool: string;
declare let simState: any;
declare let DISTRICT_ZONES: any[];
declare let MAP_H: number;
declare function updatePedestrians(dt: number): void;
declare function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: any,
  px: number,
  py: number,
  ts: number,
  time: number,
  col: number,
  row: number
): void;
declare function drawDistrictOverlay(
  ctx: CanvasRenderingContext2D,
  ts: number,
  startR: number,
  endR: number
): void;
declare function toolColor(): string;

import { initInputHandlers } from './render/input.ts';
import {
  updateHUD,
  renderDistricts,
  bar,
  orgLabel,
  orgIcon,
  renderOrganizations,
  renderCorruption,
  severityClass,
  renderFootprintLog
} from './render/hud.ts';

export {
  initInputHandlers,
  updateHUD,
  renderDistricts,
  bar,
  orgLabel,
  orgIcon,
  renderOrganizations,
  renderCorruption,
  severityClass,
  renderFootprintLog
};

export function renderFrame(timestamp: number) {
  const dt = Math.min((timestamp - lastFrameTs) / 1000, 0.12);
  lastFrameTs = timestamp;
  gameTime += dt;

  updatePedestrians(dt);

  const cw = gameCanvas.width;
  const ch = gameCanvas.height;
  const ts = TILE_SIZE;

  // Clear
  gameCtx.setTransform(1, 0, 0, 1, 0, 0);
  gameCtx.fillStyle = '#070d18';
  gameCtx.fillRect(0, 0, cw, ch);

  // Apply camera transform (world-space drawing)
  gameCtx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);

  // Visible tile range (with 1-tile padding)
  const visW = cw / cam.zoom;
  const visH = ch / cam.zoom;
  const startC = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endC = Math.min(MAP_COLS - 1, Math.ceil((cam.x + visW) / ts) + 1);
  const startR = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endR = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + visH) / ts) + 1);

  // Draw tiles
  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const tile = tileMap[r]?.[c];
      if (tile) drawTile(gameCtx, tile, c * ts, r * ts, ts, gameTime, c, r);
    }
  }

  // Grid lines (only when zoomed in)
  if (cam.zoom >= 0.55) {
    gameCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    gameCtx.lineWidth = 0.5;
    for (let c = startC; c <= endC + 1; c++) {
      gameCtx.beginPath();
      gameCtx.moveTo(c * ts, startR * ts);
      gameCtx.lineTo(c * ts, (endR + 1) * ts);
      gameCtx.stroke();
    }
    for (let r = startR; r <= endR + 1; r++) {
      gameCtx.beginPath();
      gameCtx.moveTo(startC * ts, r * ts);
      gameCtx.lineTo((endC + 1) * ts, r * ts);
      gameCtx.stroke();
    }
  }

  // District boundary lines & labels
  drawDistrictOverlay(gameCtx, ts, startR, endR);

  // Tool hover highlight
  if (hoveredTile && currentTool !== 'cursor') {
    const { col, row } = hoveredTile;
    gameCtx.fillStyle = 'rgba(255,255,255,0.12)';
    gameCtx.fillRect(col * ts, row * ts, ts, ts);
    gameCtx.strokeStyle = toolColor();
    gameCtx.lineWidth = 2;
    gameCtx.strokeRect(col * ts + 1, row * ts + 1, ts - 2, ts - 2);
  }

  // At-risk district pulse
  (simState.districts ?? []).forEach((d: any) => {
    if (!d.social?.atRisk) return;
    const zone = DISTRICT_ZONES.find((z) => z.id === d.id);
    if (!zone) return;
    // crisis banner
    const bx = (zone.startCol + (zone.endCol - zone.startCol) / 2) * ts;
    const by = ts * 1.5;
    gameCtx.fillStyle = 'rgba(239,68,68,0.9)';
    gameCtx.fillRect(bx - 52, by - 12, 104, 18);
    gameCtx.fillStyle = '#fff';
    gameCtx.font = 'bold 9px system-ui';
    gameCtx.textAlign = 'center';
    gameCtx.textBaseline = 'middle';
    gameCtx.fillText('⚠ CRISIS LOCAL', bx, by - 3);
    gameCtx.textAlign = 'left';
    gameCtx.textBaseline = 'alphabetic';
  });

  requestAnimationFrame(renderFrame);
}
