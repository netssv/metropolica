export type ActivityInfo = { category: string; icon: string; color: string; label: string };

const ACTIVITIES: Record<string, ActivityInfo> = {
  sueño: { category: 'sleep', icon: '●', color: '#94a3b8', label: 'Sueño' },
  preparación: { category: 'preparation', icon: '◌', color: '#67e8f9', label: 'Preparación' },
  'traslado al trabajo': { category: 'transit', icon: '→', color: '#facc15', label: 'Traslado al trabajo' },
  'regreso a casa': { category: 'transit', icon: '←', color: '#fb923c', label: 'Regreso a casa' },
  trabajo: { category: 'work', icon: '■', color: '#60a5fa', label: 'Trabajo' },
  'ocio en casa': { category: 'leisure', icon: '◆', color: '#4ade80', label: 'Ocio' },
  compras: { category: 'leisure', icon: '◆', color: '#c084fc', label: 'Compras' },
  'almuerzo social': { category: 'leisure', icon: '◆', color: '#c084fc', label: 'Almuerzo social' },
  estudio: { category: 'leisure', icon: '◆', color: '#c084fc', label: 'Estudio' },
};

export function activityInfo(activity?: { activity?: string; label?: string }): ActivityInfo {
  const key = activity?.activity?.toLowerCase() ?? '';
  return ACTIVITIES[key] ?? { category: 'other', icon: '•', color: '#cbd5e1', label: activity?.label ?? 'Actividad' };
}
