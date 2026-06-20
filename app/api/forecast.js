// Vercel serverless function — 기상청 단기예보 프록시
// 환경변수 KMA_API_KEY 에 serviceKey 저장

const CITIES = {
  seoul:   { nx: 60,  ny: 127, name: '서울' },
  busan:   { nx: 98,  ny: 76,  name: '부산' },
  daegu:   { nx: 89,  ny: 90,  name: '대구' },
  incheon: { nx: 55,  ny: 124, name: '인천' },
  gwangju: { nx: 58,  ny: 74,  name: '광주' },
  jeju:    { nx: 52,  ny: 38,  name: '제주' },
};

function getBaseTime() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = kst.getUTCHours();
  const m = kst.getUTCMinutes();

  // 발표 시각: 02,05,08,11,14,17,20,23시 (각 10분 후 제공)
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseH = 23;
  let useYesterday = false;

  const available = slots.filter(s => h > s || (h === s && m >= 10));
  if (available.length > 0) {
    baseH = available[available.length - 1];
  } else {
    baseH = 23;
    useYesterday = true;
  }

  let date = new Date(kst);
  if (useYesterday) date.setUTCDate(date.getUTCDate() - 1);

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(baseH).padStart(2, '0');

  return { date: `${yyyy}${mm}${dd}`, time: `${hh}00` };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { city = 'seoul' } = req.query;
  const info = CITIES[city] || CITIES.seoul;
  const serviceKey = process.env.KMA_API_KEY;

  if (!serviceKey) {
    return res.status(500).json({ error: 'KMA_API_KEY 환경변수가 없습니다.' });
  }

  const { date, time } = getBaseTime();

  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${encodeURIComponent(serviceKey)}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${date}&base_time=${time}` +
    `&nx=${info.nx}&ny=${info.ny}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const items = data?.response?.body?.items?.item;

    if (!items) {
      return res.status(502).json({ error: '기상청 응답 오류', detail: data });
    }

    // 강수확률(POP)만 추출 후 날짜별 집계
    const pop = items
      .filter(i => i.category === 'POP')
      .map(i => ({ date: i.fcstDate, time: i.fcstTime, pop: Number(i.fcstValue) }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const byDay = {};
    for (const item of pop) {
      if (!byDay[item.date]) byDay[item.date] = [];
      byDay[item.date].push(item.pop);
    }

    const daily = Object.entries(byDay).map(([d, pops]) => ({
      date: d,
      maxPop: Math.max(...pops),
      avgPop: Math.round(pops.reduce((a, b) => a + b, 0) / pops.length),
    }));

    res.json({ city: info.name, baseDate: date, baseTime: time, daily, hourly: pop });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
