/**
 * House Cluster Detection
 *
 * Classifies each residential (bldg-r) tile into:
 *   'single'   → standalone house (1 tile)
 *   'duplex-h-a'/'duplex-h-b' → horizontal duplex anchor/partner
 *   'duplex-v-a'/'duplex-v-b' → vertical duplex anchor/partner
 *   'bldg-tl'  → top-left anchor of a 2×2 apartment (draws building)
 *   'bldg-tr'|'bldg-bl'|'bldg-br' → other 3 tiles (silent)
 *
 * Priority: 2×2 block > horizontal duplex > vertical duplex > single.
 */

export type HouseRole =
  | 'single'
  | 'duplex-h-a'
  | 'duplex-h-b'
  | 'duplex-v-a'
  | 'duplex-v-b'
  | 'bldg-tl'
  | 'bldg-tr'
  | 'bldg-bl'
  | 'bldg-br';

function isHouse(map: any[][], row: number, col: number): boolean {
  return map[row]?.[col]?.type === 'bldg-r';
}

/** Compute role map keyed as "col:row". */
export function computeHouseRoles(
  map: any[][],
  mapRows: number,
  mapCols: number
): Map<string, HouseRole> {
  const roles   = new Map<string, HouseRole>();
  const claimed = new Set<string>();
  const k = (c: number, r: number) => `${c}:${r}`;
  const claim = (c: number, r: number, role: HouseRole) => {
    roles.set(k(c, r), role);
    claimed.add(k(c, r));
  };

  // Pass 1 – 2×2 blocks (highest priority)
  for (let row = 0; row < mapRows - 1; row++) {
    for (let col = 0; col < mapCols - 1; col++) {
      if (
        !claimed.has(k(col, row)) &&
        !claimed.has(k(col + 1, row)) &&
        !claimed.has(k(col, row + 1)) &&
        !claimed.has(k(col + 1, row + 1)) &&
        isHouse(map, row, col) &&
        isHouse(map, row, col + 1) &&
        isHouse(map, row + 1, col) &&
        isHouse(map, row + 1, col + 1)
      ) {
        claim(col,     row,     'bldg-tl');
        claim(col + 1, row,     'bldg-tr');
        claim(col,     row + 1, 'bldg-bl');
        claim(col + 1, row + 1, 'bldg-br');
      }
    }
  }

  // Pass 2 – horizontal duplexes (same row)
  for (let row = 0; row < mapRows; row++) {
    for (let col = 0; col < mapCols - 1; col++) {
      if (
        !claimed.has(k(col, row)) &&
        !claimed.has(k(col + 1, row)) &&
        isHouse(map, row, col) &&
        isHouse(map, row, col + 1)
      ) {
        claim(col,     row, 'duplex-h-a');
        claim(col + 1, row, 'duplex-h-b');
      }
    }
  }

  // Pass 3 – vertical duplexes (same col)
  for (let col = 0; col < mapCols; col++) {
    for (let row = 0; row < mapRows - 1; row++) {
      if (
        !claimed.has(k(col, row)) &&
        !claimed.has(k(col, row + 1)) &&
        isHouse(map, row, col) &&
        isHouse(map, row + 1, col)
      ) {
        claim(col, row,     'duplex-v-a');
        claim(col, row + 1, 'duplex-v-b');
      }
    }
  }

  // Pass 4 – singles
  for (let row = 0; row < mapRows; row++) {
    for (let col = 0; col < mapCols; col++) {
      if (isHouse(map, row, col) && !claimed.has(k(col, row))) {
        claim(col, row, 'single');
      }
    }
  }

  return roles;
}
