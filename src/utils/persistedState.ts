import type { GeneratedComponent, Provider } from '../types';

export const PROMPT_HISTORY_MAX = 20;

const PROVIDERS: Provider[] = ['anthropic', 'google'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 저장된 provider 값을 검증한다. 알 수 없는 값이면 기본값 google을 쓴다. */
export function reviveProvider(raw: unknown): Provider {
  return PROVIDERS.includes(raw as Provider) ? (raw as Provider) : 'google';
}

/** provider별 API 키 맵에서 문자열 값만 남긴다. */
export function reviveApiKeys(raw: unknown): Partial<Record<Provider, string>> {
  if (!isRecord(raw)) return {};

  const keys: Partial<Record<Provider, string>> = {};
  for (const provider of PROVIDERS) {
    const value = raw[provider];
    if (typeof value === 'string') keys[provider] = value;
  }
  return keys;
}

/** 프롬프트를 히스토리 맨 앞에 넣는다. 중복은 하나로 합치고, 최대 개수를 넘으면 오래된 것부터 버린다. */
export function addPromptToHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;

  return [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, PROMPT_HISTORY_MAX);
}

/** 저장된 컴포넌트 목록을 검증하고, createdAt 문자열을 Date로 되돌린다. */
export function reviveComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];

  const components: GeneratedComponent[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const { id, prompt, code, createdAt } = item;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') continue;
    if (typeof createdAt !== 'string') continue;

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) continue;

    components.push({ id, prompt, code, createdAt: date });
  }
  return components;
}
