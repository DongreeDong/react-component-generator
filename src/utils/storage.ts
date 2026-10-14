export const STORAGE_KEYS = {
  apiKeys: 'rcg.apiKeys',
  provider: 'rcg.provider',
  promptHistory: 'rcg.promptHistory',
  components: 'rcg.components',
} as const;

/** localStorage에서 JSON을 읽는다. 키가 없거나, 깨졌거나, 접근이 막혀 있으면 fallback을 반환한다. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 값을 JSON으로 저장한다. 용량 초과나 접근 차단이 나도 예외를 던지지 않는다. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장에 실패해도 화면 동작은 유지한다. 새로고침 후에는 값이 사라질 뿐이다.
  }
}
