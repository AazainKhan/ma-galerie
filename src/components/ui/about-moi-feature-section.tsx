"use client";

import { useEffect, useRef, useState } from "react";

type Feature = { num: string; title: string; text: string; img: string };

// Image source for each feature is admin-managed (the "About Moi" album in the
// admin panel). These Unsplash photos are only fallbacks when no admin image
// has been uploaded for that slot yet.
const FEATURES: Feature[] = [
  {
    num: "01",
    title: "Behind the lens",
    text: "I picked up a borrowed camera years ago and never handed it back. Photography became how I hold onto the things that pass too quickly.",
    img: "https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=900&h=1100&fit=crop&auto=format",
  },
  {
    num: "02",
    title: "Chasing light",
    text: "Golden hour, blue hour, and the soft grey in between — I follow the light wherever it decides to fall.",
    img: "https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=900&h=1100&fit=crop&auto=format",
  },
  {
    num: "03",
    title: "Moments, not poses",
    text: "The frames I love most are the unguarded ones: a glance, a laugh, the quiet pause between heartbeats.",
    img: "https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=900&h=1100&fit=crop&auto=format",
  },
];

type AdminImage = { src: string; alt?: string | null };

type From = "left" | "right";

function Panel({
  from,
  inView,
  className = "",
  children,
}: {
  from: From;
  inView: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const hidden =
    from === "left" ? "-translate-x-10 opacity-0" : "translate-x-10 opacity-0";
  const shown = "translate-x-0 opacity-100";
  return (
    <div
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,0.7,0.2,1)] ${inView ? shown : hidden} ${className}`}
    >
      {children}
    </div>
  );
}

function Row({ f, i }: { f: Feature; i: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const reversed = i % 2 === 1;

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(row);

    // parallax drift on the image as the row passes through the viewport
    let raf = 0;
    const update = () => {
      const img = imgRef.current;
      if (!img) return;
      const r = row.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      img.style.transform = `translateY(${((0.5 - p) * 70).toFixed(1)}px) scale(1.08)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const textFrom: From = reversed ? "right" : "left";
  const imgFrom: From = reversed ? "left" : "right";

  return (
    <div
      ref={rowRef}
      className="grid items-center gap-8 md:grid-cols-2 md:gap-16"
    >
      <Panel
        from={textFrom}
        inView={inView}
        className={reversed ? "md:order-2" : ""}
      >
        <span className="text-sm tracking-[0.3em] opacity-50">{f.num}</span>
        <h3
          className="mt-2 text-4xl leading-tight font-light sm:text-5xl md:text-6xl"
          style={{ fontFamily: "PPEditorialNew, serif" }}
        >
          {f.title}
        </h3>
        <p className="mt-4 max-w-md text-base opacity-70 sm:text-lg">
          {f.text}
        </p>
      </Panel>

      <Panel
        from={imgFrom}
        inView={inView}
        className={reversed ? "md:order-1" : ""}
      >
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-xl"
          style={{
            background: "color-mix(in oklab, var(--text) 6%, transparent)",
          }}
        >
          <img
            ref={imgRef}
            src={f.img}
            alt={f.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
          />
        </div>
      </Panel>
    </div>
  );
}

export function AboutMoi({ images = [] }: { images?: AdminImage[] }) {
  // Swap in admin-managed images (by slot order); keep the placeholder if a
  // slot hasn't been filled in the admin panel yet.
  const features = FEATURES.map((f, i) => ({
    ...f,
    img: images[i]?.src || f.img,
  }));

  return (
    <section
      className="w-full px-[max(2.5vw,16px)]"
      style={{ color: "var(--text)" }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 text-center sm:mb-24">
          <h2
            style={{
              fontFamily: "PPEditorialNew, serif",
              fontWeight: 200,
              fontSize: "clamp(32px, 8vw, 56px)",
              lineHeight: 1.2,
              opacity: 0.9,
            }}
          >
            About Moi
          </h2>
        </header>

        <div className="flex flex-col gap-24 sm:gap-36">
          {features.map((f, i) => (
            <Row key={f.num} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutMoi;
