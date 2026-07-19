import { TERRAIN_COLORS } from "@/lib/dem";
import SignalIcon from "./SignalIcon";

// 지도 하단 범례: 지형 고도 색상(자연색)과 결과 신호 아이콘(신호색)을 분리해서 보여준다.
// PLAN.md 5.2.1 색상 체계 그대로.

export default function Legend() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-xs text-neutral-700 ring-1 ring-neutral-200">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {Object.values(TERRAIN_COLORS).map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm ring-1 ring-black/10"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5">
          <SignalIcon signal="safe" size={14} />
          안전
        </span>
        <span className="flex items-center gap-1.5">
          <SignalIcon signal="warning" size={14} />
          경고 (부분 대비)
        </span>
        <span className="flex items-center gap-1.5">
          <SignalIcon signal="danger" size={14} />
          위험 (침수)
        </span>
      </div>
    </div>
  );
}
