// session.ts — localStorage 상태 (Build Spec §7). 스캐폴드 스텁; §7에서 전체 구현.
import type { CaseResult } from './types';

const KEY = 'forecaster:results';

export function loadResults(): CaseResult[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CaseResult[];
  } catch {
    return [];
  }
}

export function saveResult(_result: CaseResult): void {
  // TODO(§7): 케이스별 결과 누적 저장.
}
