// src/lib/types.ts — 전 타입 정의 (Build Spec §5)
export type Difficulty = 'easy' | 'normal' | 'hard' | 'trap';
export type PrecipType = '없음' | '비' | '비/눈' | '눈' | '소나기';

export interface ForecastSeriesPoint {
  d: string;
  t: string;
  v: string;
}
export interface ModelForecast {
  baseDate: string;
  baseTime: string;
  label: string;
  pop: ForecastSeriesPoint[]; // 강수확률 %
  pty: ForecastSeriesPoint[]; // 강수형태 코드
  tmx: ForecastSeriesPoint[]; // 최고기온
  pcp: ForecastSeriesPoint[]; // 1시간 강수량
  sky: ForecastSeriesPoint[]; // 하늘상태
}

export interface AsosPoint {
  time: string; // 'YYYY-MM-DD HH:mm'
  ta: number; // 기온
  rn: number; // 강수량(mm)
  hm: number; // 습도(%)
  pa: number; // 현지기압(hPa)
  ws: number; // 풍속(m/s)
}

export interface GroundTruth {
  precip: boolean;
  precipType: PrecipType;
  precipAmount_mm: number;
  tMax_C: number;
  source: string; // 'ASOS 일자료 (서울 108 지점)'
}

export type LayerKey = 'satellite' | 'radar' | 'asos' | 'model';
export interface CaseMeta {
  caseId: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  region: { name: string; nx: number; ny: number };
  timeFrames: { idx: number; label: string; kst: string }[];
  layers: {
    satellite: string[]; // ir_0..5.png 경로
    radar: string[]; // hsr_0..5.png 경로
    asosPath: string; // asos.json
    modelAPath: string;
    modelBPath: string;
  };
  ai: {
    briefing: string;
    stageBg: string[];
    avatar: { thinking: string; confident: string; surprised: string };
    result: string;
    overlays: { sat: string; radar: string };
  };
  keyEvidence: LayerKey[]; // 정답 핵심 근거
  groundTruth: GroundTruth;
  expertNote: string;
  dataSource: Record<string, string>; // 레이어별 출처 문구(SourceTag)
}

// 학습자 입력 & 결과
export interface Prediction {
  precipProb: number; // 0~100
  precipType: PrecipType;
  tMax: number; // °C
}
export interface CaseResult {
  caseId: string;
  timestamp: number;
  prediction: Prediction;
  evidence: LayerKey[];
  chosenModel: 'A' | 'B' | null;
  scores: { precip: number; type: number; temp: number; total: number; brier: number };
  reflection: string;
  aiFeedback?: string;
}
