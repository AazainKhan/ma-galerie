"use client";

import { LinkPreview } from "~/components/ui/link-preview";

type Word = { text: string; img: string | null };

const DEFAULT_LEAD = "My vision is to capture the essence of";
const DEFAULT_WORDS: Word[] = [
  {
    text: "life",
    img: "https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=440&h=300&fit=crop&auto=format",
  },
  {
    text: "emotion",
    img: "https://images.unsplash.com/photo-1476180814856-a36609db0493?w=440&h=300&fit=crop&auto=format",
  },
  {
    text: "beauty",
    img: "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=440&h=300&fit=crop&auto=format",
  },
];
const DEFAULT_CLOSE =
  "in every frame. Through my lens, I strive to tell stories that resonate, inspire, and connect us to the world and each other.";

export function VisionStatement({
  lead = DEFAULT_LEAD,
  words = DEFAULT_WORDS,
  close = DEFAULT_CLOSE,
}: {
  lead?: string;
  words?: Word[];
  close?: string;
}) {
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
      {lead}{" "}
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`}>
          <LinkPreview imageSrc={w.img ?? ""} url="/albums">
            {w.text}
          </LinkPreview>
          {i < words.length - 2
            ? ", "
            : i === words.length - 2
              ? ", and "
              : " "}
        </span>
      ))}
      {close}
    </p>
  );
}

export default VisionStatement;
