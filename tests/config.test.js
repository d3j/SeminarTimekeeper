import { describe, expect, it, beforeAll } from 'vitest';
import { encodeConfig, decodeConfig, sanitizeParts } from '../src/scripts/config.js';

beforeAll(() => {
  if (typeof globalThis.btoa === 'undefined') {
    globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
  }
  if (typeof globalThis.atob === 'undefined') {
    globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
  }
});

describe('config serialization', () => {
  it('encodes and decodes a roundtrip payload', () => {
    const parts = sanitizeParts([
      { id: 'a', name: 'テスト', durationMinutes: 5 },
      { id: 'b', name: '確認', durationMinutes: 10 }
    ]);
    const encoded = encodeConfig(parts);
    const decoded = decodeConfig(encoded);
    expect(decoded).toHaveLength(2);
    expect(decoded[0].name).toBe('テスト');
    expect(decoded[1].durationMinutes).toBe(10);
  });

  it('gracefully returns null for broken payloads', () => {
    expect(decodeConfig('invalid__payload')).toBeNull();
  });
});
