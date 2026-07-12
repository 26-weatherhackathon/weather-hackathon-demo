// scripts/fetch-golden-time-case.mjs
// 골든타임 데모 케이스 데이터 수집 (docs/golden-time-plan.md §5)
//
// 실행: node scripts/fetch-golden-time-case.mjs
//   - 키 없이 동작: open-meteo 아카이브(실측 기반 재분석)에서 시간별 강수량 수집
//   - KMA_HUB_AUTHKEY 환경변수가 있으면: 기상청 API허브 HSR 레이더 합성영상도 수집
// 산출물:
//   public/golden-time/data/case-20260708-chungbuk.json  (게임이 로드하는 케이스 파일)
//   public/golden-time/data/raw/*.json                   (원본 응답 증빙)
//
// 데이터 출처 라벨 규칙: 게임 화면에 표기되는 출처 문자열은 이 파일의 sources와 일치시킨다.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "public/golden-time/data";
const RAW_DIR = path.join(OUT_DIR, "raw");

const CASE_DATE = "2026-07-08";
const TZ = "Asia/Seoul";

// 지점 구성: 캠핑장(하류 계곡) 1 + 상류 2 + 지역 참고 1
// 좌표는 충북 미호강 수계 일대. 캠핑장은 시나리오상 가상의 위치이나
// 강수량 시계열은 해당 좌표의 실측 기반 값을 그대로 사용한다.
const POINTS = [
  { id: "campsite", name: "캠핑장 (계곡 하류)", lat: 36.79, lon: 127.61, role: "campsite" },
  { id: "upstream1", name: "상류 산지 (음성 방면)", lat: 36.98, lon: 127.73, role: "upstream" },
  { id: "upstream2", name: "상류 (증평 방면)", lat: 36.87, lon: 127.66, role: "upstream" },
  { id: "regional", name: "청주 도심 (참고)", lat: 36.64, lon: 127.49, role: "regional" },
];

async function fetchPoint(p) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
    `&start_date=${CASE_DATE}&end_date=${CASE_DATE}` +
    `&hourly=precipitation&timezone=${encodeURIComponent(TZ)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo ${p.id}: HTTP ${res.status}`);
  return res.json();
}

// 기상청 API허브 HSR 레이더 합성영상 (팀 authKey 보유 시에만 실행)
// 게임 v0는 강수량 기반 재구성 맵을 쓰므로 이 수집은 선택 사항이다.
async function fetchRadarFrames(authKey) {
  const frames = ["0800", "0900", "1000", "1100", "1200", "1300", "1400"];
  console.log("[radar] API허브 HSR 수집 시작 — 프레임:", frames.join(", "));
  for (const hhmm of frames) {
    const tm = CASE_DATE.replaceAll("-", "") + hhmm;
    const url =
      `https://apihub.kma.go.kr/api/typ03/php/cgi_rdr_new.php` +
      `?tm=${tm}&cmp=HSR&map=HB&size=640&authKey=${authKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[radar] ${tm} 실패: HTTP ${res.status} — 엔드포인트/파라미터는 API허브 문서로 확인 필요`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(OUT_DIR, `radar_${hhmm}.png`), buf);
    console.log(`[radar] radar_${hhmm}.png 저장 (${buf.length} bytes)`);
  }
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });

  const hourlySeries = {};
  let timeAxis = null;

  for (const p of POINTS) {
    const json = await fetchPoint(p);
    await writeFile(
      path.join(RAW_DIR, `openmeteo-${p.id}-${CASE_DATE}.json`),
      JSON.stringify(json, null, 2)
    );
    timeAxis = json.hourly.time;
    hourlySeries[p.id] = json.hourly.precipitation;
    console.log(`[precip] ${p.name}: ${json.hourly.precipitation.filter((v) => v > 0).length}개 시간대 강수`);
  }

  const caseFile = {
    caseId: "20260708-chungbuk",
    title: "충북 집중호우 — 계곡 캠핑장의 아침",
    date: CASE_DATE,
    timezone: TZ,
    points: POINTS,
    hourly: { time: timeAxis, precipitation: hourlySeries },
    // 급류 도달 파생 모델 (공고의 "실제 기상 데이터 또는 파생 모델" 요건 중 파생 모델)
    // 단순화 규칙: 상류 2지점 평균 누적강수가 thresholdMm를 넘는 시각 + lagMinutes
    derivedModel: {
      kind: "flash-flood-eta",
      thresholdMm: 18,
      lagMinutes: 40,
      note: "교육용 단순화 모델. 실제 급류 예측은 유역·지형·토양 조건이 필요하다.",
    },
    sources: [
      "시간별 강수량: open-meteo.com (실측 기반 재분석·관측 혼합, 2026-07-08, 충북 4지점)",
      "레이더 합성영상(선택): 기상청 API허브 HSR — scripts/fetch-golden-time-case.mjs 참조",
      "행동 우선순위 근거: 행정안전부 국민재난안전포털 자연재난(호우) 국민행동요령",
    ],
    disclaimer:
      "게임 내 지도는 실측 강수량을 단순화해 재구성한 것이며 레이더 원영상이 아니다. 급류 도달 시각은 교육용 파생 모델이다.",
  };

  await writeFile(
    path.join(OUT_DIR, "case-20260708-chungbuk.json"),
    JSON.stringify(caseFile, null, 2)
  );
  console.log(`[case] ${OUT_DIR}/case-20260708-chungbuk.json 생성`);

  const authKey = process.env.KMA_HUB_AUTHKEY;
  if (authKey) {
    await fetchRadarFrames(authKey);
  } else {
    console.log("[radar] KMA_HUB_AUTHKEY 없음 — 레이더 원영상 수집은 건너뜀 (게임 v0에는 불필요)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
