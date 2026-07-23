import { T } from '../../lib/constants';

let cachedMinimapBaseMap: any = null;

export function renderMinimap(
  miniMapRef: any,
  minimapBase: HTMLCanvasElement,
  map: any[][],
  mapCols: number,
  mapRows: number
): number {
  const mini = miniMapRef.current;
  if (!mini) return 0;

  const startMini = performance.now();
  const miniCtx = mini.getContext('2d');
  if (!miniCtx) return 0;

  const sx = mini.width / mapCols;
  const sy = mini.height / mapRows;

  if (map !== cachedMinimapBaseMap) {
    const base = minimapBase.getContext('2d');
    if (base) {
      base.fillStyle = '#10251d';
      base.fillRect(0, 0, 288, 216);
      for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < (map[r]?.length ?? 0); c++) {
          const type = map[r]?.[c]?.type;
          base.fillStyle =
            type === T.WATER
              ? '#26749a'
              : type === T.ROAD || type === T.BRIDGE
              ? '#b9b5a8'
              : type?.startsWith('bldg')
              ? '#b87333'
              : type === T.TREE
              ? '#276d42'
              : '#315b42';
          base.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
        }
      }
      cachedMinimapBaseMap = map;
    }
  }

  miniCtx.clearRect(0, 0, mini.width, mini.height);
  miniCtx.drawImage(minimapBase, 0, 0, mini.width, mini.height);
  return performance.now() - startMini;
}

export function drawNightOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, hour: number) {
  if (hour >= 6 && hour < 19) return;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 12, 35, 0.38)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 246, 190, 0.9)';
  ctx.beginPath();
  ctx.arc(width - 90, 92, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 12, 35, 0.38)';
  ctx.beginPath();
  ctx.arc(width - 80, 84, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(220, 232, 255, 0.75)';
  for (const [x, y] of [
    [0.12, 0.16],
    [0.3, 0.1],
    [0.52, 0.2],
    [0.72, 0.12],
    [0.88, 0.28],
  ]) {
    ctx.fillRect(width * x, height * y, 2, 2);
  }
  ctx.restore();
}
