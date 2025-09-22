import { clamp } from './utils.js';

class Chrono {
  constructor() {
    this.elapsed = 0;
    this.running = false;
    this.anchor = null;
  }

  start(now = Date.now()) {
    if (this.running) {
      return;
    }
    this.running = true;
    this.anchor = now;
  }

  pause(now = Date.now()) {
    if (!this.running) {
      return;
    }
    this.elapsed += now - this.anchor;
    this.anchor = null;
    this.running = false;
  }

  reset() {
    this.elapsed = 0;
    this.running = false;
    this.anchor = null;
  }

  getElapsed(now = Date.now()) {
    if (this.running && this.anchor !== null) {
      return this.elapsed + (now - this.anchor);
    }
    return this.elapsed;
  }

  isRunning() {
    return this.running;
  }
}

export class TimerCoordinator {
  constructor(parts = []) {
    this.globalChrono = new Chrono();
    this.partChrono = new Chrono();
    this.setParts(parts);
  }

  setParts(parts) {
    this.parts = parts.map((part) => ({ ...part }));
    this.partStates = new Map();
    this.parts.forEach((part) => {
      this.partStates.set(part.id, {
        elapsedMs: 0,
        status: 'pending'
      });
    });
    this.currentPartId = null;
    this.globalChrono.reset();
    this.partChrono.reset();
  }

  getTotalDurationMs() {
    return this.parts.reduce((sum, part) => sum + part.durationMs, 0);
  }

  getCurrentPart() {
    return this.parts.find((part) => part.id === this.currentPartId) || null;
  }

  startPart(partId, now = Date.now()) {
    const targetPart = this.parts.find((part) => part.id === partId);
    if (!targetPart) {
      return;
    }

    if (this.currentPartId && this.currentPartId !== partId) {
      this.#finaliseCurrentPart(now);
    }

    if (!this.currentPartId || this.currentPartId !== partId) {
      this.currentPartId = partId;
      this.partChrono.reset();
      this.partChrono.start(now);
      const state = this.partStates.get(partId);
      state.elapsedMs = 0;
      state.status = 'active';
    } else if (!this.partChrono.isRunning()) {
      this.partChrono.start(now);
    }

    if (!this.globalChrono.isRunning()) {
      this.globalChrono.start(now);
    }
  }

  stop(now = Date.now()) {
    this.globalChrono.pause(now);
    if (this.currentPartId) {
      this.partChrono.pause(now);
      const state = this.partStates.get(this.currentPartId);
      state.elapsedMs = this.partChrono.getElapsed(now);
      state.status = 'paused';
    }
  }

  resume(now = Date.now()) {
    if (!this.currentPartId) {
      return;
    }
    this.globalChrono.start(now);
    this.partChrono.start(now);
    const state = this.partStates.get(this.currentPartId);
    state.status = 'active';
  }

  reset() {
    this.currentPartId = null;
    this.globalChrono.reset();
    this.partChrono.reset();
    this.partStates.forEach((state) => {
      state.elapsedMs = 0;
      state.status = 'pending';
    });
  }

  isRunning() {
    return this.globalChrono.isRunning();
  }

  getTotals(now = Date.now()) {
    const totalDurationMs = this.getTotalDurationMs();
    const elapsedMs = this.globalChrono.getElapsed(now);
    const remainingMs = totalDurationMs ? totalDurationMs - elapsedMs : 0;
    const clampedRatio = totalDurationMs
      ? clamp(elapsedMs / totalDurationMs, 0, Infinity)
      : 0;
    return {
      durationMs: totalDurationMs,
      elapsedMs,
      remainingMs,
      progress: clampedRatio
    };
  }

  getPartSnapshots(now = Date.now()) {
    return this.parts.map((part) => {
      const state = this.partStates.get(part.id);
      let elapsedMs = state.elapsedMs;
      let status = state.status;

      if (this.currentPartId === part.id) {
        elapsedMs = this.partChrono.getElapsed(now);
        status = this.globalChrono.isRunning() ? 'active' : 'paused';
      }

      return {
        id: part.id,
        name: part.name,
        durationMs: part.durationMs,
        elapsedMs,
        remainingMs: part.durationMs - elapsedMs,
        status
      };
    });
  }

  #finaliseCurrentPart(now = Date.now()) {
    if (!this.currentPartId) {
      return;
    }
    const state = this.partStates.get(this.currentPartId);
    state.elapsedMs = this.partChrono.getElapsed(now);
    state.status = 'completed';
    this.partChrono.reset();
  }
}
