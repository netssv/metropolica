import { SelectedObjectInfo } from '../../lib/devModeManager';
import { DuplexHorizTuneParams } from '../../lib/buildings/duplexHorizTuneState';
import { DuplexVertTuneParams } from '../../lib/buildings/duplexVertTuneState';
import { genericTune } from '../../lib/buildings/genericTuneState';

export function getGenericTuneKey(selectedObject: SelectedObjectInfo): string {
  const state = selectedObject.state;
  const role = state.houseRole as string | undefined;
  const specialty = state.specialty as string | undefined;

  if (role?.startsWith('bldg-')) return 'apartment';
  if (selectedObject.type === 'Edificio Residencial') return 'house';
  if (specialty === 'hospital') return 'hospital';
  if (specialty === 'bank') return 'bank';
  if (specialty === 'mall-government') return 'shop';
  if (selectedObject.type === 'Edificio Comercial') return 'shop';
  if (selectedObject.type === 'Edificio Industrial (Fábrica)') return 'factory';
  if (state.type === 'park') return 'park';
  if (state.type === 'road') return 'road';
  if (state.type === 'bridge') return 'bridge';
  if (state.type === 'tree') return 'tree';
  if (state.type === 'water') return 'water';
  return 'default';
}

export function formatHorizTuneCode(p: DuplexHorizTuneParams): string {
  return `// Parámetros Tuned para Dúplex Horizontal:
const height     = ${p.height} * zoom;
const peak       = ${p.peak} * zoom;
const baseH      = ${p.baseH} * zoom;
const depthX     = TW * ${p.depthMultX};
const depthY     = TH * ${p.depthMultY};
const facadeMult  = ${p.facadeMult};
const rotAngle   = ${p.rotAngle};
const offsetX    = ${p.offsetX};
const offsetY    = ${p.offsetY};
const doorScale  = ${p.doorScale};
const winScale   = ${p.winScale};
// ── Volumen y niveles:
const backAlpha   = ${p.backAlpha};
const rightAlpha  = ${p.rightAlpha};
const canopyYMult = ${p.canopyYMult};
const winYMult    = ${p.winYMult};
const sideWinYMult = ${p.sideWinYMult};
const rearWinYMult = ${p.rearWinYMult};
const rearLowerWinYMult = ${p.rearLowerWinYMult};
const rotation    = ${p.rotation}; // 0=SW 1=SE 2=NE 3=NW`;
}

export function formatVertTuneCode(p: DuplexVertTuneParams): string {
  return `// Parámetros Tuned para Dúplex Vertical:
const height       = ${p.height};
const peak         = ${p.peak};
const baseH        = ${p.baseH};
const chimneyPosT  = ${p.chimneyPosT};
const chimneyDepth = ${p.chimneyDepth};
const chimneyH     = ${p.chimneyH};
const rotation     = ${p.rotation};`;
}

export function formatGenericTuneCode(activeKey: string): string {
  const p = genericTune.getParams(activeKey);
  return `// Parámetros Tuned RAW para '${activeKey}' (Copiado para IDE Agent):
${JSON.stringify({ [activeKey]: p }, null, 2)}`;
}
