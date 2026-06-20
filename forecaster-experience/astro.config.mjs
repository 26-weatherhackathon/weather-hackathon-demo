// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

// 정적 출력 + Vercel 배포 (§2). api/ 서버리스는 Vercel 함수로 별도 배포.
// 인터랙션은 Preact islands(슬라이더·뷰어 등 상태 컴포넌트만)로 한정.
export default defineConfig({
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  integrations: [
    preact(),
    tailwind({
      // 디자인 토큰은 tailwind.config.mjs + src/styles/global.css 에서 관리 (§12)
      applyBaseStyles: false,
    }),
  ],
});
