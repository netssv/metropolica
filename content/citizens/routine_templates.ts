export type RoutineTemplate = {
  id: string;
  activity: string;
  label: string;
  startHour: number;
  endHour: number;
  interests?: string[];
  householdTypes?: string[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  { id: 'social-lunch', activity: 'almuerzo social', label: 'Almuerzo social', startHour: 12, endHour: 13, interests: ['familia', 'amistad', 'comida', 'restaurante'] },
  { id: 'shopping-lunch', activity: 'compras', label: 'Compras', startHour: 12, endHour: 13, interests: ['compras', 'tiendas', 'moda', 'turismo'] },
  { id: 'refuel', activity: 'refuel', label: 'Repostaje', startHour: 17, endHour: 18, interests: ['vehículos', 'autos', 'transporte', 'viajes'] },
  { id: 'study-lunch', activity: 'estudio', label: 'Estudio', startHour: 12, endHour: 13, interests: ['educación', 'lectura', 'tecnología'] },
  { id: 'household-lunch', activity: 'tiempo familiar', label: 'Tiempo familiar', startHour: 12, endHour: 13, householdTypes: ['familia', 'familia extensa', 'pareja'] },
];
