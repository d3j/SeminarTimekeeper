export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `part-${Math.random().toString(36).slice(2, 10)}`;
}

export function minutesToMs(minutes) {
  const value = Number(minutes);
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value * 60 * 1000;
}

export function msToMinutes(ms) {
  return Math.round(ms / 60000);
}

export function formatDuration(ms) {
  const sign = ms < 0 ? '-' : '';
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${sign}${minutes}:${seconds}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
