/** @type {import('tailwindcss').Config} */
// 디자인 토큰의 단일 출처는 §12. 값은 Day 1 이후 §12 토큰으로 확정한다.
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Pretendard(본문) + 수치는 mono (카운트업·타임스탬프 — §5-C)
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // TODO(§12): 디자인 토큰 확정 시 교체. 임시 플레이스홀더.
        ink: '#0f172a',
        warn: '#f59e0b',
      },
    },
  },
  plugins: [],
};
