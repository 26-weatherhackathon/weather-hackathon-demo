"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { GRID_SIZE, type TerrainGrid, type ProtectedZone } from "@/utils/terrain";
import {
  STRUCTURES,
  barrierOf,
  isPump,
  type ToolId,
} from "@/game/structures";

// ── 렌더링 튜닝 상수 ─────────────────────────────────────────────
const LOGICAL_W = 860;
const LOGICAL_H = 620;
const TILE_W = 26;
const TILE_H = 13;
const HEIGHT_SCALE = 0.9;
const ORIGIN_X = LOGICAL_W / 2;
const ORIGIN_Y = 155;
const RAIN_COUNT = 240;
const TRAIL = 0.14;
const GRAVITY = 220;
const MAX_SPLASH = 460;
const LIGHTNING_CHANCE = 0.004;
const LIGHTNING_DURATION = 0.32;
const FLOOD_THRESHOLD = 0.3;

interface RainDrop {
  x: number;
  y: number;
  z: number;
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
  life: number;
}

/**
 * 월드 좌표(x, y, z=고도m)를 화면 좌표로 투영.
 *
 * 그리드를 (rx,ry)=(GRID_SIZE-y, x)로 치환한 뒤 원래 다이아몬드 공식에 넣어
 * 시계방향 90도 회전한 시점을 만든다. TILE_W/TILE_H 비율은 그대로 유지되므로
 * 다이아몬드가 찌그러지지 않는다(리뷰 피드백: 왜곡 없이 회전).
 */
function project(x: number, y: number, z: number): [number, number] {
  const rx = GRID_SIZE - y;
  const ry = x;
  return [
    ORIGIN_X + (rx - ry) * (TILE_W / 2),
    ORIGIN_Y + (rx + ry) * (TILE_H / 2) - z * HEIGHT_SCALE,
  ];
}

/** 16진 색상을 factor(0~1)만큼 어둡게 */
function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function cross(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

/** 볼록 사각형(정점 순서대로) 내부 점 판정 */
function pointInQuad(px: number, py: number, q: [number, number][]): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = q[i];
    const [x2, y2] = q[(i + 1) % 4];
    const c = cross(x2 - x1, y2 - y1, px - x1, py - y1);
    if (Math.abs(c) < 1e-6) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

interface IsometricMapProps {
  grid: TerrainGrid;
  zone: ProtectedZone;
  placed: Record<string, ToolId>;
  level: number;
  tool: ToolId;
  interactive: boolean;
  onPlace: (x: number, y: number) => void;
}

export default function IsometricMap({
  grid,
  zone,
  placed,
  level,
  tool,
  interactive,
  onPlace,
}: IsometricMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 애니메이션 루프가 최신 상태를 읽도록 ref 로 보관(루프 재시작 방지)
  const placedRef = useRef(placed);
  const levelRef = useRef(level);
  const toolRef = useRef(tool);
  const interactiveRef = useRef(interactive);
  const hoverRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    placedRef.current = placed;
  }, [placed]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(LOGICAL_W * dpr);
    canvas.height = Math.floor(LOGICAL_H * dpr);
    ctx.scale(dpr, dpr);

    // 마을 건물 스프라이트(생성 에셋) 로드
    const houseImg = new Image();
    houseImg.src = "/img/assets/house.png";
    const schoolImg = new Image();
    schoolImg.src = "/img/assets/school.png";

    // ── 정적 레이어(폭풍 하늘 + 지형 + 마을 표식)를 오프스크린에 1회 렌더 ──
    const off = document.createElement("canvas");
    off.width = Math.floor(LOGICAL_W * dpr);
    off.height = Math.floor(LOGICAL_H * dpr);
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.scale(dpr, dpr);

    // 페이지 카드 배경과 동일한 평면 색 → 캔버스 밖과 이어져 끊김 없음
    octx.fillStyle = "#e6f3ff";
    octx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    const drawTile = (x: number, y: number) => {
      const cell = grid[y][x];
      const alt = cell.altitude;
      const color = cell.color;

      const [ax, ay] = project(x, y, alt);
      const [bx, by] = project(x + 1, y, alt);
      const [cx, cy] = project(x + 1, y + 1, alt);
      const [dx, dy] = project(x, y + 1, alt);
      const [b0x, b0y] = project(x + 1, y, 0);
      const [c0x, c0y] = project(x + 1, y + 1, 0);
      const [d0x, d0y] = project(x, y + 1, 0);

      const right = shade(color, 0.88);
      octx.fillStyle = right;
      octx.strokeStyle = right;
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(bx, by);
      octx.lineTo(cx, cy);
      octx.lineTo(c0x, c0y);
      octx.lineTo(b0x, b0y);
      octx.closePath();
      octx.fill();
      octx.stroke();

      const left = shade(color, 0.75);
      octx.fillStyle = left;
      octx.strokeStyle = left;
      octx.beginPath();
      octx.moveTo(dx, dy);
      octx.lineTo(cx, cy);
      octx.lineTo(c0x, c0y);
      octx.lineTo(d0x, d0y);
      octx.closePath();
      octx.fill();
      octx.stroke();

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

    // 뎁스 소팅: 회전 후 화면 깊이는 (x-y) 오름차순 → Back에서 Front로
    for (let k = -(GRID_SIZE - 1); k <= GRID_SIZE - 1; k++) {
      const xStart = Math.max(0, k);
      const xEnd = Math.min(GRID_SIZE - 1, GRID_SIZE - 1 + k);
      for (let x = xStart; x <= xEnd; x++) drawTile(x, x - k);
    }

    // 마을(보호구역) 금색 외곽선 표식
    const outlineTop = (x: number, y: number, c: string, w: number) => {
      const alt = grid[y][x].altitude;
      octx.strokeStyle = c;
      octx.lineWidth = w;
      octx.beginPath();
      const p0 = project(x, y, alt);
      const p1 = project(x + 1, y, alt);
      const p2 = project(x + 1, y + 1, alt);
      const p3 = project(x, y + 1, alt);
      octx.moveTo(p0[0], p0[1]);
      octx.lineTo(p1[0], p1[1]);
      octx.lineTo(p2[0], p2[1]);
      octx.lineTo(p3[0], p3[1]);
      octx.closePath();
      octx.stroke();
    };
    for (const { x, y } of zone.houses) outlineTop(x, y, "rgba(255,214,102,0.9)", 1.5);
    outlineTop(zone.school.x, zone.school.y, "rgba(255,180,80,1)", 2.5);

    // ── 비/스플래시 파티클 초기화 ──
    const spawnRain = (drop?: RainDrop): RainDrop => {
      const base: RainDrop = {
        x: Math.random() * GRID_SIZE,
        y: Math.random() * GRID_SIZE,
        z: 90 + Math.random() * 90,
        vx: -2.2,
        vy: 3.0,
        vz: -78,
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

    // 셀 효과 높이/침수 계산
    const effHeight = (x: number, y: number) => {
      const id = placedRef.current[`${x},${y}`];
      return grid[y][x].altitude + barrierOf(id);
    };
    const waterDepth = (x: number, y: number, lvl: number) => {
      const id = placedRef.current[`${x},${y}`];
      if (id && isPump(id)) return 0;
      return Math.max(0, lvl - effHeight(x, y));
    };

    // 물 색(수심 → 얕음~깊음)
    const waterColor = (depth: number, alpha: number) => {
      const t = Math.max(0, Math.min(1, depth / 6));
      const r = Math.round(90 - 60 * t);
      const g = Math.round(150 - 70 * t);
      const b = Math.round(210 - 50 * t);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    let lightning = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const lvl = levelRef.current;

      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.drawImage(off, 0, 0, LOGICAL_W, LOGICAL_H);

      // ── 상승한 물(호수) 렌더: 뎁스 소팅 순서로 잠긴 셀의 수면을 그린다 ──
      const shimmer = 0.5 + 0.06 * Math.sin(now / 400);
      for (let k = -(GRID_SIZE - 1); k <= GRID_SIZE - 1; k++) {
        const xStart = Math.max(0, k);
        const xEnd = Math.min(GRID_SIZE - 1, GRID_SIZE - 1 + k);
        for (let x = xStart; x <= xEnd; x++) {
          const y = x - k;
          const depth = waterDepth(x, y, lvl);
          if (depth <= 0.05) continue;
          const [ax, ay] = project(x, y, lvl);
          const [bx, by] = project(x + 1, y, lvl);
          const [cx, cy] = project(x + 1, y + 1, lvl);
          const [dx, dy] = project(x, y + 1, lvl);
          ctx.fillStyle = waterColor(depth, shimmer);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.lineTo(cx, cy);
          ctx.lineTo(dx, dy);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ── 설치된 시설 렌더 ──
      const entries = Object.entries(placedRef.current);
      for (const [key, id] of entries) {
        const [sx, sy] = key.split(",").map(Number);
        if (Number.isNaN(sx) || Number.isNaN(sy)) continue;
        const def = STRUCTURES[id];
        const z = grid[sy][sx].altitude + def.barrier;
        const [px, py] = project(sx + 0.5, sy + 0.5, z);
        // 받침
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(px, py + 3, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        if (id === "levee") {
          // 제방은 벽 블록으로
          ctx.fillStyle = def.color;
          ctx.fillRect(px - 8, py - 10, 16, 12);
          ctx.strokeStyle = "rgba(0,0,0,0.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(px - 8, py - 10, 16, 12);
        }
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.emoji, px, py - 4);
      }

      // ── 마을 집/학교 마커(침수 시 물 위로 떠서 표시 + 상태 점) ──
      const drawMarker = (x: number, y: number, emoji: string, big: boolean) => {
        const id = placedRef.current[`${x},${y}`];
        const pumped = id && isPump(id);
        const top = Math.max(effHeight(x, y), pumped ? effHeight(x, y) : lvl);
        const [px, py] = project(x + 0.5, y + 0.5, top);
        const depth = waterDepth(x, y, lvl);
        const flooded = depth >= FLOOD_THRESHOLD;
        const sprite = big ? schoolImg : houseImg;
        if (sprite.complete && sprite.naturalWidth > 0) {
          const w = big ? 32 : 23;
          const h = (w * sprite.naturalHeight) / sprite.naturalWidth;
          ctx.drawImage(sprite, px - w / 2, py - h + 4, w, h);
        } else {
          ctx.font = big ? "18px sans-serif" : "14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(emoji, px, py - 8);
        }
        // 상태 점(안전=초록 / 침수=빨강)
        ctx.beginPath();
        ctx.arc(px, py + 5, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = flooded ? "#E53935" : "#43A047";
        ctx.fill();
      };
      for (const { x, y } of zone.houses) drawMarker(x, y, "🏠", false);
      drawMarker(zone.school.x, zone.school.y, "🏫", true);

      // ── 비 파티클 ──
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(90, 140, 200, 0.55)";
      for (const p of rain) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const gx = Math.floor(p.x);
        const gy = Math.floor(p.y);
        let landed = false;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          const surface = Math.max(grid[gy][gx].altitude, lvl);
          if (p.z <= surface) {
            landed = true;
            if (splashes.length < MAX_SPLASH) spawnSplash(p.x, p.y, surface);
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

      // ── 스플래시 ──
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
        ctx.fillStyle = `rgba(120, 165, 215, ${a})`;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }

      // ── 호버 하이라이트(설치 가능 상태) ──
      const hov = hoverRef.current;
      if (hov && interactiveRef.current) {
        const [hx, hy] = hov;
        const alt = grid[hy][hx].altitude;
        const [ax, ay] = project(hx, hy, alt);
        const [bx, by] = project(hx + 1, hy, alt);
        const [cx, cy] = project(hx + 1, hy + 1, alt);
        const [dx, dy] = project(hx, hy + 1, alt);
        const occupied = !!placedRef.current[`${hx},${hy}`];
        const isRemove = toolRef.current === "remove";
        const invalid = alt < 6 || (occupied && !isRemove) || (isRemove && !occupied);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.lineTo(dx, dy);
        ctx.closePath();
        ctx.fillStyle = invalid
          ? "rgba(255,90,90,0.28)"
          : "rgba(255,255,255,0.32)";
        ctx.fill();
        ctx.strokeStyle = invalid ? "#ff6a6a" : "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── 번개 섬광 ──
      if (lightning <= 0 && Math.random() < LIGHTNING_CHANCE) {
        lightning = LIGHTNING_DURATION;
      }
      if (lightning > 0) {
        lightning -= dt;
        const k = Math.max(0, lightning / LIGHTNING_DURATION);
        ctx.fillStyle = `rgba(246, 248, 255, ${Math.pow(k, 0.6) * 0.5})`;
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [grid, zone]);

  // ── 마우스 → 타일 픽킹 ──
  const toLogical = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
    const py = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    return [px, py] as [number, number];
  };
  const pickTile = (px: number, py: number): [number, number] | null => {
    let best: [number, number] | null = null;
    let bestScore = -1;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const alt = grid[y][x].altitude;
        const q: [number, number][] = [
          project(x, y, alt),
          project(x + 1, y, alt),
          project(x + 1, y + 1, alt),
          project(x, y + 1, alt),
        ];
        if (pointInQuad(px, py, q)) {
          const sc = x - y;
          if (sc > bestScore) {
            bestScore = sc;
            best = [x, y];
          }
        }
      }
    }
    return best;
  };

  const handleMove = (e: MouseEvent) => {
    if (!interactive) return;
    const loc = toLogical(e);
    if (!loc) return;
    hoverRef.current = pickTile(loc[0], loc[1]);
  };
  const handleLeave = () => {
    hoverRef.current = null;
  };
  const handleClick = (e: MouseEvent) => {
    if (!interactive) return;
    const loc = toLogical(e);
    if (!loc) return;
    const t = pickTile(loc[0], loc[1]);
    if (t) onPlace(t[0], t[1]);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={{
        width: "100%",
        aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}`,
        display: "block",
        cursor: interactive ? "pointer" : "default",
      }}
      aria-label="우리 마을 아이소메트릭 지형 및 홍수 방재 게임 보드"
      role="img"
    />
  );
}
