declare let gameCanvas: HTMLCanvasElement;
declare let isDragging: boolean;
declare let dragMoved: boolean;
declare let dragStart: { x: number; y: number };
declare let dragCamStart: { x: number; y: number };
declare let cam: { x: number; y: number; zoom: number };
declare let hoveredTile: { col: number; row: number } | null;
declare let MAP_COLS: number;
declare let MAP_ROWS: number;
declare let currentTool: string;
declare let dashboardOpen: boolean;
declare let activeDashTab: string;
declare let currentFilter: string;
declare function clampCam(): void;
declare function screenToWorld(x: number, y: number): { x: number; y: number };
declare function worldToTile(x: number, y: number): { col: number; row: number };
declare function inspectTile(col: number, row: number): void;
declare function placeTile(col: number, row: number): void;
declare function toolCursor(): string;
declare function zoomAt(x: number, y: number, scale: number): void;
declare function zoomIn(): void;
declare function zoomOut(): void;
declare function toggleDashboard(): void;
declare function closeInspector(): void;
declare function renderCitizensList(): void;
declare function selectTool(tool: string): void;

export function initInputHandlers() {
  const cv = gameCanvas;

  cv.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isDragging = true;
      dragMoved = false;
      dragStart = { x: e.clientX, y: e.clientY };
      dragCamStart = { x: cam.x, y: cam.y };
      cv.style.cursor = 'grabbing';
    }
  });

  cv.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / cam.zoom;
      const dy = (e.clientY - dragStart.y) / cam.zoom;
      if (Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) > 3) {
        dragMoved = true;
      }
      cam.x = dragCamStart.x - dx;
      cam.y = dragCamStart.y - dy;
      clampCam();
    }
    const w = screenToWorld(e.clientX, e.clientY);
    const t = worldToTile(w.x, w.y);
    hoveredTile =
      t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS ? t : null;
  });

  cv.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    cv.style.cursor = toolCursor();

    if (!dragMoved) {
      const w = screenToWorld(e.clientX, e.clientY);
      const t = worldToTile(w.x, w.y);
      if (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) {
        if (currentTool === 'cursor') {
          inspectTile(t.col, t.row);
        } else {
          placeTile(t.col, t.row);
        }
      }
    }
  });

  cv.addEventListener('mouseleave', () => {
    isDragging = false;
    hoveredTile = null;
    cv.style.cursor = toolCursor();
  });

  cv.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89);
    },
    { passive: false }
  );

  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    ) {
      return;
    }
    switch (e.key) {
      case '1':
        selectTool('cursor');
        break;
      case '2':
        selectTool('zone-r');
        break;
      case '3':
        selectTool('zone-c');
        break;
      case '4':
        selectTool('zone-i');
        break;
      case '5':
        selectTool('road');
        break;
      case '6':
        selectTool('park');
        break;
      case '7':
        selectTool('power');
        break;
      case 'x':
      case 'X':
        selectTool('demolish');
        break;
      case 'Escape':
        selectTool('cursor');
        closeInspector();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
      case '_':
        zoomOut();
        break;
      case ' ':
        e.preventDefault();
        toggleDashboard();
        break;
    }
  });

  // Touch support (pan + pinch-zoom)
  let lastTouchDist = 0;
  cv.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging = true;
        dragMoved = false;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragCamStart = { x: cam.x, y: cam.y };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    },
    { passive: false }
  );

  cv.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const dx = (e.touches[0].clientX - dragStart.x) / cam.zoom;
        const dy = (e.touches[0].clientY - dragStart.y) / cam.zoom;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
        cam.x = dragCamStart.x - dx;
        cam.y = dragCamStart.y - dy;
        clampCam();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (lastTouchDist > 0) zoomAt(mx, my, dist / lastTouchDist);
        lastTouchDist = dist;
      }
    },
    { passive: false }
  );

  cv.addEventListener(
    'touchend',
    () => {
      isDragging = false;
    },
    { passive: false }
  );
}
