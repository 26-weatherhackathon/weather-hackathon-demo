// PLAN.md 6.6 "도입" 시나리오를 화면으로 옮긴 상황 설명. 타이머 없이, 준비되면
// 학습자가 직접 "시작하기"를 눌러 탐색으로 넘어간다.

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-5xl" aria-hidden="true">
        🌧️
      </p>
      <h1 className="text-2xl font-bold">우리 마을 홍수 방재 게임</h1>
      <p className="max-w-md text-base leading-7 text-neutral-700">
        쏴아아— 갑자기 비가 많이 내리기 시작했어요!
        <br />
        우리 마을 여기저기가 물에 잠길 위험에 처했어요.
        <br />
        지형도에서 마을 네 곳을 하나씩 살펴보고, 어떻게 지킬지 결정해 주세요.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow transition hover:bg-blue-700"
      >
        시작하기
      </button>
    </div>
  );
}
