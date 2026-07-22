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
  zona_industrial: 'Zona Industrial',
  residencial: 'Residencial', casa: 'Casa', duplex: 'Dúplex', apartamento: 'Apartamento',
  comercial: 'Comercial', mallGovernment: 'Gobierno / centro comercial', industrial: 'Industrial',
  parque: 'Parque', calle: 'Calle', centralElectrica: 'Central eléctrica', agua: 'Agua', terreno: 'Terreno',
  hogaresAsignados: 'Hogares asignados', residencialesOcupados: 'Viviendas ocupadas'
};

export function t(key: string): string {
  return LABELS[key] || key;
}
