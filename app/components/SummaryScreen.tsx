import type { Outcome } from "@/lib/dem";
import SignalIcon from "./SignalIcon";

type SpotResult = { label: string; choiceLabel: string; outcome: Outcome };

export default function SummaryScreen({
  results,
  onRestart,
}: {
  results: SpotResult[];
  onRestart: () => void;
}) {
  const safeCount = results.filter((r) => r.outcome.signal === "safe").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <h2 className="text-xl font-bold">최종 결과</h2>
          <p className="mt-1 text-sm text-neutral-600">
            마을 {results.length}곳 중 {safeCount}곳을 안전하게 지켰어요!
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {results.map((r) => (
            <li
              key={r.label}
              className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200"
            >
              <SignalIcon signal={r.outcome.signal} size={22} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {r.label} — {r.choiceLabel}
                </span>
                <span className="text-xs text-neutral-600">{r.outcome.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow transition hover:bg-blue-700"
        >
          처음부터 다시하기
        </button>
      </div>
    </div>
  );
}
