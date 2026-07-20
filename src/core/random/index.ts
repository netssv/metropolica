export class SeededRandom {
  private state: number;
  constructor(seed = 1) { this.state = seed >>> 0; }
  next(): number { this.state = (1664525 * this.state + 1013904223) >>> 0; return this.state / 4294967296; }
  centered(amount: number): number { return (this.next() * 2 - 1) * amount; }
}
