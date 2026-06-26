"use client";

import { LinkPreview } from "~/components/ui/link-preview";

// Swap these for your own photos any time — one preview image per word.
const PREVIEW = {
  life: "https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=440&h=300&fit=crop&auto=format",
  emotion:
    "https://images.unsplash.com/photo-1476180814856-a36609db0493?w=440&h=300&fit=crop&auto=format",
  beauty:
    "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=440&h=300&fit=crop&auto=format",
};

export function VisionStatement() {
  return (
    <p
      style={{
        color: "color-mix(in oklab, var(--text) 80%, transparent)",
        fontSize: "clamp(18px, 2vw, 20px)",
        lineHeight: 1.6,
        maxWidth: 640,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      My vision is to capture the essence of{" "}
      <LinkPreview imageSrc={PREVIEW.life} url="/albums">
        life
      </LinkPreview>
      ,{" "}
      <LinkPreview imageSrc={PREVIEW.emotion} url="/albums">
        emotion
      </LinkPreview>
      , and{" "}
      <LinkPreview imageSrc={PREVIEW.beauty} url="/albums">
        beauty
      </LinkPreview>{" "}
      in every frame. Through my lens, I strive to tell stories that resonate,
      inspire, and connect us to the world and each other.
    </p>
  );
}

export default VisionStatement;
