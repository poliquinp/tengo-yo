/**
 * Chrono basé sur requestAnimationFrame, avec pause (app en arrière-plan)
 * et rattrapage exact du temps écoulé.
 */
export class Timer {
  constructor({ seconds, onFrame, onSecond, onEnd }) {
    this.duration = seconds * 1000;
    this.onFrame = onFrame;   // (remainingMs, progress 0→1)
    this.onSecond = onSecond; // (secondsLeft) à chaque changement de seconde entière
    this.onEnd = onEnd;
    this.raf = 0;
    this.running = false;
    this.elapsedBeforePause = 0;
    this.startedAt = 0;
    this.lastSecond = null;
  }

  start() {
    this.stop();
    this.elapsedBeforePause = 0;
    this.lastSecond = null;
    this.resume();
  }

  resume() {
    if (this.running || this.elapsedBeforePause >= this.duration) return;
    this.running = true;
    this.startedAt = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause() {
    if (!this.running) return;
    this.elapsedBeforePause += performance.now() - this.startedAt;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  tick = (now) => {
    if (!this.running) return;
    const elapsed = Math.min(this.duration, this.elapsedBeforePause + (now - this.startedAt));
    const remaining = this.duration - elapsed;
    this.onFrame?.(remaining, elapsed / this.duration);

    const sec = Math.ceil(remaining / 1000);
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      this.onSecond?.(sec);
    }

    if (remaining <= 0) {
      this.running = false;
      this.elapsedBeforePause = this.duration;
      this.onEnd?.();
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
