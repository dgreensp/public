export class Stopwatch {
  constructor() {
    this.running = false;
    this.startedAt = null;
    this.totalTime = 0.0;
    // stats:
    this.maxElapsed = 0.0;
    this.numRuns = 0;
  }

  start() {
    if (this.running) {
      throw new Error("Stopwatch already running");
    }
    this.running = true;
    this.startedAt = process.hrtime();
  }

  stop() {
    if (!this.running) {
      throw new Error("Stopwatch not started");
    }
    this.running = false;
    const [secs, nanos] = process.hrtime(this.startedAt);
    const elapsed = secs + (nanos * 1e-9);
    this.totalTime += elapsed;
    this.maxElapsed = Math.max(this.maxElapsed, elapsed);
    this.numRuns++;
  }

  getTime() {
    return this.totalTime;
  }
}
