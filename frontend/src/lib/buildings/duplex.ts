/**
 * Duplex entry point — delegates to the appropriate orientation renderer.
 * - `duplex-h-a` / horizontal → duplexHorizontal.ts
 * - `duplex-v-a` / vertical   → duplexVertical.ts
 */
import type { DrawArgs } from './types.ts';
import { drawHorizontalDuplex } from './duplexHorizontal.ts';
import { drawVerticalDuplex } from './duplexVertical.ts';

export { drawHorizontalDuplex } from './duplexHorizontal.ts';
export { drawVerticalDuplex }   from './duplexVertical.ts';

/** @deprecated Use drawHorizontalDuplex / drawVerticalDuplex directly */
export function drawDuplex(
  args: DrawArgs,
  direction: 'horizontal' | 'vertical' = 'horizontal'
) {
  if (direction === 'horizontal') return drawHorizontalDuplex(args);
  return drawVerticalDuplex(args);
}
