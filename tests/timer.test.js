import { describe, expect, it } from 'vitest';
import { TimerCoordinator } from '../src/scripts/timer.js';

describe('TimerCoordinator', () => {
  const parts = [
    { id: 'intro', name: 'Intro', durationMs: 5 * 60 * 1000 },
    { id: 'qa', name: 'Q&A', durationMs: 3 * 60 * 1000 }
  ];

  it('tracks elapsed time for the current part', () => {
    const timer = new TimerCoordinator(parts);
    timer.startPart('intro', 0);
    const snapshotsMid = timer.getPartSnapshots(30 * 1000);
    const intro = snapshotsMid.find((s) => s.id === 'intro');
    expect(intro.elapsedMs).toBe(30 * 1000);
    expect(intro.remainingMs).toBe(5 * 60 * 1000 - 30 * 1000);

    timer.stop(45 * 1000);
    const pausedSnapshot = timer.getPartSnapshots(45 * 1000).find((s) => s.id === 'intro');
    expect(pausedSnapshot.status).toBe('paused');
    expect(pausedSnapshot.elapsedMs).toBe(45 * 1000);

    timer.resume(60 * 1000);
    const resumedSnapshot = timer.getPartSnapshots(90 * 1000).find((s) => s.id === 'intro');
    expect(resumedSnapshot.status).toBe('active');
    expect(resumedSnapshot.elapsedMs).toBe(75 * 1000);
  });

  it('finalises previous part when a new one starts', () => {
    const timer = new TimerCoordinator(parts);
    timer.startPart('intro', 0);
    timer.startPart('qa', 2 * 60 * 1000);

    const introSnapshot = timer.getPartSnapshots(2 * 60 * 1000).find((s) => s.id === 'intro');
    expect(introSnapshot.status).toBe('completed');
    expect(introSnapshot.elapsedMs).toBe(2 * 60 * 1000);
  });

  it('computes total progress', () => {
    const timer = new TimerCoordinator(parts);
    timer.startPart('intro', 0);
    const totals = timer.getTotals(2 * 60 * 1000);
    expect(Math.round(totals.progress * 100)).toBe(25);
  });
});
