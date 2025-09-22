import { generateId, minutesToMs, msToMinutes } from './utils.js';

const DEFAULT_TEMPLATE = [
  { name: 'オープニング', minutes: 5 },
  { name: 'セッション', minutes: 20 },
  { name: '質疑応答', minutes: 10 },
  { name: 'クロージング', minutes: 5 }
];

export function createDefaultParts() {
  return DEFAULT_TEMPLATE.map((item) => ({
    id: generateId(),
    name: item.name,
    durationMinutes: item.minutes
  }));
}

export function sanitizeParts(parts) {
  return parts
    .filter((part) => part && typeof part.name === 'string')
    .map((part) => ({
      id: part.id || generateId(),
      name: part.name.trim() || '未設定パート',
      durationMinutes: sanitizeDuration(part.durationMinutes)
    }))
    .filter((part) => part.durationMinutes > 0);
}

function sanitizeDuration(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 1;
  }
  return Math.round(numeric);
}

export function encodeConfig(parts) {
  const compact = sanitizeParts(parts).map((part) => ({
    n: part.name,
    d: part.durationMinutes
  }));
  const json = JSON.stringify({ parts: compact });
  return btoa(encodeURIComponent(json));
}

export function decodeConfig(encoded) {
  try {
    const json = decodeURIComponent(atob(encoded));
    const payload = JSON.parse(json);
    if (!Array.isArray(payload.parts)) {
      return null;
    }
    return sanitizeParts(
      payload.parts.map((part) => ({
        name: part.n,
        durationMinutes: part.d
      }))
    );
  } catch (error) {
    console.warn('設定のデコードに失敗しました', error);
    return null;
  }
}

export function readConfigFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const encoded = params.get('config');
  if (!encoded) {
    return null;
  }
  return decodeConfig(encoded);
}

export function writeConfigToUrl(parts) {
  const encoded = encodeConfig(parts);
  const url = new URL(window.location.href);
  url.searchParams.set('config', encoded);
  window.history.replaceState({}, '', url);
  return url.toString();
}

export function partsToTimers(parts) {
  return sanitizeParts(parts).map((part) => ({
    id: part.id,
    name: part.name,
    durationMs: minutesToMs(part.durationMinutes)
  }));
}

export function timersToParts(timers) {
  return timers.map((timer) => ({
    id: timer.id,
    name: timer.name,
    durationMinutes: Math.max(1, msToMinutes(timer.durationMs))
  }));
}
