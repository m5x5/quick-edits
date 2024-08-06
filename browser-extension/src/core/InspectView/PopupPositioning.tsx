import {flip, platform, useFloating} from "@floating-ui/react-dom";

export default function PopupPositioning({target}:{target: HTMLElement | SVGElement}) {
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
    <div ref={refs.setFloating} style={{...floatingStyles}}>
      </div>
  )
}