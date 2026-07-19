import type { Outcome } from "@/lib/dem";

// PLAN.md 5.2.1 (2): 색상만이 아니라 아이콘(안전 ✓ / 경고 △ / 위험 ✕)도 함께 표시해
// 색약 학습자도 구분할 수 있도록 한다. 이모지 대신 SVG로 그린다.

const COLORS: Record<Outcome["signal"], string> = {
  safe: "#43A047",
  warning: "#FB8C00",
  danger: "#E53935",
};

export default function SignalIcon({ signal, size = 16 }: { signal: Outcome["signal"]; size?: number }) {
  const color = COLORS[signal];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={color} />
      {signal === "safe" && (
        <path d="M6.5 12.5l4 4 7-8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {signal === "warning" && (
        <path
          d="M12 6.5v6.2M12 16.6h.01"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {signal === "danger" && (
        <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
