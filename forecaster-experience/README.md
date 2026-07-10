# forecaster-experience

「예보관 의사결정 체험」 — 기상·기후 AI 해커톤 2026 출품작.

실제 기상청 데이터로 확률적 판단을 내리고 실황과 대조해 채점받는 단일 페이지 웹 체험 도구.

## 스택 (Build Spec §2)

- **Astro** `^4` (`output: 'static'`) + **Vercel** (`@astrojs/vercel/static`)
- **Preact** islands (`@astrojs/preact`) — 슬라이더·뷰어 등 상태 컴포넌트만
- **Tailwind CSS** (`@astrojs/tailwind` v5, Tailwind v3) — 디자인 토큰 §12
- **TypeScript** strict
- **Anthropic SDK** (`@anthropic-ai/sdk`) — 서버리스 리플렉션 피드백 (`claude-sonnet-4-6`)
- 폰트: Pretendard v1.3.9 (CDN)

> Node 20.x LTS 권장(Vercel 런타임 일치). 패키지 매니저: npm.

## 개발

```bash
npm install
npm run dev        # 로컬 개발 서버
npm run build      # 정적 빌드 (dist/)
npm run preview    # 빌드 미리보기
npm test           # vitest
```

## 환경변수

`.env.example` 참조. 데이터 수집 스크립트(`scripts/`)는 **로컬에서만** 키를 사용하고
결과 정적 파일만 커밋한다(§2.2). 런타임에는 `ANTHROPIC_API_KEY`만 서버리스에서 사용.

## 구조 (Build Spec §3)

```
public/data/cases/<caseId>/   실데이터 (위성·레이더·ASOS·예보·실황) + raw/ 증빙
public/ai/                    AI 비주얼·배지
src/components/               ui · viewer · decision · result · dashboard · onboarding · shell
src/layouts/                  BaseLayout.astro
src/pages/                    index · onboarding · case/[caseId]
src/lib/                      types · scoring · session · caseLoader · grade
src/stores/                   caseStore (@preact/signals)
api/reflect.js                Claude 리플렉션 피드백 (Vercel 서버리스)
scripts/                      실데이터 수집
```

> 현재는 **스캐폴드** 단계다. 컴포넌트·채점·세션 등은 Build Spec §6~ 일정에 따라 채운다.
> 단일 출처(Single source of truth)는 `docs/forecaster-build-spec.md`.
