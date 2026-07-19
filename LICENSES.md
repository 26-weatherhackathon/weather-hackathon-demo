# 외부 리소스 및 라이선스

이 프로젝트에서 사용한 외부 리소스와 라이선스를 기록한다. (repo CLAUDE.md 3항)

## 폰트

| 리소스 | 출처 | 라이선스 | 상업적 이용 | 변형 |
|---|---|---|---|---|
| Jua | Google Fonts (fonts.google.com/specimen/Jua) | SIL Open Font License 1.1 | 가능 | 없음(웹폰트 링크) |
| Gowun Dodum | Google Fonts (fonts.google.com/specimen/Gowun+Dodum) | SIL Open Font License 1.1 | 가능 | 없음(웹폰트 링크) |

## 이미지·캐릭터

| 리소스 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| 기상이 캐릭터 (`public/img/gisang*.png`) | 기상청 공식 캐릭터 | 공공누리 제2유형(출처표시 + 상업적 이용금지) | 교육용·비상업 사용. 출처 표기 필수 |
| 마을·시설 에셋 (`public/img/assets/*.png`) | 생성형 AI(Google Gemini, `gemini-2.5-flash-image`)로 생성 | 자체 생성물 | 기상이 스타일을 레퍼런스로 생성. 특정 원본 저작물 재현 아님 |

## 데이터

| 리소스 | 출처 | 라이선스 | 용도 |
|---|---|---|---|
| Copernicus GLO-30 DEM (동작구 표고) | ESA / Copernicus (`data/dem/dongjak_cop30.tif`) | 자유 이용(출처표시) | 지형 고도 데이터 |
| 기상청 관측/예보 데이터 | 기상자료개방포털(data.kma.go.kr) | 공공누리 | 강수 시나리오 구동(예정) |

## 라이브러리

| 리소스 | 라이선스 |
|---|---|
| Next.js, React | MIT |
| Tailwind CSS | MIT |

AI 활용: 코드·이미지 생성에 Claude(Anthropic) 및 Google Gemini를 사용. 상세 프롬프트/세션 내역은 제출용 AI 활용 내역서에 별도 기록.
