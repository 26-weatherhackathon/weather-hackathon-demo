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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
