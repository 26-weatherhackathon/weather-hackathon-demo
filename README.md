# 우리 마을 홍수 방재 게임

기상청 실데이터로 구동되는, 초등학생 대상 아이소메트릭 홍수 방재 학습 시뮬레이션 데모.

2026 기상·기후 AI 해커톤 대표 데모. 상세 기획은 [`docs/PLAN.md`](docs/PLAN.md) 참조.

## 1. 프로젝트 개요

- **콘텐츠명**: 우리 마을 홍수 방재 게임
- **한 줄 소개**: 실제 지형(DEM) 위에서 비가 내릴 때 물이 어디로 흐르고 어디가 잠기는지 직접 보고, 예산 안에서 방재 시설을 배치해 마을을 지키는 웹 게임.
- **학습 대상**: 초등학교 4~6학년
- **학습 목표**
  1. 물은 낮은 곳부터 채워진다는 것을 알고, 우리 집 고도와 물 높이를 비교해 위험한 집을 찾을 수 있다.
  2. 침수 정도에 맞는 방재 방법(모래주머니·제방·펌프·빗물저류조)을 선택하고 그 효과를 예측할 수 있다.
  3. 예산이라는 제한 안에서 마을 전체를 지키는 방재 조합을 판단할 수 있다.

## 2. 실행 방법 (로컬 개발)

Node.js 18 이상 필요.

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 설정 (아래 4장 참조)
cp .env.example .env.local
#  .env.local 파일을 열어 KMA_API_KEY 값을 채웁니다.
#  (키가 없어도 Mock 데이터로 게임은 정상 동작합니다.)

# 3) 개발 서버 실행
npm run dev
#  http://localhost:3000 접속
```

기타 스크립트: `npm run build`(프로덕션 빌드), `npm run start`(빌드 결과 실행), `npm run lint`.

## 3. 배포 방법

- **플랫폼**: Vercel (GitHub 저장소 연결 → 자동 배포)
- **프레임워크 프리셋**: Next.js (자동 감지)
- **빌드 명령어**: `next build` (기본값)
- **환경변수**: Vercel 프로젝트 Settings → Environment Variables 에 `KMA_API_KEY` 등록 (코드에 값 저장 금지)
- main 브랜치에 머지되면 Vercel이 자동으로 최신 버전을 재배포합니다.

## 4. 사용한 기상 데이터 및 API

- **기상청(KMA) 공공데이터 API** — [공공데이터포털](https://www.data.go.kr)
  - 용도: 강수량·강수확률 등 실측/예보 값을 게임의 강우 시나리오(수위 상승 엔진)로 사용.
  - 키 관리: 서버 전용 환경변수 `KMA_API_KEY`로만 사용하며, 브라우저에 노출되는 `NEXT_PUBLIC_` 접두사는 쓰지 않습니다(서버 경유). 네트워크 실패 시 시연이 끊기지 않도록 과거 호우 Mock 데이터로 폴백합니다.
- **Copernicus GLO-30 수치표고모형(DEM)** — 지형 고도 데이터. 마을 지형과 물 흐름·침수 판정의 근거로 사용.

## 5. 외부 리소스 출처 및 라이선스

### 라이브러리

| 리소스 | 버전 | 라이선스 |
|---|---|---|
| Next.js | ^14.2.35 | MIT |
| React / React DOM | ^18.3.1 | MIT |
| Tailwind CSS | ^3.4.7 | MIT |
| TypeScript | ^5.5.4 | Apache-2.0 |

### 폰트

| 리소스 | 출처 | 라이선스 | 상업적 이용 |
|---|---|---|---|
| Jua | [Google Fonts](https://fonts.google.com/specimen/Jua) | SIL Open Font License 1.1 | 가능 |
| Gowun Dodum | [Google Fonts](https://fonts.google.com/specimen/Gowun+Dodum) | SIL Open Font License 1.1 | 가능 |

### 이미지·캐릭터

| 리소스 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| 기상이 캐릭터 (`public/img/gisang*.png`) | 기상청 공식 캐릭터 | 공공누리 제2유형 (출처표시 + 상업적 이용금지) | 교육용·비상업 사용. 출처 표기 필수 |
| 마을·시설 에셋 (`public/img/assets/*.png`) | 생성형 AI(Google Gemini, `gemini-2.5-flash-image`)로 자체 생성 | 자체 생성물 | 기상이 스타일을 레퍼런스로 생성. 특정 원본 저작물을 재현하지 않음 |

### 데이터

| 리소스 | 출처 | 라이선스 |
|---|---|---|
| Copernicus GLO-30 DEM | ESA / Copernicus | 자유 이용(출처표시) |
| 기상 관측·예보 데이터 | 기상자료개방포털(data.kma.go.kr) | 공공누리 |

### AI 활용

코드·이미지 생성에 Claude(Anthropic)와 Google Gemini를 사용했습니다. AI로 생성한 결과물도 팀의 기획·구성을 반영하며, 상세 프롬프트/세션 내역은 제출용 AI 활용 내역서에 별도 기록합니다.

## 6. 팀 정보

2026 기상·기후 AI 해커톤 참가팀. (구성원 역할은 제출 서류에 별도 기재)
