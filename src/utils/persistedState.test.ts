import { describe, it, expect } from 'vitest';
import {
  PROMPT_HISTORY_MAX,
  addPromptToHistory,
  reviveApiKeys,
  reviveComponents,
  reviveProvider,
} from './persistedState';

describe('reviveProvider', () => {
  it('저장된 anthropic을 그대로 반환한다', () => {
    expect(reviveProvider('anthropic')).toBe('anthropic');
  });

  it('저장된 google을 그대로 반환한다', () => {
    expect(reviveProvider('google')).toBe('google');
  });

  it('알 수 없는 값이면 기본값 google을 반환한다', () => {
    expect(reviveProvider('openai')).toBe('google');
  });

  it('값이 없으면 기본값 google을 반환한다', () => {
    expect(reviveProvider(undefined)).toBe('google');
  });
});

describe('reviveApiKeys', () => {
  it('provider별 문자열 키만 남긴다', () => {
    expect(reviveApiKeys({ anthropic: 'sk-1', google: 123, other: 'x' })).toEqual({
      anthropic: 'sk-1',
    });
  });

  it('객체가 아니면 빈 객체를 반환한다', () => {
    expect(reviveApiKeys('oops')).toEqual({});
  });

  it('null이면 빈 객체를 반환한다', () => {
    expect(reviveApiKeys(null)).toEqual({});
  });
});

describe('addPromptToHistory', () => {
  it('새 프롬프트를 목록 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['b'], 'a')).toEqual(['a', 'b']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addPromptToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it('앞뒤 공백을 제거하고, 빈 프롬프트는 무시한다', () => {
    expect(addPromptToHistory(['a'], '   ')).toEqual(['a']);
    expect(addPromptToHistory([], '  x  ')).toEqual(['x']);
  });

  it(`최대 ${PROMPT_HISTORY_MAX}개까지만 유지하고 가장 오래된 것을 버린다`, () => {
    const full = Array.from({ length: PROMPT_HISTORY_MAX }, (_, i) => `p${i}`);
    const next = addPromptToHistory(full, 'new');

    expect(next).toHaveLength(PROMPT_HISTORY_MAX);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${PROMPT_HISTORY_MAX - 1}`);
  });
});

describe('reviveComponents', () => {
  it('저장된 createdAt 문자열을 Date 객체로 되돌린다', () => {
    const raw = [
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
    ];

    const [component] = reviveComponents(raw);

    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('필드가 빠진 항목은 버린다', () => {
    const raw = [
      { id: '1' },
      { id: '2', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    expect(reviveComponents(raw)).toHaveLength(1);
  });

  it('createdAt이 잘못된 날짜인 항목은 버린다', () => {
    const raw = [{ id: '1', prompt: 'p', code: 'c', createdAt: 'not-a-date' }];

    expect(reviveComponents(raw)).toEqual([]);
  });

  it('배열이 아니면 빈 목록을 반환한다', () => {
    expect(reviveComponents({})).toEqual([]);
  });
});
