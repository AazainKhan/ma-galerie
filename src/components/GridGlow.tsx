"use client";

import { useEffect, useRef } from "react";

// Subtle, theme-aware highlight that makes the page's existing grid lines glow
// a little around the cursor. Only the cursor position is tracked here (written
// to CSS variables with a touch of easing); all visuals live in global.css.
export default function GridGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      el.style.setProperty("--mx", `${x.toFixed(1)}px`);
      el.style.setProperty("--my", `${y.toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };

    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="grid-glow" aria-hidden="true">
      <div className="grid-glow__lines" />
      <span className="grid-glow__spot" />
    </div>
  );
}
