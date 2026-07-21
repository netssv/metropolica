export const LABELS: Record<string, string> = {
  water: 'Agua',
  electricity: 'Electricidad',
  waste: 'Residuos',
  safety: 'Seguridad',
  internet: 'Internet',
  gasolina: 'Gasolina',
  supermercado: 'Supermercado',
  hospitales: 'Hospitales',
  bomberos: 'Bomberos',
  ocio: 'Ocio',
  'telefonía': 'Telefonía',
  averageIncome: 'Ingreso promedio',
  UNION: 'Sindicato',
  NIMBY: 'Vecinal',
  BUSINESS: 'Negocios',
  CRIMINAL: 'Criminal',
  MEDIA: 'Prensa',
  POLITICAL: 'Político',
  ECO: 'Ecologista',
  TECH: 'Tecnología',
  centro: 'Centro',
  periferia: 'Periferia',
  zona_industrial: 'Zona Industrial'
};

export function t(key: string): string {
  return LABELS[key] || key;
}
