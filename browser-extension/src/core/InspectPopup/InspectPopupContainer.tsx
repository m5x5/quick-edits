import React from "react";
import { flip, platform, useFloating } from "@floating-ui/react-dom";

export default function InspectPopupContainer({ children, target, targetSelectionActive }: { children: React.ReactNode, target: HTMLElement | SVGElement, targetSelectionActive: boolean }) {
  const { refs, floatingStyles } = useFloating({
    platform: {
      ...platform,
    },
    placement: "bottom-start",
    middleware: [
      flip({ fallbackPlacements: ["top-start", "bottom-end", "top-end", "left"], fallbackStrategy: "bestFit", fallbackAxisSideDirection: 'end' }),
    ],
    strategy: "absolute",
  });
  refs.setReference(target);

  return (
    <div
      ref={refs.setFloating}
      role="tooltip"
      className="bg-white p-[10px] absolute top-0 left-0 z-[9999] max-w-[400px] rounded-md shadow-md border-[#ccc] border font-bold overflow-x-scroll m-2 border-solid"
      style={{
        font: '13px/1.3 "Helvetica Neue", Arial, sans-serif',
        zIndex: 2147483647,
        pointerEvents: targetSelectionActive ? "none" : "auto",
        ...floatingStyles,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
