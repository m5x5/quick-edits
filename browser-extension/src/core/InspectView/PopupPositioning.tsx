import { flip, shift, offset, platform, useFloating } from "@floating-ui/react-dom";
import React, { type ReactNode, useEffect } from "react";

export default function PopupPositioning({
	target,
	children,
}: {
	target: HTMLElement | SVGElement;
	children: ReactNode;
}) {
	const { refs, floatingStyles, update } = useFloating({
		platform: {
			...platform,
		},
		placement: "bottom-start",
		middleware: [
			offset(8),
			flip({
				fallbackPlacements: ["top-start", "bottom-end", "top-end", "left"],
				fallbackStrategy: "bestFit",
				fallbackAxisSideDirection: "end",
			}),
			shift({ padding: 8 }),
		],
		strategy: "absolute",
	});

	useEffect(() => {
		const handleUpdatePosition = () => {
			update();
		};

		document.addEventListener('updatePopupPosition', handleUpdatePosition);
		return () => {
			document.removeEventListener('updatePopupPosition', handleUpdatePosition);
		};
	}, [update]);


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
