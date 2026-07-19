# /// script
# requires-python = ">=3.10"
# dependencies = ["rasterio>=1.3", "numpy>=1.24"]
# ///
"""GeoTIFF DEM을 게임용 JSON 고도 격자로 변환한다.

동작구 영역만 잘라내(crop) 정사각 격자로 리샘플링한 뒤, 행별 고도값
2차원 배열과 메타데이터를 JSON으로 출력한다. 출력 격자는 게임의
① 고도→색상 ② D8 물 흐름 ③ 침수 판정 함수가 그대로 소비한다(PLAN.md 4.1).

실행:
    uv run scripts/dem_to_grid.py

5m DEM(국토지리정보원)으로 교체할 때도 --input만 바꾸면 된다.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.windows import from_bounds

# 동작구 행정경계 대략 bounding box (EPSG:4326). 실제 경계보다 약간 넉넉하게 잡아
# 마을·하천 문맥이 잘리지 않도록 한다.
DONGJAK_BBOX = (126.902, 37.468, 126.988, 37.519)  # (W, S, E, N)


def dem_to_grid(input_path: Path, size: int, bbox: tuple[float, float, float, float]):
    west, south, east, north = bbox
    with rasterio.open(input_path) as ds:
        window = from_bounds(west, south, east, north, transform=ds.transform)
        # size×size 정사각 격자로 이중선형 리샘플링(다운샘플).
        data = ds.read(
            1,
            window=window,
            out_shape=(size, size),
            resampling=Resampling.bilinear,
        ).astype("float64")
        nodata = ds.nodata

    # nodata / 바다 sentinel 정리: 결측은 주변 최소값 대신 0(해수면)으로 본다.
    if nodata is not None:
        data[data == nodata] = np.nan
    data[data < -100] = np.nan  # 비정상 음수 sentinel
    if np.isnan(data).any():
        fill = np.nanmin(data) if np.isfinite(np.nanmin(data)) else 0.0
        data = np.where(np.isnan(data), fill, data)

    grid = np.round(data, 1)
    return grid


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="DEM GeoTIFF → JSON 고도 격자")
    parser.add_argument("--input", type=Path, default=root / "data/dem/dongjak_cop30.tif")
    parser.add_argument("--output", type=Path, default=root / "data/dem/dongjak_grid.json")
    parser.add_argument("--size", type=int, default=64, help="정사각 격자 한 변의 셀 수")
    args = parser.parse_args()

    grid = dem_to_grid(args.input, args.size, DONGJAK_BBOX)

    payload = {
        "source": "Copernicus GLO-30 DEM (COP-DEM_GLO-30-DGED), ESA — 30m",
        "note": "동작구 영역 크롭 후 정사각 격자로 이중선형 리샘플링. 5m DEM 교체 시 재생성.",
        "crs": "EPSG:4326",
        "bbox": {"west": DONGJAK_BBOX[0], "south": DONGJAK_BBOX[1],
                 "east": DONGJAK_BBOX[2], "north": DONGJAK_BBOX[3]},
        "size": args.size,
        "minElevation": float(grid.min()),
        "maxElevation": float(grid.max()),
        # grid[r][c]: r=0이 최북단(north), c=0이 최서단(west)
        "grid": grid.tolist(),
    }

    args.output.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {args.output} ({args.size}x{args.size}, "
          f"elev {payload['minElevation']}~{payload['maxElevation']}m)")


if __name__ == "__main__":
    main()
