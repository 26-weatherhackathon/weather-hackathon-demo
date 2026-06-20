// scoring.ts — Brier 채점 엔진 (Build Spec §6). 스캐폴드 스텁; §6에서 전체 구현.
import type { Prediction, GroundTruth, CaseResult } from './types';

export function scorePrediction(
  _prediction: Prediction,
  _truth: GroundTruth,
): CaseResult['scores'] {
  // TODO(§6): Brier(강수확률) + 형태 + 기온 합산.
  return { precip: 0, type: 0, temp: 0, total: 0, brier: 1 };
}
