/**
 * Punto único de calibración económica.
 *
 * Las cifras representan créditos mensuales de juego en una ciudad de un país
 * en desarrollo: ingresos moderados, inversión pública limitada y proyectos
 * que requieren priorizar. La simulación fiscal completa podrá extender este
 * perfil sin volver a distribuir números mágicos por la UI y el servidor.
 */
export const DEVELOPMENT_ECONOMY = {
  treasury: { initial: 120_000, debt: 180_000, taxRate: 0.12, collectionsPerMonth: 4 },
  household: {
    centro: { income: 520, monthlyCost: 300 },
    periferia: { income: 280, monthlyCost: 170 },
    zona_industrial: { income: 650, monthlyCost: 360 },
  },
  construction: {
    'zone-r': 1_200,
    'zone-c': 2_500,
    hospital: 15_000,
    'mall-government': 11_000,
    bank: 18_000,
    'zone-i': 3_500,
    road: 600,
    park: 1_000,
    power: 14_000,
    demolish: 450,
  },
} as const;

export type ConstructionType = keyof typeof DEVELOPMENT_ECONOMY.construction;

export function constructionCost(zoneType: string, specialty?: string): number {
  if (zoneType === 'zone-c' && (specialty === 'hospital' || specialty === 'mall-government' || specialty === 'bank')) {
    return DEVELOPMENT_ECONOMY.construction[specialty];
  }
  return DEVELOPMENT_ECONOMY.construction[zoneType as ConstructionType] ?? 0;
}

/** A small pure seam for the future operating-budget simulation. */
export function estimateMonthlyFiscalBalance(revenue: number, operatingCosts: number, investment = 0): number {
  return revenue - operatingCosts - investment;
}
