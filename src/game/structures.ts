// 방재 시설 정의
//
// 게임 모델("수위 상승"):
//  - 호우가 진행되면 물이 '예상 최고 수위'까지 차오른다.
//  - 어떤 타일의 (고도 + 시설로 높인 높이)가 수위보다 낮으면 침수된다.
//  - 시설은 아래 네 가지 방법으로 마을을 지킨다.

export type ToolId = "sandbag" | "levee" | "pump" | "basin" | "remove";

export interface StructureDef {
  id: ToolId;
  name: string;
  emoji: string;
  /** 설치 비용(단위: 만원). 초등 학습자를 위해 화면에는 "○○만원"으로 표기한다. */
  cost: number;
  color: string;
  /** 타일 높이 증가(m) */
  barrier: number;
  /** 타일 물을 강제 배수(고도와 무관하게 마른 상태 유지) */
  pump: boolean;
  /** 마을 전체(지역) 수위 저감(m) */
  basinReduction: number;
  /** 한 줄 설명 */
  short: string;
  /** 학습 포인트 */
  learn: string;
}

export const STRUCTURES: Record<ToolId, StructureDef> = {
  sandbag: {
    id: "sandbag",
    name: "모래주머니",
    emoji: "🟫",
    cost: 20,
    color: "#c9a05a",
    barrier: 1.5,
    pump: false,
    basinReduction: 0,
    short: "타일 높이 +1.5m",
    learn: "수위보다 조금 낮은 집을 값싸게 올려 막아요.",
  },
  levee: {
    id: "levee",
    name: "제방",
    emoji: "🧱",
    cost: 70,
    color: "#8a8f98",
    barrier: 6,
    pump: false,
    basinReduction: 0,
    short: "타일 높이 +6m",
    learn: "많이 낮은 집도 든든하게 물 위로 올려 막아요.",
  },
  pump: {
    id: "pump",
    name: "배수펌프",
    emoji: "🌀",
    cost: 90,
    color: "#4fb3d9",
    barrier: 0,
    pump: true,
    basinReduction: 0,
    short: "타일 물을 빼냄",
    learn: "높이로 못 막는 낮은 곳의 물을 퍼내 마르게 해요.",
  },
  basin: {
    id: "basin",
    name: "빗물 저류조",
    emoji: "🛢️",
    cost: 80,
    color: "#5a7fc9",
    barrier: 0,
    pump: false,
    basinReduction: 1,
    short: "마을 수위 -1m",
    learn: "빗물을 저장해 마을 전체의 물 높이를 낮춰요.",
  },
  remove: {
    id: "remove",
    name: "철거",
    emoji: "⛏️",
    cost: 0,
    color: "#d98a8a",
    barrier: 0,
    pump: false,
    basinReduction: 0,
    short: "시설 철거(50% 환급)",
    learn: "",
  },
};

/** 팔레트에 노출할 도구 순서 */
export const PLACEABLE: ToolId[] = ["sandbag", "levee", "pump", "basin", "remove"];

export function barrierOf(id?: ToolId | null): number {
  return id ? STRUCTURES[id].barrier : 0;
}
export function isPump(id?: ToolId | null): boolean {
  return id ? STRUCTURES[id].pump : false;
}
export function basinReductionOf(id?: ToolId | null): number {
  return id ? STRUCTURES[id].basinReduction : 0;
}
