export const PROMPT_MAX_LENGTH = 500;

/** 프롬프트 글자 수를 센다. 이모지처럼 코드 포인트가 여러 단위인 문자도 한 글자로 센다. */
export function getPromptLength(text: string): number {
  return Array.from(text).length;
}

/** 프롬프트가 글자 수 제한 이내인지 확인한다. */
export function isWithinPromptLimit(text: string): boolean {
  return getPromptLength(text) <= PROMPT_MAX_LENGTH;
}
