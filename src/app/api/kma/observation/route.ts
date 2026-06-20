import { NextRequest, NextResponse } from "next/server";

// 기상청 API 허브: 지상관측 (ASOS 자동기상관측)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tm = searchParams.get("tm"); // 관측시각 YYYYMMDDHHmm
  const stnIds = searchParams.get("stnIds") ?? ""; // 지점번호 (공백=전국)

  const key = process.env.KMA_API_HUB_KEY;
  const url = new URL("https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php");
  url.searchParams.set("authKey", key!);
  url.searchParams.set("tm", tm ?? "");
  if (stnIds) url.searchParams.set("stnIds", stnIds);
  url.searchParams.set("help", "0");

  const res = await fetch(url.toString());
  const text = await res.text();

  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
