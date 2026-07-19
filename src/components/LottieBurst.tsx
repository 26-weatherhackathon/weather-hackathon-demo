"use client";

import { useEffect, useRef } from "react";

// window.lottie (lottie-web, layout에서 CDN 로드)로 1회 재생하는 반짝이 버스트.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lottie?: any;
  }
}

export default function LottieBurst({ path }: { path: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let anim: { destroy: () => void } | null = null;
    let tries = 0;
    const timer = setInterval(() => {
      if (window.lottie) {
        clearInterval(timer);
        el.innerHTML = "";
        anim = window.lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: false,
          autoplay: true,
          path,
        });
      } else if (++tries > 40) {
        clearInterval(timer);
      }
    }, 50);
    return () => {
      clearInterval(timer);
      anim?.destroy();
    };
  }, [path]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    />
  );
}
