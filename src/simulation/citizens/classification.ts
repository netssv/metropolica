import type { Citizen } from './index.ts';
export function workplaceFor(citizen: Pick<Citizen, 'occupation'>): { zone: string; label: string; specialty?: 'hospital' | 'mall-government' } {
  const occupation = citizen.occupation.toLowerCase();
  if (/hospital|médic|medic|enferm|doctor|salud|clínic|clinic|farmac/.test(occupation)) return { zone: 'bldg-c', label: 'salud / hospital', specialty: 'hospital' };
  if (/gobierno|gubern|alcald|oficial|funcionario|estado|públic|public|ministerio|municipal/.test(occupation)) return { zone: 'bldg-c', label: 'gobierno', specialty: 'mall-government' };
  if (/carne|fabric|manufact|industrial|constru|minería|mining|energía|agricul|granja|ganad|pesca|campo|farm/.test(occupation)) return { zone: 'bldg-i', label: 'industria' };
  if (/mall|centro comercial|tienda|retail|ventas al por menor|minorista|viajes|turismo|restaurante|comercio/.test(occupation)) return { zone: 'bldg-c', label: 'comercio / mall' };
  return { zone: 'bldg-c', label: 'servicios' };
}
