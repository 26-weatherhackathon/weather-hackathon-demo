import { NextRequest, NextResponse } from "next/server";

// 공공데이터포털: 초단기실황 조회
// 전국 주요 도시 실시간 기온·습도·강수 반환

const CITIES = [
  { name: "서울", nx: 60, ny: 127 },
  { name: "춘천", nx: 73, ny: 134 },
  { name: "강릉", nx: 92, ny: 131 },
  { name: "인천", nx: 55, ny: 124 },
  { name: "대전", nx: 67, ny: 100 },
  { name: "대구", nx: 89, ny: 90 },
  { name: "전주", nx: 63, ny: 89 },
  { name: "광주", nx: 58, ny: 74 },
  { name: "부산", nx: 98, ny: 76 },
  { name: "제주", nx: 52, ny: 38 },
];

const PRECIP_TYPE: Record<string, string> = {
  "0": "없음", "1": "비", "2": "비/눈", "3": "눈", "5": "빗방울", "6": "빗방울/눈날림", "7": "눈날림",
};

function getBaseDateTime() {
  const now = new Date();
  // 한국 시간 기준 현재 시각에서 1시간 전 (API 지연 반영)
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}00`;
  return { date, time };
}

async function fetchCity(nx: number, ny: number, date: string, time: string) {
  const key = process.env.KMA_PUBLIC_DATA_KEY!;
  const url = new URL(
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
  );
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("numOfRows", "20");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", date);
  url.searchParams.set("base_time", time);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  const json = await res.json();
  const items: Array<{ category: string; obsrValue: string }> =
    json?.response?.body?.items?.item ?? [];

  const get = (cat: string) => items.find((i) => i.category === cat)?.obsrValue;

  return {
    temp: parseFloat(get("T1H") ?? ""),
    humidity: parseInt(get("REH") ?? ""),
    precipType: PRECIP_TYPE[get("PTY") ?? "0"] ?? "없음",
    windSpeed: parseFloat(get("WSD") ?? ""),
  };
}

export async function GET(_req: NextRequest) {
  const { date, time } = getBaseDateTime();

  const results = await Promise.allSettled(
    CITIES.map(async (city) => {
      const obs = await fetchCity(city.nx, city.ny, date, time);
      return { ...city, ...obs, baseDate: date, baseTime: time };
    })
  );

  const data = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);

  return NextResponse.json({ data, fetchedAt: new Date().toISOString() });
}
