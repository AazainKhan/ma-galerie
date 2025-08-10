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
const APPS = [
  "Safari",
  "Mail",
  "Messages",
  "Photos",
  "Notes",
  "Calendar",
  "Reminders",
  "Music",
];

export default function DockApp() {
  const mouseLeft = useMotionValue(-Infinity);
  const mouseRight = useMotionValue(-Infinity);
  const left = useTransform(mouseLeft, [0, 40], [0, -40]);
  const right = useTransform(mouseRight, [0, 40], [0, -40]);
  const leftSpring = useSpring(left, SPRING);
  const rightSpring = useSpring(right, SPRING);
  // Prevent background from stretching when mouse is not over the dock
  const safeLeft = useTransform(() => (mouseLeft.get() === -Infinity ? 0 : leftSpring.get()));
  const safeRight = useTransform(() => (mouseRight.get() === -Infinity ? 0 : rightSpring.get()));

  return (
    <>
      {/* Fixed, centered dock for desktop */}
      <div className="hidden sm:block fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
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
          className="relative mx-auto flex h-20 w-fit items-end gap-3 px-3 pb-4"
        >
          <motion.div
            className="absolute inset-y-0 -z-10 rounded-2xl bg-gray-700/90 border border-gray-600"
            style={{ left: safeLeft, right: safeRight }}
          />

          {Array.from(Array(APPS.length).keys()).map((i) => (
            <AppIcon key={i} mouseLeft={mouseLeft}>
              {APPS[i]}
            </AppIcon>
          ))}
        </motion.div>
      </div>

      <div className="sm:hidden">
  <div className="mx-auto flex h-20 max-w-full items-end gap-4 overflow-x-auto rounded-2xl bg-gray-700 px-5 pb-4 sm:hidden">
          {Array.from(Array(8).keys()).map((i) => (
            <div key={i} className="aspect-square w-12 flex-shrink-0 overflow-hidden rounded-xl">
              <img
                src="/icons/macos-folder-original.png"
                alt={`App ${i + 1}`}
                className="h-full w-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs font-medium text-gray-300">
          View at 640px with a mouse
          <br /> to see the interaction.
        </p>
      </div>
    </>
  );
}

function AppIcon({
  mouseLeft,
  children,
}: {
  mouseLeft: MotionValue;
  children: ReactNode;
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
            style={{ x: xSpring, scale: scaleSpring, y }}
            onClick={() => {
              animate(y, [0, -40, 0], {
                repeat: 2,
                ease: [
                  [0, 0, 0.2, 1],
                  [0.8, 0, 1, 1],
                ],
                duration: 0.7,
              });
            }}
            className="aspect-square block w-12 origin-bottom overflow-hidden rounded-xl bg-transparent border-0 p-0 outline-none ring-0 focus:outline-none focus:ring-0 appearance-none"
          >
            <img
              src="/icons/macos-folder-original.png"
              alt={typeof children === "string" ? children : "App icon"}
              className="h-full w-full object-contain select-none pointer-events-none"
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
