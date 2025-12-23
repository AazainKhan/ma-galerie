import { useGesture } from "@use-gesture/react";
import type * as React from "react";
import { DOCK_ZOOM_LIMIT } from "./Dock";
import { useDock } from "./DockContext";

import styles from "./styles.module.scss";

export const DockDivider: React.FC = () => {
  const { zoomLevel, setIsZooming } = useDock();

  const bind = useGesture(
    {
      onDrag: ({ down, offset: [_ox, oy], cancel, direction: [_dx, dy] }) => {
        if (!zoomLevel) return;
        if (oy <= DOCK_ZOOM_LIMIT[0] && dy === -1) {
          cancel();
        } else if (oy >= DOCK_ZOOM_LIMIT[1] && dy === 1) {
          cancel();
        } else if (zoomLevel) {
          zoomLevel.start(oy, {
            immediate: down,
          });
        }
      },
      onDragStart: () => {
        setIsZooming(true);
      },
      onDragEnd: () => {
        setIsZooming(false);
      },
    },
    {
      drag: {
        axis: "y",
      },
    },
  );

  if (!zoomLevel) return null;

  return (
    <div className={styles.divider__container} {...bind()}>
      <span className={styles.divider}></span>
    </div>
  );
};
