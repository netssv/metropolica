/**
 * Generic Building Tune State — Sistema modular y adaptable para afinar cualquier edificio en DevMode.
 * Almacena parámetros comunes de geometría, escala, rotación y colores de acento.
 */

export interface GenericBuildingTuneParams {
  height: number;     // Altura de muros (px * zoom)
  peak: number;       // Altura de tejado/estructura superior
  baseH: number;      // Altura/grosor de cimiento
  scaleX: number;     // Escala eje X / Ancho
  scaleY: number;     // Escala eje Y / Profundidad
  rotation: number;   // Pasos de rotación isometric (0=SW, 1=SE, 2=NE, 3=NW)
  accentColor: string; // Color de acento/tejado
}

export const GENERIC_TUNE_DEFAULTS: Record<string, GenericBuildingTuneParams> = {
  default: {
    height: 20,
    peak: 8,
    baseH: 1,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#3b82f6',
  },
  hospital: {
    height: 38,
    peak: 8,
    baseH: 3,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#ef4444',
  },
  bank: {
    height: 21,
    peak: 9,
    baseH: 3.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    accentColor: '#0284c7',
  },
  house: {
    height: 20,
    peak: 18,
    baseH: 2,
    scaleX: 1.4,
    scaleY: 1,
    rotation: 1,
    accentColor: '#b83232',
  },
  apartment: {
    height: 42,
    peak: 6,
    baseH: 4,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#8b5cf6',
  },
  shop: {
    height: 22,
    peak: 6,
    baseH: 2,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#f59e0b',
  },
  factory: {
    height: 28,
    peak: 12,
    baseH: 3,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#64748b',
  },
  park: {
    height: 4,
    peak: 12,
    baseH: 1,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#22c55e',
  },
  tree: {
    height: 2,
    peak: 16,
    baseH: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#15803d',
  },
  water: {
    height: 0,
    peak: 2,
    baseH: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#0284c7',
  },
  mountain: {
    height: 12,
    peak: 35,
    baseH: 2,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    accentColor: '#78716c',
  },
  road: {
    height: 0,        // No aplica muros
    peak: 0,          // No aplica tejado
    baseH: 2,         // Grosor de bordillo/asfalto
    scaleX: 1.0,      // Anchura / Escala línea horizontal
    scaleY: 1.0,      // Anchura / Escala línea vertical
    rotation: 0,
    accentColor: '#f1c232', // Color de línea demarcadora
  },
  bridge: {
    height: 6,        // Altura/grosor de los pilares de concreto
    peak: 0,          // No aplica tejado
    baseH: 44,        // Ancho/Grosor de la calzada principal del puente (en % ts)
    scaleX: 1.0,      // Escala horizontal del puente
    scaleY: 1.0,      // Escala vertical del puente
    rotation: 0,
    accentColor: '#888888', // Color de los postes/barandas del puente
  },
};

class GenericBuildingTuneManager {
  private params: Record<string, GenericBuildingTuneParams> = JSON.parse(JSON.stringify(GENERIC_TUNE_DEFAULTS));
  private listeners: Set<(params: Record<string, GenericBuildingTuneParams>) => void> = new Set();

  public getParams(buildingType: string = 'default'): GenericBuildingTuneParams {
    return this.params[buildingType] || this.params['default'];
  }

  public setParam(buildingType: string, key: keyof GenericBuildingTuneParams, value: any): void {
    if (!this.params[buildingType]) {
      this.params[buildingType] = { ...GENERIC_TUNE_DEFAULTS['default'] };
    }
    (this.params[buildingType] as any)[key] = value;
    this.notify();
  }

  public reset(buildingType?: string): void {
    if (buildingType && GENERIC_TUNE_DEFAULTS[buildingType]) {
      this.params[buildingType] = { ...GENERIC_TUNE_DEFAULTS[buildingType] };
    } else {
      this.params = JSON.parse(JSON.stringify(GENERIC_TUNE_DEFAULTS));
    }
    this.notify();
  }

  public subscribe(fn: (params: Record<string, GenericBuildingTuneParams>) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const copy = JSON.parse(JSON.stringify(this.params));
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const genericTune = new GenericBuildingTuneManager();
