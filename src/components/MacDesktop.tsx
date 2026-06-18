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

function getIconPos(index: number) {
  const vw = window.innerWidth;
  const headerEl = document.querySelector<HTMLElement>(".site-header");
  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 90;
  const col = Math.floor(index / 6);
  const row = index % 6;
  return {
    x: vw - (col + 1) * 110 - 8,
    y: headerH + 12 + row * 118,
  };
}

export default function MacDesktop({ albums }: { albums: Album[] }) {
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 640,
  );
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [infoState, setInfoState] = useState<{
    type: "desktop" | "folder";
    slug?: string;
  } | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest(".desktop-icon")) setSelectedSlug(null);
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
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      {albums.map((album, i) => (
        <DesktopIcon
          key={album.slug}
          album={album}
          index={i}
          selected={selectedSlug === album.slug}
          onSelect={setSelectedSlug}
          onContextMenu={(x, y) => {
            const { x: cx, y: cy } = clamp(x, y, 200, 120);
            setCtxMenu({
              x: cx,
              y: cy,
              items: [
                {
                  label: "Open",
                  action: () => window.location.assign(`/albums/${album.slug}`),
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
          album={albums.find((a) => a.slug === infoState.slug)}
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
  album,
  totalAlbums,
  onClose,
}: {
  type: "desktop" | "folder";
  slug?: string;
  album?: Album;
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

  useEffect(() => {
    const url =
      type === "folder" && slug
        ? `/api/album-stats?slug=${slug}`
        : "/api/album-stats";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({}));
  }, [type, slug]);

  const title =
    type === "desktop"
      ? "Desktop — Get Info"
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
        {type === "desktop" ? (
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
  index,
  selected,
  onSelect,
  onContextMenu,
}: {
  album: Album;
  index: number;
  selected: boolean;
  onSelect: (slug: string | null) => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const [pos] = useState(() => getIconPos(index));
  const x = useMotionValue(pos.x);
  const y = useMotionValue(pos.y);
  const lastTap = useRef(0);

  const handleTap = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent) => {
      const now = Date.now();
      const isDouble = now - lastTap.current < 300;
      lastTap.current = now;

      if (isDouble) {
        const cx = "clientX" in event ? event.clientX : window.innerWidth / 2;
        const cy = "clientY" in event ? event.clientY : window.innerHeight / 2;
        document.body.style.cursor = "none";
        const ball = document.createElement("div");
        ball.className = "beach-ball";
        ball.style.left = `${cx - 9}px`;
        ball.style.top = `${cy - 9}px`;
        document.body.appendChild(ball);
        const track = (e: MouseEvent) => {
          ball.style.left = `${e.clientX - 9}px`;
          ball.style.top = `${e.clientY - 9}px`;
        };
        document.addEventListener("mousemove", track);
        window.location.assign(`/albums/${album.slug}`);
      } else {
        onSelect(album.slug);
      }
    },
    [album.slug, onSelect],
  );

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
      onTap={handleTap}
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
