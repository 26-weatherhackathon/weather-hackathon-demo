import { NextRequest, NextResponse } from "next/server";

// 공공데이터포털: 단기예보 조회서비스
// 클라이언트에 API 키 노출 방지용 서버 프록시
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const base_date = searchParams.get("base_date");
  const base_time = searchParams.get("base_time");
  const nx = searchParams.get("nx") ?? "60";
  const ny = searchParams.get("ny") ?? "127";

  if (!base_date || !base_time) {
    return NextResponse.json(
      { error: "base_date, base_time 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  const key = process.env.KMA_PUBLIC_DATA_KEY;
  const url = new URL(
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
  );
  url.searchParams.set("serviceKey", key!);
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", base_date);
  url.searchParams.set("base_time", base_time);
  url.searchParams.set("nx", nx);
  url.searchParams.set("ny", ny);

  const res = await fetch(url.toString());
  const data = await res.json();

  return NextResponse.json(data);
}
