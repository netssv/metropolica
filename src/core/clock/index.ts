export type SimulationSpeed = 1 | 5 | 20 | 100;
export type TickGranularity = "daily" | "weekly" | "monthly";

export interface SimulationTick {
  day: number;
  year: number;
  dayOfYear: number;
  granularity: TickGranularity;
}

export interface ClockOptions {
  /** Real milliseconds represented by one simulated day at speed x1. */
  millisecondsPerSimulatedDay?: number;
}

const MONTH_ENDS = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

/** Headless, deterministic clock. Rendering engines should drive advance(), never own time. */
export class SimulationClock {
  readonly millisecondsPerSimulatedDay: number;
  private elapsedMilliseconds = 0;
  private running = true;
  private speed: SimulationSpeed = 1;
  private day = 0;
  private readonly listeners: Record<TickGranularity, Set<(tick: SimulationTick) => void>> = {
    daily: new Set(), weekly: new Set(), monthly: new Set()
  };

  constructor(options: ClockOptions = {}) {
    this.millisecondsPerSimulatedDay = options.millisecondsPerSimulatedDay ?? 1000;
    if (this.millisecondsPerSimulatedDay <= 0) throw new Error("millisecondsPerSimulatedDay must be positive");
  }

  get currentDay(): number { return this.day; }
  get currentHour(): number { return Math.floor((this.elapsedMilliseconds / this.millisecondsPerSimulatedDay) * 24) % 24; }
  get currentMinute(): number { return Math.floor((this.elapsedMilliseconds / this.millisecondsPerSimulatedDay) * 1440) % 60; }
  get isPaused(): boolean { return !this.running; }
  get currentSpeed(): SimulationSpeed { return this.speed; }
  setSpeed(speed: SimulationSpeed): void { this.speed = speed; }
  pause(): void { this.running = false; }
  resume(): void { this.running = true; }

  onDailyTick(listener: (tick: SimulationTick) => void): () => void { return this.subscribe("daily", listener); }
  onWeeklyTick(listener: (tick: SimulationTick) => void): () => void { return this.subscribe("weekly", listener); }
  onMonthlyTick(listener: (tick: SimulationTick) => void): () => void { return this.subscribe("monthly", listener); }

  /** Advances only whole simulated days; fractional time remains buffered deterministically. */
  advance(realMilliseconds: number): void {
    if (realMilliseconds < 0 || !Number.isFinite(realMilliseconds)) throw new Error("realMilliseconds must be finite and non-negative");
    if (!this.running) return;
    this.elapsedMilliseconds += realMilliseconds * this.speed;
    while (this.elapsedMilliseconds >= this.millisecondsPerSimulatedDay) {
      this.elapsedMilliseconds -= this.millisecondsPerSimulatedDay;
      this.emitNextDay();
    }
  }

  private subscribe(granularity: TickGranularity, listener: (tick: SimulationTick) => void): () => void {
    this.listeners[granularity].add(listener);
    return () => this.listeners[granularity].delete(listener);
  }

  private emitNextDay(): void {
    this.day += 1;
    const dayOfYear = ((this.day - 1) % 365) + 1;
    const tick: SimulationTick = { day: this.day, year: Math.floor((this.day - 1) / 365) + 1, dayOfYear, granularity: "daily" };
    this.emit("daily", tick);
    if (this.day % 7 === 0) this.emit("weekly", { ...tick, granularity: "weekly" });
    if (MONTH_ENDS.includes(dayOfYear)) this.emit("monthly", { ...tick, granularity: "monthly" });
  }

  private emit(granularity: TickGranularity, tick: SimulationTick): void {
    for (const listener of this.listeners[granularity]) listener(tick);
  }
}
