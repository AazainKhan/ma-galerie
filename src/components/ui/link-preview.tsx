"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

type LinkPreviewProps = {
  children: ReactNode;
  imageSrc: string;
  url?: string;
  width?: number;
  height?: number;
};

// Show/hide is driven by pure CSS `:hover` (.lp-trigger / .lp-card in
// global.css) so it works even before hydration. JS only adds the subtle
// cursor-follow via the --lp-dx custom property.
export function LinkPreview({
  children,
  imageSrc,
  url,
  width = 220,
  height = 145,
}: LinkPreviewProps) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / 2;
    e.currentTarget.style.setProperty("--lp-dx", `${dx.toFixed(1)}px`);
  };

  const cardStyle: CSSProperties = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 4,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 12px 45px rgba(0, 0, 0, 0.3)",
  };

  const inner = (
    <span className="lp-trigger" onMouseMove={handleMouseMove}>
      {children}
      <span className="lp-card" aria-hidden="true" style={{ width: width + 8 }}>
        <span style={cardStyle}>
          <img
            src={imageSrc}
            alt=""
            width={width}
            height={height}
            style={{
              display: "block",
              width: "100%",
              height,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        </span>
      </span>
    </span>
  );

  if (url) {
    return (
      <a href={url} style={{ textDecoration: "none", color: "inherit" }}>
        {inner}
      </a>
    );
  }
  return inner;
}

export default LinkPreview;
