import { describe, it, expect } from 'vitest';
import { PROMPT_MAX_LENGTH, getPromptLength, isWithinPromptLimit } from './promptLimit';

describe('PROMPT_MAX_LENGTH', () => {
  it('프롬프트 최대 길이는 500자다', () => {
    expect(PROMPT_MAX_LENGTH).toBe(500);
  });
});

describe('getPromptLength', () => {
  it('한글 한 글자를 1자로 센다', () => {
    expect(getPromptLength('가나다')).toBe(3);
  });

  it('이모지 한 개를 1자로 센다', () => {
    expect(getPromptLength('😀')).toBe(1);
  });

  it('빈 문자열은 0자다', () => {
    expect(getPromptLength('')).toBe(0);
  });
});

describe('isWithinPromptLimit', () => {
  it('499자 프롬프트는 제한 이내다', () => {
    expect(isWithinPromptLimit('a'.repeat(499))).toBe(true);
  });

  it('정확히 500자 프롬프트는 제한 이내다', () => {
    expect(isWithinPromptLimit('a'.repeat(500))).toBe(true);
  });

  it('501자 프롬프트는 제한을 넘는다', () => {
    expect(isWithinPromptLimit('a'.repeat(501))).toBe(false);
  });

  it('한글 501자도 제한을 넘는다', () => {
    expect(isWithinPromptLimit('가'.repeat(501))).toBe(false);
  });
});
