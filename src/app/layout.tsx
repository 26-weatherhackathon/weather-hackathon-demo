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
      <body>{children}</body>
    </html>
  );
}
