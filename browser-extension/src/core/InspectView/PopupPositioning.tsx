import { flip, platform, useFloating } from "@floating-ui/react-dom";
import React, { type ReactNode } from "react";

export default function PopupPositioning({
	target,
	children,
}: {
	target: HTMLElement | SVGElement;
	children: ReactNode;
}) {
	const { refs, floatingStyles } = useFloating({
		platform: {
			...platform,
		},
		placement: "bottom-start",
		middleware: [
			flip({
				fallbackPlacements: ["top-start", "bottom-end", "top-end", "left"],
				fallbackStrategy: "bestFit",
				fallbackAxisSideDirection: "end",
			}),
		],
		strategy: "absolute",
	});

	refs.setReference(target);

	return (
		<div
			ref={refs.setFloating}
			style={{
				...floatingStyles,
				font: '13px/1.3 "Helvetica Neue", Arial, sans-serif',
				zIndex: 2147483647,
			}}
		>
			{children}
		</div>
	);
}
