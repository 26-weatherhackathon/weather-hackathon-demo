import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 마을 홍수 방재 게임",
  description:
    "기상청 실데이터로 구동되는 초등학생 대상 아이소메트릭 홍수 방재 시뮬레이션 데모",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Lottie 재생기 (반짝이 등 모션 효과) */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
