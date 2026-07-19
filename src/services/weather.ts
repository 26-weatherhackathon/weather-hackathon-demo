// 기상청(KMA) 날씨 조회 서비스
//
// 보안 주의(CLAUDE.md 4항):
//  - API 키는 서버 전용 환경변수(KMA_API_KEY)로만 사용한다.
//  - NEXT_PUBLIC_ 접두사를 붙이면 브라우저 번들에 노출되므로 사용하지 않는다.
//  - 따라서 이 모듈은 서버(Route Handler / Server Component / Server Action)에서
//    호출하는 것을 전제로 한다.

export type FloodRiskLevel = "SAFE" | "CAUTION" | "WARNING" | "DANGER";

export interface WeatherData {
  /** 기온(섭씨) */
  temperature: number;
  /** 습도(%) */
  humidity: number;
  /** 시간당 강수량(mm) */
  rainfall: number;
  /** 풍속(m/s) */
  windSpeed: number;
  /** 강수 확률(%) */
  precipitationProbability: number;
  /** 관측/조회 시각(ISO 8601) */
  timestamp: string;
  /** 데이터 출처 */
  source: "KMA" | "MOCK";
}

/**
 * 시연용 과거 호우 Mock 데이터.
 * 네트워크 지연/실패 시 즉시 반환하여 데모가 끊기지 않도록 한다.
 */
export const MOCK_HEAVY_RAIN_DATA: WeatherData = {
  temperature: 18.4,
  humidity: 96,
  rainfall: 48.5,
  windSpeed: 11.7,
  precipitationProbability: 95,
  timestamp: "2022-08-08T18:00:00+09:00",
  source: "MOCK",
};

const DEFAULT_TIMEOUT_MS = 3000;

/** 기상청 API 원시 응답의 최소 형태(연동 시 실제 스키마에 맞춰 확장). */
interface KmaRawResponse {
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  windSpeed?: number;
  precipitationProbability?: number;
}

/**
 * 기상청 API에서 현재 날씨를 조회한다.
 * 3초 이내 응답이 없거나 오류가 발생하면 즉시 Mock 데이터를 반환한다.
 *
 * @param latitude  위도(기본값: 서울시청)
 * @param longitude 경도(기본값: 서울시청)
 * @param timeoutMs 타임아웃(ms)
 */
export async function fetchWeatherFromKMA(
  latitude = 37.5665,
  longitude = 126.978,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<WeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiKey = process.env.KMA_API_KEY;
    if (!apiKey) {
      // 키가 없으면 외부 호출 없이 곧바로 폴백(로컬 개발 편의).
      throw new Error("KMA_API_KEY 미설정 — Mock 데이터로 폴백합니다.");
    }

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      serviceKey: apiKey,
    });
    const url = `https://apis.data.go.kr/1360000/weather/current?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`KMA API 오류: ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as KmaRawResponse;

    return {
      temperature: raw.temperature ?? 20,
      humidity: raw.humidity ?? 70,
      rainfall: raw.rainfall ?? 0,
      windSpeed: raw.windSpeed ?? 5,
      precipitationProbability: raw.precipitationProbability ?? 30,
      timestamp: new Date().toISOString(),
      source: "KMA",
    };
  } catch (error) {
    // 타임아웃(AbortError) 또는 네트워크/파싱 오류 → 시연용 Mock 데이터 반환
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[weather] 기상청 API 조회 실패 — Mock 데이터로 폴백합니다.",
        error instanceof Error ? error.message : error
      );
    }
    return { ...MOCK_HEAVY_RAIN_DATA, timestamp: new Date().toISOString() };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 강수 확률을 홍수 위험 등급으로 변환한다. */
export function getFloodRiskLevel(
  precipitationProbability: number
): FloodRiskLevel {
  if (precipitationProbability < 30) return "SAFE";
  if (precipitationProbability < 60) return "CAUTION";
  if (precipitationProbability < 80) return "WARNING";
  return "DANGER";
}

/** 날씨 데이터를 사람이 읽을 수 있는 한 줄 설명으로 변환한다. */
export function formatWeatherDescription(data: WeatherData): string {
  const level = getFloodRiskLevel(data.precipitationProbability);
  const label: Record<FloodRiskLevel, string> = {
    SAFE: "안전",
    CAUTION: "주의",
    WARNING: "경고",
    DANGER: "위험",
  };
  return `${data.temperature}℃ · 습도 ${data.humidity}% · 강수확률 ${data.precipitationProbability}% → [${label[level]}]`;
}
