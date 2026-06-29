"use client";

import { motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Album = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image_src: string | null;
};

type MenuItem = {
  label?: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

type CtxMenu = { x: number; y: number; items: MenuItem[] };

function clamp(x: number, y: number, w: number, h: number) {
  return {
    x: Math.min(x, window.innerWidth - w - 8),
    y: Math.min(y, window.innerHeight - h - 8),
  };
}

// ── Desktop icon layout + persistence ─────────────────────────
const ICON_POS_KEY = "mg-desktop-icon-positions-v1";
const ROW_STRIDE = 118;
const COL_STRIDE = 110;
const FOLDER_H = 124; // full icon height incl. 2-line label
const DOCK_RESERVE = 128; // keep icons clear of the bottom dock
const TOP_GAP = 12;
const EDGE = 8;

// Lay icons out in vertical columns down the right edge, wrapping to a
// new column to the left once a column would run into the dock.
function computeLayout(count: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const headerEl = document.querySelector<HTMLElement>(".site-header");
  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 90;
  const top = headerH + TOP_GAP;
  const usableH = vh - DOCK_RESERVE - top;
  const rowsPerCol = Math.max(
    1,
    Math.floor((usableH - FOLDER_H) / ROW_STRIDE) + 1,
  );
  return Array.from({ length: count }, (_, i) => {
    const col = Math.floor(i / rowsPerCol);
    const row = i % rowsPerCol;
    return {
      x: vw - (col + 1) * COL_STRIDE - EDGE,
      y: top + row * ROW_STRIDE,
    };
  });
}

function loadIconPositions(): Record<string, { x: number; y: number }> {
  try {
    return JSON.parse(localStorage.getItem(ICON_POS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveIconPosition(slug: string, x: number, y: number) {
  try {
    const all = loadIconPositions();
    all[slug] = { x: Math.round(x), y: Math.round(y) };
    localStorage.setItem(ICON_POS_KEY, JSON.stringify(all));
  } catch {}
}

export default function MacDesktop({ albums }: { albums: Album[] }) {
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 640,
  );
  const [layout] = useState(() =>
    typeof window !== "undefined" ? computeLayout(albums.length) : [],
  );
  const [savedPositions] = useState(() =>
    typeof window !== "undefined" ? loadIconPositions() : {},
  );
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () => new Set(),
  );
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [infoState, setInfoState] = useState<{
    type: "desktop" | "folder" | "selection";
    slug?: string;
    slugs?: string[];
  } | null>(null);

  useEffect(() => {
    let lastMarqueeEnd = 0;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Element;
      // Don't clear a fresh marquee selection on the click that follows the drag.
      if (Date.now() - lastMarqueeEnd > 250 && !t.closest(".desktop-icon")) {
        setSelectedSlugs(new Set());
        window.dispatchEvent(new CustomEvent("mg-deselect-all"));
      }
      if (!t.closest(".ctx-menu")) setCtxMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtxMenu(null);
        setInfoState(null);
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest(".desktop-icon") || t.closest(".ctx-menu")) return;
      e.preventDefault();
      const { x, y } = clamp(e.clientX, e.clientY, 210, 88);
      setCtxMenu({
        x,
        y,
        items: [
          {
            label: "Get Info",
            action: () => {
              setInfoState({ type: "desktop" });
              setCtxMenu(null);
            },
          },
        ],
      });
    };
    // Marquee (rubber-band) selection on empty desktop background.
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || window.innerWidth < 640) return;
      const t = e.target as Element;
      if (
        t.closest(
          ".desktop-icon, .mock-window, .sticky-note, .info-window, .ctx-menu, .dock-ctx-menu, header, a, button, input, textarea, [class*='dock']",
        )
      )
        return;
      // Stop the drag from text-selecting nav links / page content.
      e.preventDefault();
      document.documentElement.classList.add("mg-no-select");
      const sx = e.clientX;
      const sy = e.clientY;
      let dragging = false;
      const onMove = (ev: PointerEvent) => {
        const w = Math.abs(ev.clientX - sx);
        const h = Math.abs(ev.clientY - sy);
        if (!dragging && w < 4 && h < 4) return;
        dragging = true;
        const left = Math.min(sx, ev.clientX);
        const top = Math.min(sy, ev.clientY);
        const right = Math.max(sx, ev.clientX);
        const bottom = Math.max(sy, ev.clientY);
        setMarquee({ x: left, y: top, w, h });
        // Select every folder the rubber-band rectangle intersects.
        const hits = new Set<string>();
        for (const el of document.querySelectorAll<HTMLElement>(
          ".desktop-icon[data-slug]",
        )) {
          const b = el.getBoundingClientRect();
          if (
            !(
              right < b.left ||
              left > b.right ||
              bottom < b.top ||
              top > b.bottom
            )
          ) {
            const s = el.getAttribute("data-slug");
            if (s) hits.add(s);
          }
        }
        setSelectedSlugs(hits);
        // Broadcast the rectangle so the dock island can select its files +
        // stickies (they live in a separate React tree).
        window.dispatchEvent(
          new CustomEvent("mg-marquee", {
            detail: { left, top, right, bottom },
          }),
        );
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.documentElement.classList.remove("mg-no-select");
        window.getSelection()?.removeAllRanges();
        if (dragging) lastMarqueeEnd = Date.now();
        setMarquee(null);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    };
    // A file/sticky was selected in the dock island — clear the folders.
    const handleDeselectFolders = () => setSelectedSlugs(new Set());
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("mg-deselect-folders", handleDeselectFolders);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("mg-deselect-folders", handleDeselectFolders);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      {marquee && (
        <div
          className="marquee"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
          }}
        />
      )}
      {albums.map((album, i) => (
        <DesktopIcon
          key={album.slug}
          album={album}
          initialPos={savedPositions[album.slug] ?? layout[i] ?? { x: 0, y: 0 }}
          selected={selectedSlugs.has(album.slug)}
          onSelect={(slug) => {
            setSelectedSlugs(slug ? new Set([slug]) : new Set());
            if (slug)
              window.dispatchEvent(new CustomEvent("mg-deselect-files"));
          }}
          onContextMenu={(x, y) => {
            const inMulti =
              selectedSlugs.has(album.slug) && selectedSlugs.size > 1;
            const slugs = inMulti ? [...selectedSlugs] : [album.slug];
            // Right-clicking a folder outside the selection selects just it.
            if (!inMulti) setSelectedSlugs(new Set([album.slug]));
            const { x: cx, y: cy } = clamp(x, y, 220, 140);
            setCtxMenu({
              x: cx,
              y: cy,
              items: inMulti
                ? [
                    {
                      label: `Get Info (${slugs.length} folders)`,
                      action: () => {
                        setInfoState({ type: "selection", slugs });
                        setCtxMenu(null);
                      },
                    },
                  ]
                : [
                    {
                      label: "Open",
                      action: () =>
                        window.location.assign(`/albums/${album.slug}`),
                    },
                    { separator: true },
                    {
                      label: "Get Info",
                      action: () => {
                        setInfoState({ type: "folder", slug: album.slug });
                        setCtxMenu(null);
                      },
                    },
                    {
                      label: "Copy Link",
                      action: () => {
                        const url = `${window.location.origin}/albums/${album.slug}`;
                        const ta = document.createElement("textarea");
                        ta.value = url;
                        ta.style.cssText =
                          "position:fixed;opacity:0;pointer-events:none";
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        try {
                          document.execCommand("copy");
                        } catch {}
                        ta.remove();
                        navigator.clipboard?.writeText(url).catch(() => {});
                        setCtxMenu(null);
                      },
                    },
                  ],
            });
          }}
        />
      ))}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {infoState && (
        <InfoWindow
          type={infoState.type}
          slug={infoState.slug}
          slugs={infoState.slugs}
          album={albums.find((a) => a.slug === infoState.slug)}
          albums={albums}
          totalAlbums={albums.length}
          onClose={() => setInfoState(null)}
        />
      )}
    </>
  );
}

function ContextMenu({
  x,
  y,
  items,
  onClose,
}: CtxMenu & { onClose: () => void }) {
  return (
    <div
      className="ctx-menu"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="ctx-menu-separator" />
        ) : (
          <button
            key={i}
            type="button"
            className={`ctx-menu-item${item.disabled ? " disabled" : ""}${item.destructive ? " destructive" : ""}`}
            onClick={() => {
              if (!item.disabled && item.action) item.action();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

function InfoWindow({
  type,
  slug,
  slugs,
  album,
  albums,
  totalAlbums,
  onClose,
}: {
  type: "desktop" | "folder" | "selection";
  slug?: string;
  slugs?: string[];
  album?: Album;
  albums?: Album[];
  totalAlbums: number;
  onClose: () => void;
}) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const initX =
    typeof window !== "undefined"
      ? Math.round((window.innerWidth - 280) / 2)
      : 100;
  const x = useMotionValue(initX);
  const y = useMotionValue(120);
  const slugKey = slugs?.join(",");

  useEffect(() => {
    if (type === "selection" && slugs?.length) {
      Promise.all(
        slugs.map((s) =>
          fetch(`/api/album-stats?slug=${s}`)
            .then((r) => r.json())
            .catch(() => ({ imageCount: 0 })),
        ),
      )
        .then((arr) =>
          setStats({
            folderCount: slugs.length,
            totalImages: arr.reduce((sum, d) => sum + (d.imageCount ?? 0), 0),
          }),
        )
        .catch(() => setStats({ folderCount: slugs.length, totalImages: 0 }));
      return;
    }
    const url =
      type === "folder" && slug
        ? `/api/album-stats?slug=${slug}`
        : "/api/album-stats";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({}));
  }, [type, slug, slugKey, slugs]);

  const selectedNames =
    type === "selection" && slugs && albums
      ? slugs
          .map((s) => albums.find((a) => a.slug === s)?.title)
          .filter(Boolean)
          .join(", ")
      : "";

  const title =
    type === "desktop"
      ? "Desktop — Get Info"
      : type === "selection"
        ? `${slugs?.length ?? 0} items — Get Info`
        : `${album?.title ?? "Folder"} — Get Info`;

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{
        x,
        y,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9998,
        width: 280,
      }}
      className="info-window"
    >
      <div className="window-titlebar">
        <div className="traffic-lights">
          <button
            type="button"
            className="tl tl-red"
            onClick={onClose}
            title="Close"
          />
          <button type="button" className="tl tl-yellow" />
          <button type="button" className="tl tl-green" />
        </div>
        <span className="titlebar-name">{title}</span>
      </div>
      <div className="info-window-body">
        {type === "selection" ? (
          <>
            <div className="info-row">
              <span className="info-row-label">Folders</span>
              <span className="info-row-value">{slugs?.length ?? 0}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Total images</span>
              <span className="info-row-value">
                {stats === null ? "…" : (stats.totalImages ?? "—")}
              </span>
            </div>
            {selectedNames && (
              <div className="info-row">
                <span className="info-row-label">Items</span>
                <span className="info-row-value">{selectedNames}</span>
              </div>
            )}
          </>
        ) : type === "desktop" ? (
          <>
            <div className="info-row">
              <span className="info-row-label">Folders</span>
              <span className="info-row-value">{totalAlbums}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Total images</span>
              <span className="info-row-value">
                {stats === null ? "…" : (stats.totalImages ?? "—")}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="info-row">
              <span className="info-row-label">Name</span>
              <span className="info-row-value">{album?.title ?? "—"}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Images</span>
              <span className="info-row-value">
                {stats === null ? "…" : (stats.imageCount ?? "—")}
              </span>
            </div>
            {album?.description && (
              <div className="info-row">
                <span className="info-row-label">Description</span>
                <span className="info-row-value">{album.description}</span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function DesktopIcon({
  album,
  initialPos,
  selected,
  onSelect,
  onContextMenu,
}: {
  album: Album;
  initialPos: { x: number; y: number };
  selected: boolean;
  onSelect: (slug: string | null) => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const x = useMotionValue(initialPos.x);
  const y = useMotionValue(initialPos.y);
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastTap.current < 300;
    lastTap.current = now;

    if (isDouble) {
      window.location.assign(`/albums/${album.slug}`);
    } else {
      onSelect(album.slug);
    }
  }, [album.slug, onSelect]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e.clientX, e.clientY);
    },
    [onContextMenu],
  );

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{
        x,
        y,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 30,
        touchAction: "none",
        width: 90,
      }}
      whileDrag={{ zIndex: 200, scale: 1.04 }}
      className={`desktop-icon${selected ? " selected" : ""}`}
      data-slug={album.slug}
      onTap={handleTap}
      onDragEnd={() => saveIconPosition(album.slug, x.get(), y.get())}
      onContextMenu={handleContextMenu}
    >
      <div className="desktop-icon-img-wrap">
        <div className="desktop-icon-img">
          <img
            src="/icons/macos-folder-original.png"
            alt={album.title}
            draggable={false}
          />
        </div>
      </div>
      <span className="desktop-icon-label">{album.title}</span>
    </motion.div>
  );
}
