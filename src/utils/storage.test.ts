import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readJson, writeJson } from './storage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('writeJson / readJson', () => {
  it('저장한 값을 같은 키로 다시 읽는다', () => {
    writeJson('k', { a: 1 });
    expect(readJson('k', null)).toEqual({ a: 1 });
  });

  it('키가 없으면 기본값을 반환한다', () => {
    expect(readJson('missing', 'fallback')).toBe('fallback');
  });

  it('저장된 JSON이 깨졌으면 기본값을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readJson('k', 'fallback')).toBe('fallback');
  });

  it('읽기가 막혀 있으면 예외 없이 기본값을 반환한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readJson('k', 'fallback')).toBe('fallback');
  });

  it('쓰기가 실패해도(용량 초과 등) 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => writeJson('k', { a: 1 })).not.toThrow();
  });
});
