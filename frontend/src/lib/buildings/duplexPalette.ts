/**
 * Color palette definitions for Level 2 Duplex buildings.
 * Includes multiple architectural color schemes for rich city variety.
 */

export interface DuplexPalette {
  wallLight:  string;
  wallShade:  string;
  wallBack:   string;
  baseDark:   string;
  roofLight:  string;
  roofShade:  string;
  trimLight:  string;
  trimShade:  string;
  stepsLight: string;
  stepsShade: string;
  canopyDark: string;
  doorColor:  string;
  chimney:    string;
}

export const DUPLEX_PALETTES: DuplexPalette[] = [
  // 0. Sage Green (Classic Original)
  {
    wallLight:  '#708e76',
    wallShade:  '#58745e',
    wallBack:   '#445d4a',
    baseDark:   '#616366',
    roofLight:  '#5c5954',
    roofShade:  '#45433f',
    trimLight:  '#ebe7dc',
    trimShade:  '#d5cfc2',
    stepsLight: '#ded9cf',
    stepsShade: '#b5b0a6',
    canopyDark: '#4a4844',
    doorColor:  '#ebdcc6',
    chimney:    '#616366',
  },
  // 1. Colonial Slate Blue
  {
    wallLight:  '#5c768d',
    wallShade:  '#475e73',
    wallBack:   '#354859',
    baseDark:   '#4f5863',
    roofLight:  '#4a4e54',
    roofShade:  '#363a3f',
    trimLight:  '#f0ebd9',
    trimShade:  '#d6d0bf',
    stepsLight: '#ded9cf',
    stepsShade: '#b5b0a6',
    canopyDark: '#3d4248',
    doorColor:  '#e3caa1',
    chimney:    '#565c63',
  },
  // 2. Warm Terracotta Ochre
  {
    wallLight:  '#bd785c',
    wallShade:  '#a36146',
    wallBack:   '#844b34',
    baseDark:   '#5c504a',
    roofLight:  '#544843',
    roofShade:  '#3d332f',
    trimLight:  '#f5eee1',
    trimShade:  '#ded4c3',
    stepsLight: '#ded9cf',
    stepsShade: '#b5b0a6',
    canopyDark: '#453c38',
    doorColor:  '#ebd7b5',
    chimney:    '#5c504a',
  },
  // 3. Sandstone Beige
  {
    wallLight:  '#b5a48b',
    wallShade:  '#9c8b73',
    wallBack:   '#7f705b',
    baseDark:   '#59554e',
    roofLight:  '#4e5256',
    roofShade:  '#3a3d41',
    trimLight:  '#fcf8f0',
    trimShade:  '#e3ded3',
    stepsLight: '#ded9cf',
    stepsShade: '#b5b0a6',
    canopyDark: '#42454a',
    doorColor:  '#d6be96',
    chimney:    '#59554e',
  },
];

export const DUPLEX_PALETTE: DuplexPalette = DUPLEX_PALETTES[0];

export function getDuplexPalette(seed = 0): DuplexPalette {
  const index = Math.abs(seed >>> 0) % DUPLEX_PALETTES.length;
  return DUPLEX_PALETTES[index];
}
