import { defineConfig } from 'vitest/config';

// 빈 inline postcss 설정으로 상위 디렉터리(부모 Next.js 레포)의
// postcss.config 자동 탐색을 차단한다. 단위 테스트는 CSS가 필요 없다.
export default defineConfig({
  css: { postcss: {} },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
