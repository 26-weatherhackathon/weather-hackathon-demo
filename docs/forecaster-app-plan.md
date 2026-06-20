# 「예보관 의사결정 체험」 개발 계획서

> 기상·기후 AI 해커톤 2026 · Vercel 배포 기준

---

## 0. 수상 전략 — 확정된 3대 방향

이 계획은 단순 시각화가 아니라 **"수상 가능한 작동 데모"** 를 목표로 합니다. 아래 3가지가 확정 방향입니다.

| 결정 | 내용 | 심사 직결 |
|---|---|---|
| **① 실데이터 정면 사용** | 기상청 API허브 + 공공데이터포털의 **실제 수치모델·위성·레이더·ASOS** 데이터를 직접 수집·검증 | 주제 적합성 20점 |
| **② 화려한 AI 이미지 대량 투입** | 케이스 브리핑 일러스트·예보관 캐릭터·배경·영상 해설을 **AI로 대량 생성**해 시각적 임팩트 극대화 | 독창성 15점·참여형 25점 |
| **③ 1케이스 완전체 데모** | 「2022-08-08 수도권 집중호우」 1개 케이스의 5단계 루프를 **끝까지 완성** → 심사장에서 작동하는 화면으로 임팩트 | 실현가능성 30점 |

> **핵심 원칙**: 4개 케이스를 얕게 깔지 않는다. 1개를 완성도 100%로 만들고, 나머지는 "동일 구조로 확장 가능"임을 구조로 증명한다.

---

## 1. 기술 스택

이미 검증된 스택을 채택해 팀 내 배포 경험을 재사용합니다.

| 역할 | 선택 | 근거 |
|---|---|---|
| 프레임워크 | **Astro** | 정적 출력 + Island 인터랙션에 최적 |
| UI 인터랙션 | Astro Islands (Vanilla JS / Preact) | 지도·슬라이더·레이어 토글은 Island로 격리 |
| 스타일 | Tailwind CSS | 빠른 UI 반복 |
| 데이터 | 정적 JSON + PNG (사전 수집) | 실시간 API 호출 없음 → 현장 데모 안정성 확보 |
| 배포 | **Vercel** | `vercel.json` 재사용 |

---

## 2. 레포지토리 구조

Astro 표준 디렉토리 컨벤션을 그대로 따릅니다.

```
forecaster-experience/
├── public/
│   └── data/
│       └── cases/
│           ├── 20220808-seoul/          # 케이스별 사전 수집 데이터
│           │   ├── meta.json            # 케이스 메타 + 정답(groundTruth)
│           │   ├── sat_ir.png           # 천리안 2A 적외 위성영상
│           │   ├── radar_-24h.png       # 레이더 합성영상 (시계열)
│           │   ├── radar_-12h.png
│           │   ├── radar_-06h.png
│           │   ├── radar_now.png
│           │   ├── asos.json            # ASOS 지상관측 시간자료
│           │   ├── model_kim.json       # KIM 수치모델 예측값
│           │   └── model_um.json        # UM 수치모델 예측값
│           ├── 20230714-daegu/
│           └── 20240915-jeju/
├── src/
│   ├── components/
│   │   ├── CaseCard.astro              # 케이스 선택 카드
│   │   ├── LayerViewer.astro           # 위성·레이더·모델 레이어 토글
│   │   ├── TimeSlider.astro            # -24h ~ 현재 시간 재생 슬라이더
│   │   ├── ModelCompare.astro          # 두 모델 나란히 비교 뷰
│   │   ├── ForecastInput.astro         # 예측 입력 (확률·형태·기온 슬라이더)
│   │   ├── EvidenceChecklist.astro     # 근거 데이터 체크박스
│   │   ├── ResultReveal.astro          # 실황 공개 + Brier 채점
│   │   ├── ReflectionInput.astro       # "무엇을 놓쳤나" 입력
│   │   └── ScoreDashboard.astro        # 누적 성장 대시보드
│   ├── layouts/
│   │   └── BaseLayout.astro            # 공통 헤더·푸터
│   ├── pages/
│   │   ├── index.astro                 # 랜딩 + 케이스 라이브러리
│   │   ├── onboarding.astro            # 30초 데이터 유형 설명 + 확인 퀴즈
│   │   └── case/
│   │       └── [caseId].astro          # 동적 라우팅: 케이스별 체험 페이지
│   ├── lib/
│   │   ├── scoring.ts                  # Brier Score 채점 로직
│   │   ├── caseLoader.ts               # 케이스 JSON 로드 헬퍼
│   │   └── sessionStore.ts             # localStorage 기반 진행 상태 관리
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
├── vercel.json
├── package.json
└── tsconfig.json
```

---

## 3. 개발 단계 (4주 스프린트)

### Phase 0 — 환경 세팅 (Day 1~2)

```bash
# 표준 Astro 초기화
npm create astro@latest forecaster-experience -- --template minimal
cd forecaster-experience
npx astro add tailwind
npx astro add vercel        # @astrojs/vercel 어댑터
git init && git remote add origin <repo-url>
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  output: 'static',          // 정적 출력 — Vercel에 HTML/JS/PNG만 올라감
  adapter: vercel(),
  integrations: [tailwind()],
});
```

`vercel.json` (현재 레포 설정 참조):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

---

### Phase 1 — 실 API허브 데이터 수집 + 완전체 케이스 (Day 3~9)

> **확정: 1케이스 완전체.** 「2022-08-08 수도권 집중호우」를 모든 레이어가 실데이터로 채워진
> 완성 케이스로 만든다. 나머지 3개는 동일 스키마의 빈 슬롯으로 두어 "확장 가능"만 증명.

#### 1-1. 실제 사용할 기상청 API허브 / 공공데이터포털 엔드포인트

레포의 `api/forecast.js`에 **이미 검증된 단기예보 호출 코드**(`VilageFcstInfoService_2.0/getVilageFcst`)가 있으므로 이를 출발점으로 삼는다.

| 레이어 | 데이터 | 검증된/대상 엔드포인트 | 인증 |
|---|---|---|---|
| 위성 | 천리안 2A 적외/가시 | API허브 `sat/gk2a` 영상 API | authKey |
| 레이더 | HSR 합성영상 | API허브 `rdr/dnl` 레이더 영상 API | authKey |
| 지상관측 | ASOS 시간자료 | API허브 `kma_sfctm` / 공공데이터 `getWthrDataList` | authKey/serviceKey |
| **모델(핵심)** | 단기예보 격자 예측 | **`getVilageFcst`** (레포에 검증 코드 존재) | serviceKey |
| **모델 불일치** | 두 발표시각 예보 비교 | `getVilageFcst` **base_time 2개** (예: 0200 vs 0800 발표) | serviceKey |
| 정답(실황) | 실제 강수·기온 | ASOS 일자료 `getWthrDataList` | serviceKey |

> **모델 불일치를 실데이터로 만드는 방법**: KIM/UM 원시 격자는 일반 참가자가 받기 어렵다.
> 대신 **같은 날짜를 서로 다른 발표시각(base_time)으로 호출**하면, 시간 경과에 따라 예보가
> 어떻게 흔들렸는지가 실제 기상청 데이터로 드러난다. 이것이 "모델/가이던스가 엇갈리는 순간"을
> **정직하게 실데이터로** 재현하는 핵심 트릭이다. (추가로 ASOS 실측 추세를 모델 B의 근거로 대조)

#### 1-2. 수집 스크립트 (`scripts/fetch-case.ts` — 개발 시 1회 실행)

```
[위성]  API허브 gk2a 적외영상  → public/data/cases/20220808-seoul/sat_ir_{t}.png
[레이더] API허브 HSR 합성영상   → radar_{-24h..now}.png  (6~8장 시계열)
[지상]  ASOS 시간자료 JSON     → asos.json  (기압·기온·습도·강수 추세)
[모델A] getVilageFcst 0200발표 → model_A.json
[모델B] getVilageFcst 0800발표 → model_B.json
[정답]  ASOS 일자료            → groundTruth (meta.json에 병합)
         ↓ 모두 정적 파일화 (실시간 호출 0, 현장 무중단)
```

각 응답은 **원본 JSON도 함께 저장**(`raw/`)해 "진짜 기상청 데이터"임을 심사장에서 증빙.

#### 1-3. 케이스 메타 스키마 (`meta.json`)

```json
{
  "caseId": "20220808-seoul",
  "title": "수도권 집중호우",
  "difficulty": "hard",
  "tags": ["장마전선", "모델불일치", "국지호우"],
  "timeFrames": ["-24h", "-12h", "-06h", "-03h", "-01h", "now"],
  "dataSource": {
    "satellite": "기상청 API허브 GK2A 적외영상",
    "radar": "기상청 API허브 HSR 합성영상",
    "asos": "공공데이터포털 getWthrDataList",
    "model_A": "getVilageFcst base_time=0200 (검증된 forecast.js 경로)",
    "model_B": "getVilageFcst base_time=0800"
  },
  "groundTruth": {
    "precip": true,
    "precipType": "비",
    "precipAmount_mm": 381.5,
    "tMax_C": 26.0,
    "source": "ASOS 일자료 (서울 108 지점)"
  },
  "keyEvidence": ["radar", "asos_trend"],
  "expertNote": "0200 발표는 강수확률을 낮게 봤으나 0800 발표에서 급상승, 레이더 에코 발달이 결정적 단서였다."
}
```

---

### Phase 2 — 핵심 UI 컴포넌트 구현 (Day 8~16)

#### 2-1. 레이어 뷰어 (`LayerViewer.astro`)

- 위성·레이더·모델·지상관측 4개 탭 토글
- 시간 슬라이더와 연동 → 선택한 시각의 이미지·데이터 표시
- 모바일 대응 (터치 스와이프)

#### 2-2. 모델 비교 뷰 (`ModelCompare.astro`)

- KIM / UM 예측값을 좌·우로 나란히 표시
- 엇갈리는 수치를 빨간 강조색으로 자동 하이라이트
- "어느 모델을 선택하겠습니까?" 라디오 버튼 + 이유 입력

#### 2-3. 예측 입력 패널 (`ForecastInput.astro`)

```
강수 여부:   [ 없음 ──●────── 확실히 비 ]   0%  ~  100%
강수 형태:   ○ 비   ○ 눈   ○ 비·눈   ○ 없음
최고기온:    [ ──────●──── ]   (°C 범위 슬라이더)
```

- 확률 슬라이더 → 0~100% 정수값 → `f` (Brier 채점에 사용)
- 제출 전 근거 체크리스트 1개 이상 선택 필수

#### 2-4. Brier 채점 + 결과 공개 (`ResultReveal.astro`)

```typescript
// src/lib/scoring.ts
export function brierScore(f: number, o: 0 | 1): number {
  return Math.pow(f / 100 - o, 2);
}

export function toPoints(brier: number): number {
  return Math.round((1 - brier) * 100);
}

export function totalScore(precipPoints: number, typeMatch: boolean, tempDiff: number): number {
  const typePoints = typeMatch ? 100 : 0;
  const tempPoints = Math.max(0, 100 - tempDiff * 10); // ±1°C당 10점 감점
  return Math.round(precipPoints * 0.6 + typePoints * 0.2 + tempPoints * 0.2);
}
```

---

### Phase 3 — 학습 루프 + 상태 관리 (Day 17~21)

#### 진행 상태 (`sessionStore.ts`)

`localStorage`에 케이스별 결과를 누적 저장합니다. 서버 불필요, 오프라인 동작.

```typescript
interface CaseResult {
  caseId: string;
  timestamp: number;
  prediction: { precipProb: number; precipType: string; tMax: number };
  evidence: string[];         // 체크한 근거 데이터
  brierScore: number;
  totalScore: number;
  reflection: string;         // "무엇을 놓쳤나" 자유 입력
}
```

#### 성장 대시보드 (`ScoreDashboard.astro`)

- 풀이 순서별 점수 꺾은선 그래프 (Canvas API)
- 강점·약점 데이터 유형 집계 (레이더를 잘 활용하는가? 모델 불일치에 약한가?)
- 누적 Brier 평균 vs 무조건 50% 찍기 비교선

---

### Phase 4 — 온보딩 + 폴리싱 (Day 22~26)

#### 온보딩 (`onboarding.astro`)

30초 카드 슬라이드 (4장) + 확인 퀴즈 (3문항):

```
카드 1: 위성영상 → "구름의 두께와 온도를 봅니다"
카드 2: 레이더   → "지금 당장 비가 내리는 위치를 봅니다"
카드 3: 수치모델 → "앞으로 6~72시간 예측입니다 (불확실)"
카드 4: 지상관측 → "실제 관측소의 현재 수치입니다"
```

퀴즈 통과 → 케이스 라이브러리로 이동. 첫 방문 시 자동 진입.

#### 케이스 라이브러리 (`index.astro`)

```
난이도 필터: [ 전체 | 쉬움 | 보통 | 어려움 | 함정 ]

┌──────────────────┐  ┌──────────────────┐
│ ★☆☆  쉬움        │  │ ★★☆  보통        │
│ 대구 맑음 고기압 │  │ 수도권 오후 소나기│
│ 2023-07-14       │  │ 2024-06-22       │
│ [시작하기]       │  │ [시작하기]       │
└──────────────────┘  └──────────────────┘
```

완료한 케이스는 점수 배지 표시.

---

### Phase 5 — Vercel 배포 + 도메인 연결 (Day 27~28)

```bash
# 빌드 확인
npm run build && npm run preview

# Vercel 배포
vercel --prod
```

**Vercel 프로젝트 설정:**

| 항목 | 값 |
|---|---|
| Framework Preset | Astro |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `.` |
| Node.js Version | 20.x |

**도메인 연결:**
- Vercel 대시보드 → Domains → 사용할 도메인 추가
- DNS: CNAME 레코드 → `cname.vercel-dns.com`

---

## 4. 데이터 준비 상세

### API 수집 흐름 (개발 시 1회 실행, 이후 정적 파일 사용)

```
기상청 API허브 (apihub.kma.go.kr)  — authKey
  └── 위성 분야 gk2a   → 천리안 2A 적외영상 PNG
  └── 레이더 분야 HSR  → 합성영상 PNG (시간대별 6~8장)
  └── 지상관측 sfctm   → ASOS 시간자료 JSON

공공데이터포털 (data.go.kr)  — serviceKey
  └── 단기예보 getVilageFcst   → 모델A(0200발표)·모델B(0800발표) JSON
  └── ASOS 일자료 getWthrDataList → 정답(실황) 강수·기온
```

> "모델 불일치"는 **동일 날짜의 두 발표시각 예보 차이**로 실데이터에서 직접 끌어낸다 (§1-1 참조).
> 검증된 `api/forecast.js`의 `getVilageFcst` 호출 로직을 `scripts/fetch-case.ts`로 옮겨 재사용.

### 사전 수집의 장점 (실현가능성 30점 직결)

- 현장(천안) 네트워크 장애와 무관하게 동작
- Vercel 정적 CDN 캐시로 전 세계 어디서나 빠른 로딩
- API 호출 한도(일 2,000~10,000건) 미소진
- 과거 날짜 → 실황 확정 → 즉각 채점 가능

---

## 4-B. AI 이미지 대량 활용 — 시각적 임팩트 전략

> **확정 방향: "화려하게, 이미지는 많을수록 좋다."** 스토리텔링 감성을 살려,
> 딱딱한 기상 데이터를 **몰입형 비주얼**로 감싼다. 실데이터(위성·레이더)는 정보로, AI 이미지는
> 분위기·해설·캐릭터로 역할을 분리한다. (실데이터와 AI 생성물은 화면에 명확히 라벨로 구분)

### 어디에 AI 이미지를 쓰는가 (대량 생성 목록)

| 위치 | AI 생성물 | 생성 도구 | 수량(케이스당) |
|---|---|---|---|
| 케이스 도입 | "예보관 브리핑" 몰입형 일러스트 (집중호우 새벽 상황판) | 이미지 생성 모델 | 1~2 |
| 예보관 캐릭터 | 학습자를 안내하는 예보관 아바타 (표정 3종: 고민/확신/놀람) | 이미지 생성 모델 | 3 |
| 단계 배경 | 5단계 각각의 분위기 배경 (종관분석실→레이더실→발표실) | 이미지 생성 모델 | 5 |
| 위성영상 해설 | 실제 위성영상 옆 "이 소용돌이가 저기압" 해설 오버레이 | AI 캡션+주석 | 실영상 수만큼 |
| 결과 연출 | 실황 공개 시 "그날의 서울" 재현 일러스트 (폭우 거리) | 이미지 생성 모델 | 1~2 |
| 대시보드 | 성장 배지·등급 일러스트 (수습→베테랑 예보관) | 이미지 생성 모델 | 5종 등급 |

→ **케이스 1개당 AI 이미지 15~20장**, 화면 전환마다 비주얼이 바뀌어 "화려한" 인상.

### AI 텍스트 생성 (Claude API, `api/` 서버리스 재사용)

레포에 이미 `api/` 서버리스 패턴이 있으므로 동일 방식으로 Claude 호출 엔드포인트를 추가한다.

| 엔드포인트 | 기능 |
|---|---|
| `api/reflect.js` | 학습자의 "무엇을 놓쳤나" 리플렉션 입력 → Claude가 맞춤 피드백 생성 |
| `api/caption.js` | 위성·레이더 영상 색상 의미를 학습 수준에 맞게 해설 (사전 생성 후 정적화 권장) |

> **검증 원칙**: AI가 만든 기상 해설·수치·인과관계는 반드시 기상청 자료와 대조한다.
> 이미지는 "분위기/연출"에만 쓰고, **판단 근거가 되는 데이터는 100% 실측**으로 유지한다.
> (심사장에서 "데이터는 실제, 비주얼은 AI"를 명확히 구분 설명 → 신뢰성 + 독창성 동시 확보)

### 이미지 자산 배치

```
public/
├── data/cases/20220808-seoul/   # 실데이터 (위성·레이더 PNG, JSON)
└── ai/cases/20220808-seoul/     # AI 생성 비주얼 (일러스트·캐릭터·배경)
    ├── briefing.png
    ├── forecaster_thinking.png
    ├── stage_bg_{1..5}.png
    ├── result_seoul_flood.png
    └── badge_{rookie..veteran}.png
```

---

## 5. 채점 로직 요약

```
강수 확률 점수 (60%):  Brier = (f/100 − o)²  →  100 − round(Brier × 100)
강수 형태 점수 (20%):  정답 일치 100점 / 불일치 0점
최고기온 점수 (20%):   차이 ΔT°C당 −10점 (0점 하한)

총점 = 강수점 × 0.6 + 형태점 × 0.2 + 기온점 × 0.2
```

예시:

| 예측 | 실황 | Brier | 강수점 | 총점 |
|---|---|---|---|---|
| 확률 90%, 비, 26°C | 비, 26°C | 0.01 | 99 | ~99 |
| 확률 90%, 비, 26°C | 맑음, 30°C | 0.81 | 19 | ~20 |
| 확률 50%, 비, 26°C | 비, 26°C | 0.25 | 75 | ~75 |

---

## 6. 심사 배점 대응

| 심사 항목 | 배점 | 기술적 구현 |
|---|---|---|
| 실현 가능성 | 30 | 정적 Astro 빌드 + **1케이스 완전체** → 현장에서 확실히 작동하는 화면 |
| 체험·참여형 | 25 | 5단계 능동 루프 + **케이스당 AI 이미지 15~20장**의 몰입형 비주얼 |
| 주제 적합성 | 20 | **기상청 API허브 실데이터 정면 사용**(원본 JSON 증빙), 실제 예보 5단계 재현 |
| 아이디어 독창성 | 15 | 확률적 의사결정 체험 + Brier 채점 + **실데이터×AI비주얼 결합** |
| 학습 효과 | 10 | 백워드 설계 목표 정렬, 누적 성장 추세 가시화 |

---

## 7. 작업 체크리스트

### 환경 세팅
- [ ] `npm create astro@latest` + Tailwind + Vercel 어댑터
- [ ] `vercel.json` 설정
- [ ] GitHub 레포 연결 + Vercel 자동 배포 설정

### 데이터 수집 (실 API허브 — 1케이스 완전체)
- [ ] 기상청 API허브 authKey 발급
- [ ] 공공데이터포털 serviceKey 발급
- [ ] `getVilageFcst` 호출 검증 (forecast.js 로직 재사용 확인)
- [ ] 「20220808-seoul」 위성(gk2a)·레이더(HSR)·ASOS 실데이터 수집
- [ ] 모델 불일치용 0200/0800 두 발표시각 예보 수집
- [ ] 원본 JSON `raw/` 보존 (실데이터 증빙용)
- [ ] `public/data/cases/` 정적 파일 배치 + groundTruth 실측 대조

### AI 비주얼 생성 (화려함 = 임팩트)
- [ ] 케이스 브리핑 일러스트 (집중호우 새벽 상황판)
- [ ] 예보관 캐릭터 3종 (고민/확신/놀람)
- [ ] 5단계 배경 일러스트 (종관분석실→발표실)
- [ ] 위성영상 해설 오버레이 (AI 캡션)
- [ ] 결과 연출 + 성장 배지 5종
- [ ] `api/reflect.js` Claude 리플렉션 피드백 엔드포인트

### 컴포넌트 개발
- [ ] `BaseLayout.astro` (헤더·푸터)
- [ ] `LayerViewer.astro` (4개 레이어 + 시간 슬라이더)
- [ ] `ModelCompare.astro` (KIM vs UM 나란히)
- [ ] `ForecastInput.astro` (확률·형태·기온 입력)
- [ ] `EvidenceChecklist.astro` (근거 체크박스)
- [ ] `ResultReveal.astro` (실황 공개 + 채점)
- [ ] `ReflectionInput.astro` (리플렉션 입력)
- [ ] `ScoreDashboard.astro` (누적 성장 그래프)

### 페이지
- [ ] `onboarding.astro` (4장 카드 + 퀴즈)
- [ ] `index.astro` (케이스 라이브러리)
- [ ] `case/[caseId].astro` (체험 메인 페이지)

### 채점·상태
- [ ] `scoring.ts` Brier Score 구현 + 단위 테스트
- [ ] `sessionStore.ts` localStorage 저장·불러오기

### 배포
- [ ] `npm run build` 오류 없이 통과
- [ ] Vercel 프로덕션 배포
- [ ] 도메인 연결 (Vercel 대시보드)
- [ ] 모바일 반응형 확인
- [ ] 현장 오프라인 동작 확인 (네트워크 차단 상태에서 테스트)

---

## 참조

- 기상청 API허브: apihub.kma.go.kr
- 공공데이터포털: data.go.kr
- Astro 공식 Vercel 가이드: docs.astro.build/guides/deploy/vercel
