/**
 * Vertical Duplex Tune State — completamente independiente del Horizontal.
 * Permite ajustar dinámicamente en DevMode la orientación y parámetros sin alterar la perspectiva.
 */

export interface DuplexVertTuneParams {
  height:       number; // Altura base de muros
  peak:         number; // Altura del tejado
  baseH:        number; // Grosor del cimiento
  rotation:     number; // Rotación de Tile (0=SE, 1=SW, 2=NW, 3=NE)
  chimneyPosT:  number; // Posición chimenea a lo largo del tejado (0..1)
  chimneyDepth: number; // Profundidad chimenea en el tejado (0..1)
  chimneyH:     number; // Altura chimenea (px)
}

export const DUPLEX_VERT_DEFAULTS: DuplexVertTuneParams = {
  height:       22,
  peak:         11,
  baseH:        1.5,
  rotation:      0,
  chimneyPosT:  0.28,
  chimneyDepth: 0.35,
  chimneyH:     7.5,
};

class DuplexVertTuneManager {
  private params: DuplexVertTuneParams = { ...DUPLEX_VERT_DEFAULTS };
  private listeners: Set<(p: DuplexVertTuneParams) => void> = new Set();

  public getParams(): DuplexVertTuneParams {
    return { ...this.params };
  }

  public setParam<K extends keyof DuplexVertTuneParams>(key: K, value: number): void {
    this.params[key] = value;
    this.notify();
  }

  public reset(): void {
    this.params = { ...DUPLEX_VERT_DEFAULTS };
    this.notify();
  }

  public subscribe(fn: (p: DuplexVertTuneParams) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const copy = { ...this.params };
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const duplexVertTune = new DuplexVertTuneManager();
