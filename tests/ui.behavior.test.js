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
});
