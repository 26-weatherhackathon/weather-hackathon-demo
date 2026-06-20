import { describe, it, expect } from 'vitest';
import { scorePrediction } from './scoring';

// 스캐폴드 스모크 테스트. 실제 채점 케이스는 §6 구현 시 추가.
describe('scoring (scaffold)', () => {
  it('returns a scores shape', () => {
    const scores = scorePrediction(
      { precipProb: 50, precipType: '비', tMax: 26 },
      { precip: true, precipType: '비', precipAmount_mm: 381.5, tMax_C: 26, source: 'test' },
    );
    expect(scores).toHaveProperty('total');
    expect(scores).toHaveProperty('brier');
  });
});
