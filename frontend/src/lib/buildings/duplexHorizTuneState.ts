/**
 * Horizontal Duplex Tune State — completamente independiente del Vertical Duplex.
 * Solo afecta a drawHorizontalDuplex. El Vertical usa sus propias constantes internas.
 */

export interface DuplexHorizTuneParams {
  height:      number; // Altura base de muros (px base × zoom)
  peak:        number; // Altura del tejado (px base × zoom)
  baseH:       number; // Grosor del cimiento (px base × zoom)
  depthMultX:  number; // Profundidad X como fracción de TW (negativo = izquierda)
  depthMultY:  number; // Profundidad Y como fracción de TH
  facadeMult:  number; // Largo fachada frontal como fracción de TW
  rotAngle:    number; // Inclinación eje SE (0.5 = neutro)
  offsetX:     number; // Offset X fino (px base × zoom)
  offsetY:     number; // Offset Y fino (px base × zoom)
  doorScale:   number; // Escala puertas (1.0 = normal)
  winScale:    number; // Escala ventanas (1.0 = normal)
  // ── Nuevos controles de volumen y niveles ────────────────────────────
  backAlpha:    number; // Opacidad pared trasera NE  (0-1)
  rightAlpha:   number; // Opacidad pared lateral der. SE (0-1)
  canopyYMult:  number; // Nivel marquesina (fracción de height)
  winYMult:     number; // Nivel ventanas fachada frontal (fracción de height)
  sideWinYMult: number; // Nivel ventanas pared lateral (fracción de height)
  chimneyPosT:  number; // Posición chimenea a lo largo del tejado (0..1)
  chimneyDepth: number; // Profundidad chimenea en el tejado (0..1)
  chimneyH:     number; // Altura chimenea (px)
  rotation:     number; // Rotación en pasos de 90° ajustada a tiles (0=SW 1=SE 2=NE 3=NW)
}

/** Valores fijados manualmente para la perspectiva correcta del Dúplex Horizontal */
export const DUPLEX_HORIZ_DEFAULTS: DuplexHorizTuneParams = {
  height:      22,
  peak:        11,
  baseH:        1.5,
  depthMultX:  -0.4,
  depthMultY:   0.3,
  facadeMult:   0.85,
  rotAngle:     0.56,
  offsetX:      5,
  offsetY:      0,
  doorScale:    0.9,
  winScale:     1.0,
  // ── Volumen y niveles ─────────────────────────────────
  backAlpha:    1.0,
  rightAlpha:   1.0,
  canopyYMult:  0.48,
  winYMult:     0.62,
  sideWinYMult: 0.60,
  chimneyPosT:  0.28,
  chimneyDepth: 0.35,
  chimneyH:     7.5,
  rotation:     0,
};

class DuplexHorizTuneManager {
  private params: DuplexHorizTuneParams = { ...DUPLEX_HORIZ_DEFAULTS };
  private listeners: Set<(p: DuplexHorizTuneParams) => void> = new Set();

  public getParams(): DuplexHorizTuneParams {
    return { ...this.params };
  }

  public setParam<K extends keyof DuplexHorizTuneParams>(key: K, value: number): void {
    this.params[key] = value;
    this.notify();
  }

  public setParams(partial: Partial<DuplexHorizTuneParams>): void {
    this.params = { ...this.params, ...partial };
    this.notify();
  }

  public reset(): void {
    this.params = { ...DUPLEX_HORIZ_DEFAULTS };
    this.notify();
  }

  public subscribe(fn: (p: DuplexHorizTuneParams) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const copy = { ...this.params };
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const duplexHorizTune = new DuplexHorizTuneManager();
