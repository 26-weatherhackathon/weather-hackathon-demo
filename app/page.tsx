"use client";

import { useMemo, useState } from "react";
import TerrainView from "./components/TerrainView";
import SignalIcon from "./components/SignalIcon";
import {
  createMockDem,
  computeD8Flow,
  findHighestCell,
  applyProtectionElevation,
  isFlooded,
  describeOutcome,
  type Protection,
} from "@/lib/dem";

const RAINFALL_MM = 90; // "비가 많이 와요" 상황에 해당하는 내부 강우량(mm)

const CHOICES: { protection: Protection; label: string }[] = [
  { protection: "raise", label: "높이 올리기" },
  { protection: "sandbag", label: "모래주머니" },
  { protection: "shelter", label: "대피소" },
  { protection: "evacuate", label: "모두 피난" },
];

export default function Home() {
  const grid = useMemo(() => createMockDem(), []);
  const flow = useMemo(() => computeD8Flow(grid), [grid]);
  const highest = useMemo(() => findHighestCell(grid), [grid]);

  const [showTerrain, setShowTerrain] = useState(true);
  const [showFlow, setShowFlow] = useState(false);
  const [showRain, setShowRain] = useState(false);

  const [protections, setProtections] = useState<Record<string, Protection>>({});
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ key: string; protection: Protection } | null>(
    null
  );

  function handleTileClick(row: number, col: number) {
    setSelected({ row, col });
    setLastOutcome(null);
  }

  function handleChoose(protection: Protection) {
    if (!selected) return;
    const key = `${selected.row}-${selected.col}`;
    setProtections((prev) => ({ ...prev, [key]: protection }));
    setShowRain(true); // 선택 즉시 결과를 볼 수 있도록 강우 시뮬을 켠다
    setLastOutcome({ key, protection });
    setSelected(null);
  }

  function handleRetry() {
    if (!lastOutcome) return;
    setProtections((prev) => {
      const next = { ...prev };
      delete next[lastOutcome.key];
      return next;
    });
    setLastOutcome(null);
  }

  const outcome = useMemo(() => {
    if (!lastOutcome) return null;
    const [row, col] = lastOutcome.key.split("-").map(Number);
    const effective = applyProtectionElevation(grid[row][col], lastOutcome.protection);
    const flooded = isFlooded(effective, RAINFALL_MM);
    return describeOutcome(lastOutcome.protection, flooded);
  }, [lastOutcome, grid]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold">우리 마을 홍수 방재 게임</h1>
        <p className="mt-2 text-sm text-neutral-600">
          버튼을 눌러 우리 마을 지형을 살펴보고, 지역을 눌러 마을을 지켜보세요.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        <ToggleButton label="지형도 보기" active={showTerrain} onClick={() => setShowTerrain((v) => !v)} />
        <ToggleButton label="물 흐름 보기" active={showFlow} onClick={() => setShowFlow((v) => !v)} />
        <ToggleButton label="비가 오면?" active={showRain} onClick={() => setShowRain((v) => !v)} />
      </div>

      <TerrainView
        grid={grid}
        flow={flow}
        highest={highest}
        showTerrain={showTerrain}
        showFlow={showFlow}
        showRain={showRain}
        rainfallMm={RAINFALL_MM}
        protections={protections}
        selectedKey={selected ? `${selected.row}-${selected.col}` : null}
        onTileClick={handleTileClick}
      />

      {selected && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow ring-1 ring-neutral-200">
          <p className="text-base font-semibold">이 지역을 어떻게 지킬까요?</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CHOICES.map((choice) => (
              <button
                key={choice.protection}
                type="button"
                onClick={() => handleChoose(choice.protection)}
                className="rounded-full bg-neutral-900 px-5 py-3 text-base font-semibold text-white shadow transition hover:bg-neutral-700"
              >
                {choice.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs text-neutral-500 underline"
          >
            취소
          </button>
        </div>
      )}

      {outcome && (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow ring-1 ring-neutral-200">
          <div className="flex items-center gap-2">
            <SignalIcon signal={outcome.signal} size={20} />
            <p className="text-base font-medium">{outcome.text}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            다시 해보기
          </button>
        </div>
      )}

      <p className="max-w-md text-center text-xs text-neutral-500">
        갈색·연두는 높은 곳, 초록·파랑은 낮은 곳이에요. 낮은 곳(파랑)이 먼저 물에 잠겨요.
        지형도에서 지역을 눌러 마을을 지켜보세요.
      </p>
    </main>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-5 py-3 text-base font-semibold shadow transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
