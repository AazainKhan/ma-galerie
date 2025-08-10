import type { SpringValue } from "@react-spring/web";
import { createContext, useContext } from "react";

type DockApi = {
  hovered: boolean;
  width: number;
  zoomLevel?: SpringValue<number>;
  setIsZooming: (isZooming: boolean) => void;
};

export const DockContext = createContext<DockApi>({
  width: 0,
  hovered: false,
  setIsZooming: () => {},
});

export const useDock = () => useContext(DockContext);
