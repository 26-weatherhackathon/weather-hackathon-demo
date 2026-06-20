import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "왜 기후 예측이 어려운가? | 기상청 데이터로 배우는 대기 과학",
  description:
    "기상청이 틀리는 게 아니라, 대기 자체가 그렇게 생겼다. 카오스 이론부터 앙상블 예측까지 — 실제 기상 데이터로 직접 체험해보세요.",
  openGraph: {
    title: "왜 기후 예측이 어려운가?",
    description: "기상청 실시간 데이터로 배우는 대기 과학 인터랙티브 체험",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
