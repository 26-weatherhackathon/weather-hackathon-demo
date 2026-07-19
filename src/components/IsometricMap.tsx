"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  GRID_SIZE,
  generateTerrainGrid,
  type TerrainGrid,
} from "@/utils/terrain";

// ── 렌더링 튜닝 상수 ──────────────────────────────────────────────
const LOGICAL_W = 860; // 논리 캔버스 폭(px)
const LOGICAL_H = 620; // 논리 캔버스 높이(px)
const TILE_W = 26; // 아이소메트릭 타일 폭
const TILE_H = 13; // 아이소메트릭 타일 높이(2:1 비율)
const HEIGHT_SCALE = 0.9; // 고도(m) → 화면 픽셀 변환 배율
const ORIGIN_Y = 70; // 상단 여백
const RAIN_COUNT = 260; // 동시 빗방울 수
const TRAIL = 0.14; // 빗줄기 잔상 길이(초)
const GRAVITY = 220; // 스플래시 중력(스타일라이즈)
const MAX_SPLASH = 480; // 스플래시 입자 상한(성능 보호)
const LIGHTNING_CHANCE = 0.004; // 프레임당 번개 발생 확률
const LIGHTNING_DURATION = 0.32; // 번개 지속 시간(초)

interface RainDrop {
  x: number; // 격자 좌표
  y: number;
  z: number; // 고도(m)
  vx: number;
  vy: number;
  vz: number;
}

interface SplashDroplet {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ground: number;
  life: number; // 남은 수명(초)
}

/** 16진 색상을 factor(0~1)만큼 어둡게 만든 rgb 문자열을 반환한다. */
function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

interface IsometricMapProps {
  className?: string;
}

export default function IsometricMap({ className }: IsometricMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 지형은 고정 시드로 한 번만 생성(프레임마다 재생성하지 않음).
  const grid = useMemo<TerrainGrid>(() => generateTerrainGrid(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = LOGICAL_W;
    const H = LOGICAL_H;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.scale(dpr, dpr);

    const originX = W / 2;

    // 월드 좌표(x, y, z)를 화면 좌표로 투영하는 아이소메트릭 프로젝션
    const project = (x: number, y: number, z: number): [number, number] => {
      const sx = originX + (x - y) * (TILE_W / 2);
      const sy = ORIGIN_Y + (x + y) * (TILE_H / 2) - z * HEIGHT_SCALE;
      return [sx, sy];
    };

    // ── 정적 레이어(폭풍 하늘 + 지형)를 오프스크린 캔버스에 1회 렌더링 ──
    const off = document.createElement("canvas");
    off.width = Math.floor(W * dpr);
    off.height = Math.floor(H * dpr);
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.scale(dpr, dpr);

    // 폭풍 하늘 그래디언트
    const sky = octx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#12203a");
    sky.addColorStop(0.55, "#0d1830");
    sky.addColorStop(1, "#080f20");
    octx.fillStyle = sky;
    octx.fillRect(0, 0, W, H);

    // 지형 타일(고도만큼 돌출된 기둥)을 그린다.
    const drawTile = (x: number, y: number) => {
      const cell = grid[y][x];
      const alt = cell.altitude;
      const color = cell.color;

      const [ax, ay] = project(x, y, alt); // 뒤(back)
      const [bx, by] = project(x + 1, y, alt); // 오른쪽
      const [cx, cy] = project(x + 1, y + 1, alt); // 앞(front)
      const [dx, dy] = project(x, y + 1, alt); // 왼쪽
      const [b0x, b0y] = project(x + 1, y, 0);
      const [c0x, c0y] = project(x + 1, y + 1, 0);
      const [d0x, d0y] = project(x, y + 1, 0);

      // 오른쪽 측면(약간 어둡게)
      const rightFace = shade(color, 0.78);
      octx.fillStyle = rightFace;
      octx.strokeStyle = rightFace;
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(bx, by);
      octx.lineTo(cx, cy);
      octx.lineTo(c0x, c0y);
      octx.lineTo(b0x, b0y);
      octx.closePath();
      octx.fill();
      octx.stroke();

      // 왼쪽 측면(가장 어둡게)
      const leftFace = shade(color, 0.6);
      octx.fillStyle = leftFace;
      octx.strokeStyle = leftFace;
      octx.beginPath();
      octx.moveTo(dx, dy);
      octx.lineTo(cx, cy);
      octx.lineTo(c0x, c0y);
      octx.lineTo(d0x, d0y);
      octx.closePath();
      octx.fill();
      octx.stroke();

      // 윗면(원색)
      octx.fillStyle = color;
      octx.strokeStyle = color;
      octx.beginPath();
      octx.moveTo(ax, ay);
      octx.lineTo(bx, by);
      octx.lineTo(cx, cy);
      octx.lineTo(dx, dy);
      octx.closePath();
      octx.fill();
      octx.stroke();
    };

    // 뎁스 소팅: 우상단(Back)에서 좌하단(Front)으로, 반대각선(x+y) 오름차순 순회
    for (let d = 0; d <= 2 * (GRID_SIZE - 1); d++) {
      const xStart = Math.max(0, d - (GRID_SIZE - 1));
      const xEnd = Math.min(GRID_SIZE - 1, d);
      for (let x = xStart; x <= xEnd; x++) {
        const y = d - x;
        drawTile(x, y);
      }
    }

    // ── 동적 파티클 상태 ──────────────────────────────────────────
    const spawnRain = (drop?: RainDrop): RainDrop => {
      const base: RainDrop = {
        x: Math.random() * GRID_SIZE,
        y: Math.random() * GRID_SIZE,
        z: 90 + Math.random() * 90,
        vx: -2.2, // 우 → 좌(화면 왼쪽으로 드리프트)
        vy: 3.0, // 앞쪽(화면 아래)로 드리프트
        vz: -78, // 낙하
      };
      if (drop) {
        Object.assign(drop, base);
        return drop;
      }
      return base;
    };

    const rain: RainDrop[] = [];
    for (let i = 0; i < RAIN_COUNT; i++) rain.push(spawnRain());
    const splashes: SplashDroplet[] = [];

    const spawnSplash = (x: number, y: number, ground: number) => {
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const hs = 0.5 + Math.random() * 1.1;
        splashes.push({
          x,
          y,
          z: ground,
          vx: Math.cos(ang) * hs,
          vy: Math.sin(ang) * hs,
          vz: 5 + Math.random() * 7,
          ground,
          life: 0.45 + Math.random() * 0.15,
        });
      }
    };

    let lightning = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // 정적 레이어 blit
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, W, H);

      // 비 파티클 업데이트 & 렌더링
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(174, 206, 255, 0.55)";
      for (const p of rain) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        const gx = Math.floor(p.x);
        const gy = Math.floor(p.y);
        let landed = false;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          const ground = grid[gy][gx].altitude;
          if (p.z <= ground) {
            landed = true;
            if (splashes.length < MAX_SPLASH) spawnSplash(p.x, p.y, ground);
          }
        }

        if (
          landed ||
          p.x < 0 ||
          p.x >= GRID_SIZE ||
          p.y < 0 ||
          p.y >= GRID_SIZE ||
          p.z < -4
        ) {
          spawnRain(p);
          continue;
        }

        const [sx, sy] = project(p.x, p.y, p.z);
        const [ex, ey] = project(
          p.x - p.vx * TRAIL,
          p.y - p.vy * TRAIL,
          p.z - p.vz * TRAIL
        );
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      // 스플래시 파티클 업데이트 & 렌더링
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.vz -= GRAVITY * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.life -= dt;

        if (s.life <= 0 || s.z <= s.ground - 0.5) {
          splashes.splice(i, 1);
          continue;
        }
        const [sx, sy] = project(s.x, s.y, s.z);
        const a = Math.max(0, Math.min(1, s.life / 0.5)) * 0.8;
        ctx.fillStyle = `rgba(200, 226, 255, ${a})`;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }

      // 번개 섬광: 간헐적으로 화면 전체가 우윳빛으로 밝아졌다가 서서히 감쇠
      if (lightning <= 0 && Math.random() < LIGHTNING_CHANCE) {
        lightning = LIGHTNING_DURATION;
      }
      if (lightning > 0) {
        lightning -= dt;
        const k = Math.max(0, lightning / LIGHTNING_DURATION);
        const alpha = Math.pow(k, 0.6) * 0.55;
        ctx.fillStyle = `rgba(246, 248, 255, ${alpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}`, display: "block" }}
      aria-label="우리 마을 아이소메트릭 지형 및 호우 시뮬레이션"
      role="img"
    />
  );
}
