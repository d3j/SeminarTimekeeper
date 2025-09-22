import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf-8');

function setupDom() {
  document.documentElement.innerHTML = html;
}

describe('UI immediate reactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    setupDom();
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.documentElement.innerHTML = '';
  });

  it('updates runtime view and share link when part fields lose focus', async () => {
    await import('../src/scripts/main.js');

    const durationInput = document.querySelector('#setupPanel input[type="number"]');
    const shareLink = document.querySelector('#shareLink');
    const runLabel = () =>
      document.querySelector('#runPartsList .tk-run-part .tk-label')?.textContent ?? '';

    expect(runLabel()).toContain('5');
    const previousLink = shareLink.value;

    durationInput.value = '15';
    durationInput.dispatchEvent(new Event('input', { bubbles: true }));
    durationInput.dispatchEvent(new Event('blur', { bubbles: true }));

    await vi.runOnlyPendingTimersAsync();

    expect(runLabel()).toContain('15');
    expect(shareLink.value).not.toBe(previousLink);
  });

  it('shows aggregated planned minutes and keeps global timer sticky', async () => {
    await import('../src/scripts/main.js');

    const totalMinutesLabel = document.querySelector('#totalPlannedMinutes');
    expect(totalMinutesLabel).not.toBeNull();
    expect(totalMinutesLabel.textContent).toContain('40');

    const durationInputs = document.querySelectorAll('#setupPanel input[type="number"]');
    durationInputs[0].value = '12';
    durationInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    durationInputs[0].dispatchEvent(new Event('blur', { bubbles: true }));

    await vi.runOnlyPendingTimersAsync();

    expect(totalMinutesLabel.textContent).toContain('47');

    const summary = document.querySelector('.tk-run__summary');
    expect(summary.classList.contains('tk-run__summary--sticky')).toBe(true);
  });

  it('formats global drift with minutes and seconds', async () => {
    await import('../src/scripts/main.js');

    const drift = document.querySelector('#globalDrift');
    const { _updateGlobalDrift } = window.Timekeeper;

    _updateGlobalDrift(45_000);
    expect(drift.textContent.trim()).toBe('+00:45');

    _updateGlobalDrift(-135_000);
    expect(drift.textContent.trim()).toBe('-02:15');

    _updateGlobalDrift(0);
    expect(drift.textContent.trim()).toBe('±00:00');
  });

  it('credits full planned time when switching parts mid-way', async () => {
    await import('../src/scripts/main.js');

    vi.setSystemTime(0);

    const durationInputs = document.querySelectorAll('#setupPanel input[type="number"]');
    durationInputs[0].value = '4';
    durationInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    durationInputs[0].dispatchEvent(new Event('blur', { bubbles: true }));
    await vi.runOnlyPendingTimersAsync();

    durationInputs[1].value = '5';
    durationInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    durationInputs[1].dispatchEvent(new Event('blur', { bubbles: true }));
    await vi.runOnlyPendingTimersAsync();

    document.querySelector('#runTab').click();
    await vi.runOnlyPendingTimersAsync();

    const startButtons = document.querySelectorAll('#runPartsList .tk-run-part__actions button');
    expect(startButtons.length).toBeGreaterThanOrEqual(2);

    vi.setSystemTime(0);
    startButtons[0].click();
    vi.setSystemTime(195_000);
    window.Timekeeper._updateRunUi();

    startButtons[1].click();
    const timer = window.Timekeeper._timer;
    const now = 195_000;
    const snapshots = timer.getPartSnapshots(now);
    const planned = window.Timekeeper._computePlannedElapsedMs(
      snapshots,
      timer.getCurrentPart()?.id
    );
    const totals = timer.getTotals(now);
    // debug info for drift calc
    expect(planned - totals.elapsedMs).toBe(45_000);

    window.Timekeeper._updateGlobalDrift(planned - totals.elapsedMs);
    expect(document.querySelector('#globalDrift').textContent.trim()).toBe('+00:45');
  });
});
