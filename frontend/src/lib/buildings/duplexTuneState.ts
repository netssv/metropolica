/**
 * Duplex Tune Config - Almacena las dimensiones y proporciones dinámicas para el tuning en vivo.
 * Incluye ajuste fino de rotación, profundidad en X/Y, inclinación del tejado, aleros y posición.
 */

export interface DuplexTuneParams {
  height: number;       // Altura base de los muros (px base, se multiplica x zoom)
  peak: number;         // Altura adicional del tejado (px base, se multiplica x zoom)
  baseH: number;        // Grosor del cimiento (px base, se multiplica x zoom)
  depthMultX: number;   // Profundidad lateral eje X como fracción de TW (negativo = hacia la izquierda)
  depthMultY: number;   // Profundidad lateral eje Y como fracción de TH
  facadeMult: number;   // Largo fachada frontal como fracción de TW
  rotAngle: number;     // Ángulo de inclinación del eje SE (0.5 = vertical neutro)
  offsetX: number;      // Desplazamiento X fino (px base, se multiplica x zoom)
  offsetY: number;      // Desplazamiento Y fino (px base, se multiplica x zoom)
  doorScale: number;    // Escala del tamaño de las puertas (1.0 = normal)
  winScale: number;     // Escala del tamaño de las ventanas (1.0 = normal)
}

export const DUPLEX_TUNE_DEFAULTS: DuplexTuneParams = {
  // --- Dúplex Horizontal (tuned manually) ---
  height:     34,
  peak:       18,
  baseH:       7,
  depthMultX: -0.4,
  depthMultY:  0.45,
  facadeMult:  0.9,
  rotAngle:    0.46,
  offsetX:    10,
  offsetY:     6,
  doorScale:   1.0,
  winScale:    1.1,
};

class DuplexTuneManager {
  private params: DuplexTuneParams = { ...DUPLEX_TUNE_DEFAULTS };
  private listeners: Set<(params: DuplexTuneParams) => void> = new Set();

  public getParams(): DuplexTuneParams {
    return { ...this.params };
  }

  public setParam<K extends keyof DuplexTuneParams>(key: K, value: number): void {
    this.params[key] = value;
    this.notify();
  }

  public setParams(newParams: Partial<DuplexTuneParams>): void {
    this.params = { ...this.params, ...newParams };
    this.notify();
  }

  public reset(): void {
    this.params = { ...DUPLEX_TUNE_DEFAULTS };
    this.notify();
  }

  public subscribe(fn: (params: DuplexTuneParams) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.params));
  }
}

export const duplexTune = new DuplexTuneManager();
