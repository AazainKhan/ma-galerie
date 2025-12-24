// Dependencies: framer-motion, tailwindcss, @radix-ui/react-tooltip

"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { MotionValue } from "framer-motion";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

const SCALE = 2.25; // max scale factor of an icon
const DISTANCE = 110; // pixels before mouse affects an icon
const NUDGE = 40; // pixels icons are moved away from mouse
const SPRING = {
  mass: 0.1,
  stiffness: 170,
  damping: 12,
};

type Album = {
  title: string;
  slug: string;
  cover_image_src?: string | null;
};

type DockAppProps = {
  albums: Album[];
};

export default function DockApp({ albums }: DockAppProps) {
  const mouseLeft = useMotionValue(-Infinity);
  const mouseRight = useMotionValue(-Infinity);
  const left = useTransform(mouseLeft, [0, 40], [0, -40]);
  const right = useTransform(mouseRight, [0, 40], [0, -40]);
  const leftSpring = useSpring(left, SPRING);
  const rightSpring = useSpring(right, SPRING);
  // Prevent background from stretching when mouse is not over the dock
  const safeLeft = useTransform(() =>
    mouseLeft.get() === -Infinity ? 0 : leftSpring.get(),
  );
  const safeRight = useTransform(() =>
    mouseRight.get() === -Infinity ? 0 : rightSpring.get(),
  );

  const navigateToApp = (slug: string) => {
    window.location.assign(`/albums/${slug}`);
  };

  return (
    <>
      {/* No overlay; clicking icons navigates to a dedicated page */}
      {/* Fixed, centered dock for desktop (scale up on ≥1920px) */}
      <div className="hidden sm:block fixed bottom-3 left-1/2 -translate-x-1/2 z-50 min-[1920px]:bottom-5">
        <motion.div
          onMouseMove={(e) => {
            const { left, right } = e.currentTarget.getBoundingClientRect();
            const offsetLeft = e.clientX - left;
            const offsetRight = right - e.clientX;
            mouseLeft.set(offsetLeft);
            mouseRight.set(offsetRight);
          }}
          onMouseLeave={() => {
            mouseLeft.set(-Infinity);
            mouseRight.set(-Infinity);
          }}
          className="relative mx-auto flex h-20 w-fit items-end gap-3 px-3 pb-3 min-[1920px]:h-24 min-[1920px]:gap-4 min-[1920px]:px-4 min-[1920px]:pb-4"
        >
          <motion.div
            className="dock-surface absolute inset-y-0 -z-10 rounded-2xl min-[1920px]:rounded-3xl"
            style={{
              left: safeLeft,
              right: safeRight,
            }}
          />

          {albums.map((album) => (
            <AppIcon
              key={album.slug}
              mouseLeft={mouseLeft}
              onOpen={() => navigateToApp(album.slug)}
              coverImage={album.cover_image_src}
            >
              {album.title}
            </AppIcon>
          ))}
        </motion.div>
      </div>

      {/* Mobile dock for screens larger than 640px but smaller than desktop */}
      <div className="hidden min-[641px]:block sm:hidden">
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100vw-1rem)] px-2">
          <motion.div
            onMouseMove={(e) => {
              const { left, right } = e.currentTarget.getBoundingClientRect();
              const offsetLeft = e.clientX - left;
              const offsetRight = right - e.clientX;
              mouseLeft.set(offsetLeft);
              mouseRight.set(offsetRight);
            }}
            onMouseLeave={() => {
              mouseLeft.set(-Infinity);
              mouseRight.set(-Infinity);
            }}
            className="relative mx-auto flex h-16 min-[500px]:h-18 min-[600px]:h-20 w-fit max-w-full items-end gap-0.5 min-[430px]:gap-1 min-[460px]:gap-1.5 min-[500px]:gap-2 min-[550px]:gap-2.5 min-[600px]:gap-3 px-1 min-[430px]:px-1.5 min-[460px]:px-2 min-[500px]:px-2.5 min-[600px]:px-3 pb-1 min-[430px]:pb-1.5 min-[460px]:pb-2 min-[500px]:pb-2.5 min-[600px]:pb-3"
          >
            <motion.div
              className="dock-surface absolute inset-y-0 -z-10 rounded-xl min-[600px]:rounded-2xl"
              style={{
                left: safeLeft,
                right: safeRight,
              }}
            />
            <div className="flex items-end gap-0.5 min-[430px]:gap-1 min-[460px]:gap-1.5 min-[500px]:gap-2 min-[550px]:gap-2.5 min-[600px]:gap-3 overflow-hidden">
              {albums.slice(0, 8).map((album) => (
                <MobileAppIcon
                  key={album.slug}
                  mouseLeft={mouseLeft}
                  onOpen={() => navigateToApp(album.slug)}
                  coverImage={album.cover_image_src}
                >
                  {album.title}
                </MobileAppIcon>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3x3 Grid for screens 640px and smaller */}
      <div className="block min-[641px]:hidden">
        <div className="grid-dock">
          <div className="grid grid-cols-3 gap-3 p-4 min-[1920px]:gap-4 min-[1920px]:p-5">
            {albums.slice(0, 9).map((album) => (
              <button
                key={album.slug}
                type="button"
                onClick={() => navigateToApp(album.slug)}
                className="aspect-square w-14 overflow-hidden rounded-lg min-[1920px]:w-16 border-0 p-0 bg-transparent cursor-pointer"
              >
                <img
                  src={
                    album.cover_image_src || "/icons/macos-folder-original.png"
                  }
                  alt={album.title}
                  className="h-full w-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AppIcon({
  mouseLeft,
  children,
  onOpen,
  coverImage,
}: {
  mouseLeft: MotionValue;
  children: ReactNode;
  onOpen: () => void;
  coverImage?: string | null;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(() => {
    const bounds = ref.current
      ? { x: ref.current.offsetLeft, width: ref.current.offsetWidth }
      : { x: 0, width: 0 };

    return mouseLeft.get() - bounds.x - bounds.width / 2;
  });

  const scale = useTransform(distance, [-DISTANCE, 0, DISTANCE], [1, SCALE, 1]);
  const x = useTransform(() => {
    const d = distance.get();
    if (d === -Infinity) {
      return 0;
    } else if (d < -DISTANCE || d > DISTANCE) {
      return Math.sign(d) * -1 * NUDGE;
    } else {
      return (-d / DISTANCE) * NUDGE * scale.get();
    }
  });

  const scaleSpring = useSpring(scale, SPRING);
  const xSpring = useSpring(x, SPRING);
  const y = useMotionValue(0);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            ref={ref}
            type="button"
            style={{ x: xSpring, scale: scaleSpring, y }}
            onClick={async () => {
              const controls = animate(y, [0, -40, 0], {
                repeat: 2,
                ease: [
                  [0, 0, 0.2, 1],
                  [0.8, 0, 1, 1],
                ],
                duration: 0.7,
              });
              try {
                await controls.finished;
              } catch (_) {
                // ignore cancellation, still proceed
              }
              onOpen();
            }}
            className="aspect-square block w-16 origin-bottom overflow-hidden rounded-xl bg-transparent border-0 p-0 outline-none ring-0 focus:outline-none focus:ring-0 appearance-none"
          >
            {" "}
            <img
              src={coverImage || "/icons/macos-folder-original.png"}
              alt={typeof children === "string" ? children : "App icon"}
              className="h-full w-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={10}
            className="bg-gray-700 shadow shadow-black border border-gray-600 px-2 py-1.5 text-sm rounded text-white font-medium"
          >
            {children}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function MobileAppIcon({
  mouseLeft,
  children,
  onOpen,
  coverImage,
}: {
  mouseLeft: MotionValue;
  children: ReactNode;
  onOpen: () => void;
  coverImage?: string | null;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(() => {
    const bounds = ref.current
      ? { x: ref.current.offsetLeft, width: ref.current.offsetWidth }
      : { x: 0, width: 0 };

    return mouseLeft.get() - bounds.x - bounds.width / 2;
  });

  const scale = useTransform(distance, [-DISTANCE, 0, DISTANCE], [1, SCALE, 1]);
  const x = useTransform(() => {
    const d = distance.get();
    if (d === -Infinity) {
      return 0;
    } else if (d < -DISTANCE || d > DISTANCE) {
      return Math.sign(d) * -1 * NUDGE;
    } else {
      return (-d / DISTANCE) * NUDGE * scale.get();
    }
  });

  const scaleSpring = useSpring(scale, SPRING);
  const xSpring = useSpring(x, SPRING);
  const y = useMotionValue(0);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            ref={ref}
            type="button"
            style={{ x: xSpring, scale: scaleSpring, y }}
            onClick={async () => {
              const controls = animate(y, [0, -30, 0], {
                repeat: 2,
                ease: [
                  [0, 0, 0.2, 1],
                  [0.8, 0, 1, 1],
                ],
                duration: 0.7,
              });
              try {
                await controls.finished;
              } catch (_) {
                // ignore cancellation, still proceed
              }
              onOpen();
            }}
            className="aspect-square block w-12 min-[480px]:w-14 min-[550px]:w-16 origin-bottom overflow-hidden rounded-lg min-[600px]:rounded-xl bg-transparent border-0 p-0 outline-none ring-0 focus:outline-none focus:ring-0 appearance-none"
          >
            {" "}
            <img
              src={coverImage || "/icons/macos-folder-original.png"}
              alt={typeof children === "string" ? children : "App icon"}
              className="h-full w-full object-cover select-none pointer-events-none"
              draggable={true}
            />
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={10}
            className="bg-gray-700 shadow shadow-black border border-gray-600 px-2 py-1.5 text-sm rounded text-white font-medium"
          >
            {children}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
