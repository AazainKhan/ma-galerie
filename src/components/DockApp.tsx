// Dependencies: framer-motion, tailwindcss, @radix-ui/react-tooltip

"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { MotionValue } from "framer-motion";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Dark mode ────────────────────────────────────────────────
function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Chess engine ─────────────────────────────────────────────
const PIECE_VAL: Record<string, number> = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000,
  p: -100,
  n: -320,
  b: -330,
  r: -500,
  q: -900,
  k: -20000,
};
const PST_P = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
const PST_N = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];
const PST_B = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];
const PST_K = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];
const inB = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const isW = (p: string) => p != "" && p === p.toUpperCase();
const isBlk = (p: string) => p != "" && p === p.toLowerCase();
function cMoves(board: string[][], r: number, c: number): [number, number][] {
  const p = board[r][c];
  if (!p) return [];
  const w = isW(p),
    lp = p.toLowerCase(),
    ms: [number, number][] = [];
  const ok = (nr: number, nc: number) =>
    inB(nr, nc) &&
    (!board[nr][nc] || (w ? isBlk(board[nr][nc]) : isW(board[nr][nc])));
  if (lp === "p") {
    const d = w ? -1 : 1,
      sr = w ? 6 : 1;
    if (inB(r + d, c) && !board[r + d][c]) {
      ms.push([r + d, c]);
      if (r === sr && !board[r + 2 * d][c]) ms.push([r + 2 * d, c]);
    }
    for (const dc of [-1, 1])
      if (inB(r + d, c + dc) && board[r + d][c + dc] && ok(r + d, c + dc))
        ms.push([r + d, c + dc]);
  }
  if (lp === "n")
    for (const [dr, dc] of [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ])
      if (ok(r + dr, c + dc)) ms.push([r + dr, c + dc]);
  if (lp === "k")
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ])
      if (ok(r + dr, c + dc)) ms.push([r + dr, c + dc]);
  const slide = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let [nr, nc] = [r + dr, c + dc];
      while (inB(nr, nc)) {
        const t = board[nr][nc];
        if (!t) {
          ms.push([nr, nc]);
          nr += dr;
          nc += dc;
        } else {
          if (w ? isBlk(t) : isW(t)) ms.push([nr, nc]);
          break;
        }
      }
    }
  };
  if (lp === "b" || lp === "q")
    slide([
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  if (lp === "r" || lp === "q")
    slide([
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  return ms;
}
function cApply(
  board: string[][],
  r: number,
  c: number,
  nr: number,
  nc: number,
): string[][] {
  const nb = board.map((row) => [...row]);
  nb[nr][nc] = nb[r][c];
  nb[r][c] = "";
  if (nb[nr][nc] === "P" && nr === 0) nb[nr][nc] = "Q";
  if (nb[nr][nc] === "p" && nr === 7) nb[nr][nc] = "q";
  return nb;
}
function cAllMoves(
  board: string[][],
  white: boolean,
): [number, number, number, number][] {
  const all: [number, number, number, number][] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || white !== isW(p)) continue;
      for (const [nr, nc] of cMoves(board, r, c)) all.push([r, c, nr, nc]);
    }
  return all;
}
function cEval(board: string[][]) {
  let s = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const lp = p.toUpperCase();
      const w = isW(p);
      const v = PIECE_VAL[p] || 0;
      let b = 0;
      if (lp === "P") b = w ? PST_P[r][c] : -PST_P[7 - r][c];
      else if (lp === "N") b = w ? PST_N[r][c] : -PST_N[7 - r][c];
      else if (lp === "B") b = w ? PST_B[r][c] : -PST_B[7 - r][c];
      else if (lp === "K") b = w ? PST_K[r][c] : -PST_K[7 - r][c];
      s += v + b;
    }
  return s;
}
function cAB(
  board: string[][],
  depth: number,
  alpha: number,
  beta: number,
  white: boolean,
): number {
  if (depth === 0) return cEval(board);
  const moves = cAllMoves(board, white);
  if (!moves.length) return 0;
  if (white) {
    let best = -Infinity;
    for (const [r, c, nr, nc] of moves) {
      const nb = cApply(board, r, c, nr, nc);
      if (!nb.some((row) => row.includes("k"))) return 50000;
      const s = cAB(nb, depth - 1, alpha, beta, false);
      best = Math.max(best, s);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [r, c, nr, nc] of moves) {
      const nb = cApply(board, r, c, nr, nc);
      if (!nb.some((row) => row.includes("K"))) return -50000;
      const s = cAB(nb, depth - 1, alpha, beta, true);
      best = Math.min(best, s);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}
function cBestMove(board: string[][]): [number, number, number, number] | null {
  const moves = cAllMoves(board, false);
  if (!moves.length) return null;
  let best = Infinity,
    bm = moves[0];
  for (const [r, c, nr, nc] of moves) {
    const nb = cApply(board, r, c, nr, nc);
    if (!nb.some((row) => row.includes("K"))) return [r, c, nr, nc];
    const s = cAB(nb, 2, -Infinity, Infinity, true);
    if (s < best) {
      best = s;
      bm = [r, c, nr, nc];
    }
  }
  return bm;
}

// ─── Constants ────────────────────────────────────────────────
const SCALE = 1.6;
const DISTANCE = 110;
const NUDGE = 40;
const SPRING = { mass: 0.1, stiffness: 170, damping: 12 };

// ─── Types ────────────────────────────────────────────────────
type AppConfig = {
  id: string;
  label: string;
  iconSrc: string;
  href: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  Window: React.FC;
};

type WindowState = {
  id: string;
  app: AppConfig;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
};

type CtxMenuState = { appId: string; x: number; y: number } | null;

// ─── Chess data ───────────────────────────────────────────────
const INITIAL_CHESS_BOARD = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];
const CHESS_PIECES: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

// ─── App Windows ─────────────────────────────────────────────

function OpenBar({ url, href }: { url: string; href: string }) {
  const dark = useDarkMode();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        flexShrink: 0,
        background: dark ? "#2a2a2a" : "#ebebeb",
        borderBottom: `1px solid ${dark ? "#444" : "#d0d0d0"}`,
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "2px 10px",
          borderRadius: 6,
          fontSize: 11,
          background: dark ? "#1a1a1a" : "#fff",
          border: `1px solid ${dark ? "#555" : "#d0d0d0"}`,
          color: dark ? "#aaa" : "#555",
          fontFamily: "ui-monospace,monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {url}
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "3px 10px",
          borderRadius: 5,
          fontSize: 11,
          fontWeight: 700,
          background: "#0095f6",
          color: "#fff",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        Open ↗
      </a>
    </div>
  );
}

const INSTAGRAM_PROFILE_EMBED = `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/refractiveaazain/?utm_source=ig_embed&utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/refractiveaazain/?utm_source=ig_embed&utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"> <div style=" display: flex; flex-direction: row; align-items: center;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div></div></div><div style="padding: 19% 0;"></div> <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top: 8px;"> <div style=" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">View this profile on Instagram</div></div><div style="padding: 12.5% 0;"></div> <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;"><div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div> <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div></div><div style="margin-left: 8px;"> <div style=" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div> <div style=" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left: auto;"> <div style=" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div> <div style=" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div> <div style=" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div></div></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div></div></a></div></blockquote>`;

function InstagramApp() {
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.getElementById("ig-embed-js")) {
      const s = document.createElement("script");
      s.id = "ig-embed-js";
      s.src = "//platform.instagram.com/en_US/embeds.js";
      s.async = true;
      document.body.appendChild(s);
    }
    if (!embedRef.current) return;
    embedRef.current.innerHTML = INSTAGRAM_PROFILE_EMBED;
    let timer: ReturnType<typeof setTimeout>;
    const tryProcess = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      } else {
        timer = setTimeout(tryProcess, 200);
      }
    };
    timer = setTimeout(tryProcess, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <OpenBar
        url="instagram.com/refractiveaazain"
        href="https://www.instagram.com/refractiveaazain"
      />
      <div
        ref={embedRef}
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "8px",
        }}
      />
    </div>
  );
}

function LinkedInApp() {
  const dark = useDarkMode();

  useEffect(() => {
    if (!document.getElementById("li-badge-js")) {
      const s = document.createElement("script");
      s.id = "li-badge-js";
      s.src = "https://platform.linkedin.com/badges/js/profile.js";
      s.async = true;
      document.body.appendChild(s);
    } else {
      (window as any).LIRenderAll?.();
    }
  }, [dark]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: dark ? "#1b1f23" : "#f3f2ef",
      }}
    >
      <OpenBar
        url="linkedin.com/in/aazainkhan"
        href="https://www.linkedin.com/in/aazainkhan"
      />
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 16px",
          gap: 16,
        }}
      >
        <div
          key={dark ? "dark" : "light"}
          className="badge-base LI-profile-badge"
          data-locale="en_US"
          data-size="large"
          data-theme={dark ? "dark" : "light"}
          data-type="VERTICAL"
          data-vanity="aazainkhan"
          data-version="v1"
        >
          <a
            className="badge-base__link LI-simple-link"
            href="https://www.linkedin.com/in/aazainkhan?trk=profile-badge"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: "#0a66c2",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Aazain Khan
          </a>
        </div>
      </div>
    </div>
  );
}

type GHUser = {
  avatar_url: string;
  name: string;
  login: string;
  bio: string;
  followers: number;
  following: number;
  public_repos: number;
  location?: string;
};
type GHRepo = {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  fork: boolean;
};
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Rust: "#dea584",
  Go: "#00ADD8",
  Vue: "#41b883",
  Astro: "#ff5a03",
  SCSS: "#c6538c",
  Shell: "#89e051",
};

function GitHubApp() {
  const dark = useDarkMode();
  const [user, setUser] = useState<GHUser | null>(null);
  const [repos, setRepos] = useState<GHRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("https://api.github.com/users/AazainKhan").then((r) => r.json()),
      fetch(
        "https://api.github.com/users/AazainKhan/repos?sort=updated&per_page=8&type=owner",
      ).then((r) => r.json()),
    ])
      .then(([u, r]) => {
        if (u.login) setUser(u);
        if (Array.isArray(r))
          setRepos(r.filter((x: GHRepo) => !x.fork).slice(0, 6));
        setLoading(false);
      })
      .catch(() => {
        setErr(true);
        setLoading(false);
      });
  }, []);

  const bg = dark ? "#0d1117" : "#fff";
  const text = dark ? "#c9d1d9" : "#24292f";
  const sub = dark ? "#8b949e" : "#57606a";
  const cardBg = dark ? "#161b22" : "#f6f8fa";
  const cardBorder = dark ? "#21262d" : "#d0d7de";

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: bg,
      }}
    >
      <OpenBar
        url="github.com/AazainKhan"
        href="https://github.com/AazainKhan"
      />
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          color: text,
          fontFamily: "-apple-system,sans-serif",
        }}
      >
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: sub,
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        )}
        {err && !user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: sub,
              fontSize: 13,
            }}
          >
            Couldn't load profile
          </div>
        )}
        {user && (
          <>
            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: `1px solid ${cardBorder}`,
              }}
            >
              <img
                src={user.avatar_url}
                alt=""
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  border: `1px solid ${cardBorder}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>
                  {user.name || user.login}
                </div>
                <div style={{ fontSize: 13, color: sub, marginTop: 1 }}>
                  {user.login}
                </div>
                {user.bio && (
                  <div
                    style={{
                      fontSize: 12,
                      color: sub,
                      marginTop: 5,
                      lineHeight: 1.5,
                    }}
                  >
                    {user.bio}
                  </div>
                )}
                {user.location && (
                  <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>
                    📍 {user.location}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 7,
                    fontSize: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { l: "followers", v: user.followers },
                    { l: "following", v: user.following },
                    { l: "repos", v: user.public_repos },
                  ].map(({ l, v }) => (
                    <span key={l}>
                      <b style={{ color: text }}>{v}</b>{" "}
                      <span style={{ color: sub }}>{l}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Repositories
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 8,
              }}
            >
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: 10,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 6,
                    textDecoration: "none",
                    background: cardBg,
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: dark ? "#58a6ff" : "#0969da",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {repo.name}
                  </div>
                  {repo.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: sub,
                        marginTop: 3,
                        lineHeight: 1.4,
                        maxHeight: 28,
                        overflow: "hidden",
                      }}
                    >
                      {repo.description}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 7,
                      fontSize: 11,
                      color: sub,
                      alignItems: "center",
                    }}
                  >
                    {repo.language && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: LANG_COLORS[repo.language] ?? "#8b949e",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span>⭐ {repo.stargazers_count}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SPOTIFY_PLAYLISTS = [
  { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Today's Top Hits" },
  { id: "37i9dQZF1DX0XUsuxWHRQd", name: "RapCaviar" },
  { id: "37i9dQZF1DX4JAvHpjipBk", name: "New Music Friday" },
  { id: "37i9dQZF1DXdPFx3gEr3Ls", name: "Chill Hits" },
];

function SpotifyApp() {
  const [idx, setIdx] = useState(0);
  const pl = SPOTIFY_PLAYLISTS[idx];
  // Always dark: avoids white-corner flash while useDarkMode() initialises, and Spotify is designed dark
  const src = `https://open.spotify.com/embed/playlist/${pl.id}?utm_source=generator&theme=0&border_radius=0`;
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "#121212",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "7px 10px",
          flexShrink: 0,
          background: "#121212",
          borderBottom: "1px solid #282828",
          overflowX: "auto",
        }}
      >
        {SPOTIFY_PLAYLISTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIdx(i)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              background: i === idx ? "#1db954" : "rgba(255,255,255,0.1)",
              color: i === idx ? "#000" : "#fff",
              transition: "background 0.15s",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "#121212",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <iframe
          key={src}
          src={src}
          frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{
            display: "block",
            border: "none",
            flex: 1,
            minHeight: 0,
            width: "100%",
            colorScheme: "dark",
            backgroundColor: "#121212",
          }}
        />
      </div>
    </div>
  );
}

function TextEditApp() {
  const dark = useDarkMode();
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const bg = dark ? "#1e1e1e" : "#fff";
  const toolBg = dark ? "#2d2d2d" : "#f4f4f4";
  const toolBorder = dark ? "#444" : "#ddd";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: bg,
      }}
    >
      <div
        className="textedit-toolbar"
        style={{ background: toolBg, borderBottom: `1px solid ${toolBorder}` }}
      >
        <span
          style={{
            fontSize: 11,
            color: dark ? "#999" : "#666",
            fontFamily: "-apple-system,sans-serif",
          }}
        >
          New Document
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10,
            color: dark ? "#666" : "#aaa",
            fontFamily: "-apple-system,sans-serif",
          }}
        >
          {words} word{words !== 1 ? "s" : ""} · {text.length} chars
        </span>
      </div>
      <textarea
        style={{
          flex: 1,
          padding: "20px 24px",
          fontFamily: 'Georgia,"Times New Roman",serif',
          fontSize: 14,
          lineHeight: 1.75,
          border: "none",
          outline: "none",
          resize: "none",
          color: dark ? "#d4d4d4" : "#1a1a1a",
          background: bg,
          caretColor: dark ? "#fff" : "#000",
        }}
        placeholder="Start typing…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}

function ChessApp() {
  const dark = useDarkMode();
  const [board, setBoard] = useState<string[][]>(() =>
    INITIAL_CHESS_BOARD.map((r) => [...r]),
  );
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([]);
  const [status, setStatus] = useState("");
  const [thinking, setThinking] = useState(false);

  function handleClick(r: number, c: number) {
    if (status || thinking) return;
    const piece = board[r][c];
    if (sel) {
      const [sr, sc] = sel;
      if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
        const nb = cApply(board, sr, sc, r, c);
        const bKingLive = nb.some((row) => row.includes("k"));
        setBoard(nb);
        setSel(null);
        setLegalMoves([]);
        if (!bKingLive) {
          setStatus("You win! 🎉");
          return;
        }
        setThinking(true);
        setTimeout(() => {
          const mv = cBestMove(nb);
          if (!mv) {
            setStatus("Stalemate!");
            setThinking(false);
            return;
          }
          const [cr, cc, cnr, cnc] = mv;
          const nb2 = cApply(nb, cr, cc, cnr, cnc);
          const wKingLive = nb2.some((row) => row.includes("K"));
          setBoard(nb2);
          if (!wKingLive) setStatus("CPU wins! 🤖");
          setThinking(false);
        }, 80);
      } else if (piece && isW(piece)) {
        setSel([r, c]);
        setLegalMoves(cMoves(board, r, c));
      } else {
        setSel(null);
        setLegalMoves([]);
      }
    } else if (piece && isW(piece)) {
      setSel([r, c]);
      setLegalMoves(cMoves(board, r, c));
    }
  }

  const wrapBg = dark ? "#1a1209" : "#f0e6d3";
  const textColor = dark ? "#d4b896" : "#5a3e1b";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 12,
        height: "100%",
        background: wrapBg,
        color: textColor,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, minHeight: 18 }}>
        {status || (thinking ? "CPU thinking…" : "Your turn (White)")}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8,1fr)",
          width: "min(100%,416px)",
          aspectRatio: "1",
          border: "2px solid #8b6914",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          flexShrink: 0,
        }}
      >
        {board.map((row, r) =>
          row.map((piece, c) => {
            const light = (r + c) % 2 === 0;
            const isSel = sel?.[0] === r && sel?.[1] === c;
            const isMove = legalMoves.some(([mr, mc]) => mr === r && mc === c);
            const cellBg = isSel
              ? "#f6f669bb"
              : isMove
                ? light
                  ? "#cdd26a"
                  : "#aaa23a"
                : light
                  ? "#f0d9b5"
                  : "#b58863";
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  background: cellBg,
                  cursor:
                    status || thinking
                      ? "default"
                      : isW(piece)
                        ? "pointer"
                        : "default",
                  fontSize: "min(34px,4.25vw)",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {CHESS_PIECES[piece] ?? ""}
                {isMove && !piece && (
                  <div
                    style={{
                      position: "absolute",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
      <button
        onClick={() => {
          setBoard(INITIAL_CHESS_BOARD.map((r) => [...r]));
          setSel(null);
          setLegalMoves([]);
          setStatus("");
          setThinking(false);
        }}
        style={{
          padding: "5px 16px",
          borderRadius: 6,
          background: "#8b6914",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        New Game
      </button>
    </div>
  );
}

// ─── App Registry ─────────────────────────────────────────────
const APP_CONFIGS: AppConfig[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/",
    iconSrc: "/icons/dock/instagram.png",
    width: 400,
    height: 600,
    minWidth: 340,
    minHeight: 420,
    Window: InstagramApp,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aazainkhan/",
    iconSrc: "/icons/dock/linkedin.png",
    width: 660,
    height: 540,
    minWidth: 400,
    minHeight: 400,
    Window: LinkedInApp,
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/AazainKhan",
    iconSrc: "/icons/dock/github.png",
    width: 720,
    height: 520,
    minWidth: 480,
    minHeight: 360,
    Window: GitHubApp,
  },
  {
    id: "spotify",
    label: "Spotify",
    href: "https://open.spotify.com/",
    iconSrc: "/icons/dock/spotify.png",
    width: 400,
    height: 500,
    minWidth: 340,
    minHeight: 400,
    Window: SpotifyApp,
  },
  {
    id: "textedit",
    label: "TextEdit",
    href: "#",
    iconSrc: "/icons/dock/textedit.png",
    width: 580,
    height: 460,
    minWidth: 320,
    minHeight: 260,
    Window: TextEditApp,
  },
  {
    id: "chess",
    label: "Chess",
    href: "#",
    iconSrc: "/icons/dock/chess.png",
    width: 480,
    height: 560,
    minWidth: 440,
    minHeight: 480,
    Window: ChessApp,
  },
];

// ─── Main Component ───────────────────────────────────────────
export default function DockApp() {
  const mouseLeft = useMotionValue(-Infinity);
  const mouseRight = useMotionValue(-Infinity);
  const left = useTransform(mouseLeft, [0, 40], [0, -40]);
  const right = useTransform(mouseRight, [0, 40], [0, -40]);
  const lSpring = useSpring(left, SPRING);
  const rSpring = useSpring(right, SPRING);
  const safeLeft = useTransform(() =>
    mouseLeft.get() === -Infinity ? 0 : lSpring.get(),
  );
  const safeRight = useTransform(() =>
    mouseRight.get() === -Infinity ? 0 : rSpring.get(),
  );

  const [openApps, setOpenApps] = useState<Set<string>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>(null);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const topZ = useRef(200);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu(null);
    };
    const onClk = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".dock-ctx-menu")) setCtxMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClk);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClk);
    };
  }, []);

  const openApp = useCallback((cfg: AppConfig) => {
    setOpenApps((prev) => new Set(prev).add(cfg.id));
    topZ.current += 1;
    const z = topZ.current;
    setWindows((prev) => {
      const ex = prev.find((w) => w.app.id === cfg.id);
      if (ex)
        return prev.map((w) => (w.app.id === cfg.id ? { ...w, zIndex: z } : w));
      const iw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const ih = typeof window !== "undefined" ? window.innerHeight : 800;
      const off = prev.length * 24;
      const maxW = iw - 16;
      const maxH = ih - 80;
      const winW = Math.min(cfg.width, maxW);
      const winH = Math.min(cfg.height, maxH);
      return [
        ...prev,
        {
          id: `${cfg.id}-${Date.now()}`,
          app: cfg,
          x: Math.max(8, Math.round((iw - winW) / 2) + off),
          y: Math.max(50, Math.round((ih - winH) / 3) + off),
          w: winW,
          h: winH,
          zIndex: z,
        },
      ];
    });
  }, []);

  const closeWindow = useCallback((appId: string) => {
    setWindows((prev) => prev.filter((w) => w.app.id !== appId));
    setOpenApps((prev) => {
      const n = new Set(prev);
      n.delete(appId);
      return n;
    });
  }, []);

  const focusWindow = useCallback((appId: string) => {
    topZ.current += 1;
    const z = topZ.current;
    setWindows((prev) =>
      prev.map((w) => (w.app.id === appId ? { ...w, zIndex: z } : w)),
    );
  }, []);

  const resizeWindow = useCallback((appId: string, dw: number, dh: number) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.app.id !== appId) return w;
        return {
          ...w,
          w: Math.max(w.app.minWidth, w.w + dw),
          h: Math.max(w.app.minHeight, w.h + dh),
        };
      }),
    );
  }, []);

  const handleCtxMenu = useCallback((cfg: AppConfig, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ appId: cfg.id, x: e.clientX, y: e.clientY - 100 });
  }, []);

  const activeCfg = ctxMenu
    ? APP_CONFIGS.find((a) => a.id === ctxMenu.appId)
    : null;

  return (
    <>
      {/* ── Windows ── */}
      {windows.map((win) => (
        <AppWindow
          key={win.id}
          win={win}
          onClose={() => closeWindow(win.app.id)}
          onFocus={() => focusWindow(win.app.id)}
          onResize={(dw, dh) => resizeWindow(win.app.id, dw, dh)}
        />
      ))}

      {/* ── Desktop dock ── */}
      <div className="hidden sm:block fixed bottom-3 left-1/2 -translate-x-1/2 z-50 min-[1920px]:bottom-5">
        <motion.div
          onMouseMove={(e) => {
            const { left: l, right: r } =
              e.currentTarget.getBoundingClientRect();
            mouseLeft.set(e.clientX - l);
            mouseRight.set(r - e.clientX);
          }}
          onMouseLeave={() => {
            mouseLeft.set(-Infinity);
            mouseRight.set(-Infinity);
          }}
          className="relative mx-auto flex h-[78px] w-fit items-center gap-0.5 px-3 min-[1920px]:h-[92px] min-[1920px]:gap-1 min-[1920px]:px-4"
        >
          <motion.div
            className="dock-surface absolute inset-y-0 -z-10 rounded-2xl min-[1920px]:rounded-3xl"
            style={{ left: safeLeft, right: safeRight }}
          />
          {APP_CONFIGS.map((cfg) => (
            <AppIcon
              key={cfg.id}
              id={`dock-icon-${cfg.id}`}
              mouseLeft={mouseLeft}
              iconSrc={cfg.iconSrc}
              label={cfg.label}
              isOpen={openApps.has(cfg.id)}
              isMuted={ctxMenu?.appId === cfg.id}
              onOpen={() => openApp(cfg)}
              onContextMenu={(e) => handleCtxMenu(cfg, e)}
            />
          ))}
        </motion.div>
      </div>

      {/* ── Mobile dock (641–sm) ── */}
      <div className="hidden min-[641px]:block sm:hidden">
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100vw-1rem)] px-2">
          <motion.div
            onMouseMove={(e) => {
              const { left: l, right: r } =
                e.currentTarget.getBoundingClientRect();
              mouseLeft.set(e.clientX - l);
              mouseRight.set(r - e.clientX);
            }}
            onMouseLeave={() => {
              mouseLeft.set(-Infinity);
              mouseRight.set(-Infinity);
            }}
            className="relative mx-auto flex h-16 min-[500px]:h-[4.5rem] min-[600px]:h-20 w-fit max-w-full items-center gap-0.5 min-[430px]:gap-1 min-[460px]:gap-1.5 min-[500px]:gap-2 min-[550px]:gap-2.5 min-[600px]:gap-3 px-1 min-[430px]:px-1.5 min-[460px]:px-2 min-[500px]:px-2.5 min-[600px]:px-3"
          >
            <motion.div
              className="dock-surface absolute inset-y-0 -z-10 rounded-xl min-[600px]:rounded-2xl"
              style={{ left: safeLeft, right: safeRight }}
            />
            <div className="flex items-center gap-0.5 min-[430px]:gap-1 min-[460px]:gap-1.5 min-[500px]:gap-2 min-[550px]:gap-2.5 min-[600px]:gap-3 overflow-hidden">
              {APP_CONFIGS.map((cfg) => (
                <MobileAppIcon
                  key={cfg.id}
                  mouseLeft={mouseLeft}
                  iconSrc={cfg.iconSrc}
                  isOpen={openApps.has(cfg.id)}
                  isMuted={ctxMenu?.appId === cfg.id}
                  onOpen={() => openApp(cfg)}
                  onContextMenu={(e) => handleCtxMenu(cfg, e)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 3×3 grid ≤640px ── */}
      <div className="block min-[641px]:hidden">
        <div className="grid-dock">
          <div className="grid grid-cols-3 gap-4 p-5">
            {APP_CONFIGS.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => openApp(cfg)}
                className="flex flex-col items-center gap-1 bg-transparent border-0 p-0 cursor-pointer w-[72px]"
              >
                <div className="aspect-square w-[60px] overflow-hidden rounded-xl flex-shrink-0">
                  <img
                    src={cfg.iconSrc}
                    alt={cfg.label}
                    className="h-full w-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
                <span
                  className="text-[10px] leading-tight text-center w-full line-clamp-2 opacity-85 px-0.5"
                  style={{ color: "var(--text)" }}
                >
                  {cfg.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dock context menu ── */}
      {ctxMenu && activeCfg && (
        <div
          className="ctx-menu dock-ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="ctx-menu-item"
            onClick={() => {
              openApp(activeCfg);
              setCtxMenu(null);
            }}
          >
            Open
          </button>
          <div className="ctx-menu-separator" />
          {openApps.has(activeCfg.id) ? (
            <button
              type="button"
              className="ctx-menu-item destructive"
              onClick={() => {
                closeWindow(activeCfg.id);
                setCtxMenu(null);
              }}
            >
              Quit
            </button>
          ) : (
            <button type="button" className="ctx-menu-item disabled" disabled>
              Quit
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ─── AppWindow (drag from titlebar + resize handle) ───────────
function AppWindow({
  win,
  onClose,
  onFocus,
  onResize,
}: {
  win: WindowState;
  onClose: () => void;
  onFocus: () => void;
  onResize: (dw: number, dh: number) => void;
}) {
  const x = useMotionValue(win.x);
  const y = useMotionValue(win.y);
  const dragControls = useDragControls();
  const { Window } = win.app;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      style={{
        x,
        y,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: win.zIndex,
        width: win.w,
        height: win.h,
      }}
      onPointerDown={onFocus}
      className={`mock-window window-${win.app.id}`}
    >
      {/* Titlebar */}
      <div
        className="window-titlebar"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="traffic-lights">
          <button
            type="button"
            className="tl tl-red"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            title="Close"
          />
          <button
            type="button"
            className="tl tl-yellow"
            onPointerDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="tl tl-green"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
        <span className="titlebar-name">{win.app.label}</span>
      </div>
      {/* Content */}
      <div className="mock-window-content">
        <Window />
      </div>
      {/* Resize handle */}
      <ResizeHandle onDelta={onResize} />
    </motion.div>
  );
}

function ResizeHandle({
  onDelta,
}: {
  onDelta: (dw: number, dh: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        cursor: "nwse-resize",
        zIndex: 10,
        backgroundImage:
          "radial-gradient(circle,rgba(128,128,128,0.5) 1.5px,transparent 1.5px)",
        backgroundSize: "4.5px 4.5px",
        backgroundPosition: "bottom right",
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const el = e.currentTarget as HTMLDivElement;
        el.setPointerCapture(e.pointerId);
        let lx = e.clientX,
          ly = e.clientY;
        function onMove(ev: PointerEvent) {
          onDelta(ev.clientX - lx, ev.clientY - ly);
          lx = ev.clientX;
          ly = ev.clientY;
        }
        function onUp() {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
        }
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
      }}
    />
  );
}

// ─── AppIcon ──────────────────────────────────────────────────
function AppIcon({
  id,
  mouseLeft,
  iconSrc,
  label,
  isOpen,
  isMuted,
  onOpen,
  onContextMenu,
}: {
  id?: string;
  mouseLeft: MotionValue;
  iconSrc: string;
  label: string;
  isOpen: boolean;
  isMuted: boolean;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(() => {
    const b = ref.current
      ? { x: ref.current.offsetLeft, w: ref.current.offsetWidth }
      : { x: 0, w: 0 };
    return mouseLeft.get() - b.x - b.w / 2;
  });
  const scale = useTransform(distance, [-DISTANCE, 0, DISTANCE], [1, SCALE, 1]);
  const xTrans = useTransform(() => {
    const d = distance.get();
    if (d === -Infinity) return 0;
    if (d < -DISTANCE || d > DISTANCE) return Math.sign(d) * -1 * NUDGE;
    return (-d / DISTANCE) * NUDGE * scale.get();
  });
  const scaleSpring = useSpring(scale, SPRING);
  const xSpring = useSpring(xTrans, SPRING);
  const y = useMotionValue(0);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <div
          id={id}
          ref={ref}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <motion.div
            style={{
              x: xSpring,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Tooltip.Trigger asChild>
              <motion.button
                type="button"
                style={{ scale: scaleSpring, y, opacity: isMuted ? 0.5 : 1 }}
                onClick={async () => {
                  const c = animate(y, [0, -40, 0], {
                    repeat: 2,
                    ease: [
                      [0, 0, 0.2, 1],
                      [0.8, 0, 1, 1],
                    ],
                    duration: 0.7,
                  });
                  try {
                    await c.finished;
                  } catch (_) {}
                  onOpen();
                }}
                onContextMenu={onContextMenu}
                className="aspect-square block w-[64px] origin-bottom bg-transparent border-0 p-0 outline-none ring-0 focus:outline-none focus:ring-0 appearance-none overflow-hidden rounded-2xl"
              >
                <img
                  src={iconSrc}
                  alt={label}
                  className="h-full w-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </motion.button>
            </Tooltip.Trigger>
            {isOpen && <div className="dock-dot" />}
          </motion.div>
        </div>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={10}
            className="bg-gray-700 shadow shadow-black border border-gray-600 px-2 py-1.5 text-sm rounded text-white font-medium"
          >
            {label}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// ─── MobileAppIcon ────────────────────────────────────────────
function MobileAppIcon({
  mouseLeft,
  iconSrc,
  isOpen,
  isMuted,
  onOpen,
  onContextMenu,
}: {
  mouseLeft: MotionValue;
  iconSrc: string;
  isOpen: boolean;
  isMuted: boolean;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(() => {
    const b = ref.current
      ? { x: ref.current.offsetLeft, w: ref.current.offsetWidth }
      : { x: 0, w: 0 };
    return mouseLeft.get() - b.x - b.w / 2;
  });
  const scale = useTransform(distance, [-DISTANCE, 0, DISTANCE], [1, SCALE, 1]);
  const xTrans = useTransform(() => {
    const d = distance.get();
    if (d === -Infinity) return 0;
    if (d < -DISTANCE || d > DISTANCE) return Math.sign(d) * -1 * NUDGE;
    return (-d / DISTANCE) * NUDGE * scale.get();
  });
  const scaleSpring = useSpring(scale, SPRING);
  const xSpring = useSpring(xTrans, SPRING);
  const y = useMotionValue(0);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <motion.div
        style={{
          x: xSpring,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <motion.button
          type="button"
          style={{ scale: scaleSpring, y, opacity: isMuted ? 0.5 : 1 }}
          onClick={async () => {
            const c = animate(y, [0, -30, 0], {
              repeat: 2,
              ease: [
                [0, 0, 0.2, 1],
                [0.8, 0, 1, 1],
              ],
              duration: 0.7,
            });
            try {
              await c.finished;
            } catch (_) {}
            onOpen();
          }}
          onContextMenu={onContextMenu}
          className="aspect-square block w-12 min-[480px]:w-14 min-[550px]:w-16 origin-bottom bg-transparent border-0 p-0 outline-none ring-0 focus:outline-none focus:ring-0 appearance-none overflow-hidden rounded-xl"
        >
          <img
            src={iconSrc}
            alt=""
            className="h-full w-full object-cover select-none pointer-events-none"
            draggable={false}
          />
        </motion.button>
        {isOpen && <div className="dock-dot" />}
      </motion.div>
    </div>
  );
}
