export type DevLogLevel = 'info' | 'warn' | 'error' | 'action' | 'anim';

export interface DevLogEntry {
  id: string;
  timestamp: string;
  level: DevLogLevel;
  category: string;
  message: string;
  details?: any;
}

export interface SelectedObjectInfo {
  id: string;
  type: string;
  name: string;
  isoPos: { x: number; y: number; z: number };
  gridPos: { col: number; row: number };
  state: Record<string, any>;
  history: Array<{ timestamp: string; property: string; oldValue: any; newValue: any }>;
}

type DevLogListener = (logs: DevLogEntry[]) => void;
type DevStateListener = () => void;

class DevModeManager {
  private active = false;
  private paused = false;
  private logs: DevLogEntry[] = [];
  private selectedObject: SelectedObjectInfo | null = null;
  private logListeners: Set<DevLogListener> = new Set();
  private stateListeners: Set<DevStateListener> = new Set();
  private maxLogs = 200;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        const isAltShiftD = e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd');
        const isF12OrCtrlShiftI = e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'));
        
        if (isAltShiftD || isF12OrCtrlShiftI) {
          if (e.key === 'F12' || isAltShiftD) e.preventDefault();
          this.toggleActive();
        }
      });
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public setActive(active: boolean): void {
    if (this.active !== active) {
      this.active = active;
      this.addLog('info', 'System', `Modo Desarrollador ${active ? 'Activado' : 'Desactivado'}`);
      this.notifyState();
    }
  }

  public toggleActive(): boolean {
    this.setActive(!this.active);
    return this.active;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setPaused(paused: boolean): void {
    if (this.paused !== paused) {
      this.paused = paused;
      this.addLog('action', 'Simulación', `Simulación ${paused ? 'Pausada' : 'Reanudada'}`);
      this.notifyState();
    }
  }

  public togglePaused(): boolean {
    this.setPaused(!this.paused);
    return this.paused;
  }

  public addLog(level: DevLogLevel, category: string, message: string, details?: any): void {
    const time = new Date();
    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}.${String(time.getMilliseconds()).padStart(3, '0')}`;
    
    const entry: DevLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      level,
      category,
      message,
      details
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notifyLogs();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyLogs();
  }

  public getLogs(): DevLogEntry[] {
    return [...this.logs];
  }

  public getSelectedObject(): SelectedObjectInfo | null {
    return this.selectedObject;
  }

  public setSelectedObject(obj: SelectedObjectInfo | null): void {
    const prevId = this.selectedObject?.id;
    this.selectedObject = obj;
    if (obj && obj.id !== prevId) {
      this.addLog('action', 'Inspector', `Objeto seleccionado: ${obj.name} [ID: ${obj.id}]`, obj);
    }
    this.notifyState();
  }

  public subscribeLogs(listener: DevLogListener): () => void {
    this.logListeners.add(listener);
    listener(this.getLogs());
    return () => this.logListeners.delete(listener);
  }

  public subscribeState(listener: DevStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyLogs(): void {
    const current = this.getLogs();
    this.logListeners.forEach(fn => fn(current));
  }

  private notifyState(): void {
    this.stateListeners.forEach(fn => fn());
  }
}

export const devManager = new DevModeManager();
