"use client";

import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: "opening", label: "기상청 또 틀렸다?" },
  { id: "ch1",     label: "1막. 카오스" },
  { id: "ch2",     label: "2막. 관측의 한계" },
  { id: "ch3",     label: "3막. 모델의 한계" },
  { id: "ch4",     label: "4막. 피드백" },
  { id: "ch5",     label: "5막. 앙상블" },
  { id: "ch6",     label: "6막. 날씨 vs 기후" },
  { id: "closing", label: "마무리" },
];

export default function ChapterNav() {
  const [active, setActive] = useState("opening");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 hidden md:flex">
      {CHAPTERS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          title={label}
          className="group flex items-center gap-2 justify-end"
        >
          <span
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-2 py-0.5 rounded"
            style={{
              background: "white",
              color: "var(--ink-sub)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            {label}
          </span>
          <span
            className="block rounded-full transition-all duration-300 shrink-0"
            style={{
              width: active === id ? "10px" : "6px",
              height: active === id ? "10px" : "6px",
              background: active === id ? "var(--blue)" : "#cbd5e1",
              boxShadow: active === id ? "0 0 0 3px rgba(0,102,255,0.2)" : "none",
            }}
          />
        </a>
      ))}
    </nav>
  );
}
