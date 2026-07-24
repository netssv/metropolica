import { useCallback, useEffect, useMemo, useRef } from 'react';
import { gridToIso } from '../../lib/isoMath';
import { createProjection, gridToView, screenToGrid, type Projection, type ProjectionOptions } from '../../lib/projection';

type CanvasRef = { current: HTMLCanvasElement | null };
type CameraState = { ox: number; oy: number; zoom: number; rotation: number };

export type MapCamera = {
  ref: { current: CameraState };
  values(): CameraState;
  options(): ProjectionOptions;
  project: Projection;
  gridAt(x: number, y: number): { col: number; row: number };
  panBy(dx: number, dy: number): void;
  zoomAt(x: number, y: number, factor: number): void;
  rotateBy(steps: number): void;
  centerOn(col: number, row: number): void;
  centerWorld(): void;
  follow(col: number, row: number): void;
};

export function useMapCamera(canvasRef: CanvasRef, cols: number, rows: number): MapCamera {
  const stateRef = useRef<CameraState>({ ox: 0, oy: 0, zoom: 1, rotation: 0 });
  const options = useCallback((): ProjectionOptions => {
    const canvas = canvasRef.current;
    return { zoom: stateRef.current.zoom, offsetX: stateRef.current.ox, offsetY: stateRef.current.oy, cols, rows, width: canvas?.width ?? window.innerWidth, height: canvas?.height ?? window.innerHeight, rotation: stateRef.current.rotation };
  }, [canvasRef, cols, rows]);
  const project = useCallback<Projection>((col, row) => createProjection(options())(col, row), [options]);
  const gridAt = useCallback((x: number, y: number) => screenToGrid(x, y, options()), [options]);
  const centerOn = useCallback((col: number, row: number) => {
    const canvas = canvasRef.current;
    const zoom = stateRef.current.zoom;
    const view = gridToView(col, row, cols, rows, stateRef.current.rotation);
    const iso = gridToIso(view.col, view.row);
    stateRef.current.ox = (canvas?.width ?? window.innerWidth) / 2 - (iso.x + 32) * zoom;
    stateRef.current.oy = (canvas?.height ?? window.innerHeight) / 2 - (iso.y + 16) * zoom;
  }, [canvasRef, cols, rows]);
  const follow = useCallback((col: number, row: number) => centerOn(col, row), [centerOn]);
  const centerWorld = useCallback(() => {
    const canvas = canvasRef.current;
    const zoom = stateRef.current.zoom;
    const view = gridToView((cols - 1) / 2, (rows - 1) / 2, cols, rows, stateRef.current.rotation);
    stateRef.current.ox = (canvas?.width ?? window.innerWidth) / 2 - (view.col - view.row) * 32 * zoom;
    stateRef.current.oy = (canvas?.height ?? window.innerHeight) / 2 - (view.col + view.row) * 16 * zoom;
  }, [canvasRef, cols, rows]);
  const zoomAt = useCallback((x: number, y: number, factor: number) => {
    const oldZoom = stateRef.current.zoom;
    const newZoom = Math.max(0.3, Math.min(8, oldZoom * factor));
    const ix = (x - stateRef.current.ox) / oldZoom;
    const iy = (y - stateRef.current.oy) / oldZoom;
    stateRef.current.zoom = newZoom;
    stateRef.current.ox = x - ix * newZoom;
    stateRef.current.oy = y - iy * newZoom;
  }, []);
  const panBy = useCallback((dx: number, dy: number) => {
    stateRef.current.ox += dx;
    stateRef.current.oy += dy;
  }, []);
  const rotateBy = useCallback((steps: number) => {
    const canvas = canvasRef.current;
    const x = (canvas?.width ?? window.innerWidth) / 2;
    const y = (canvas?.height ?? window.innerHeight) / 2;
    const focused = screenToGrid(x, y, options());
    stateRef.current.rotation = ((stateRef.current.rotation + steps) % 4 + 4) % 4;
    centerOn(Math.max(0, Math.min(cols - 1, focused.col)), Math.max(0, Math.min(rows - 1, focused.row)));
  }, [canvasRef, centerOn, cols, options, rows]);
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerWorld();
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef, centerWorld]);
  return useMemo(() => ({ ref: stateRef, values: () => ({ ...stateRef.current }), options, project, gridAt, panBy, zoomAt, rotateBy, centerOn, centerWorld, follow }), [options, project, gridAt, panBy, zoomAt, rotateBy, centerOn, centerWorld, follow]);
}
