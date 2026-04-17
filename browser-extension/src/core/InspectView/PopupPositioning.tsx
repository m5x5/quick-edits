import { flip, shift, offset, platform, useFloating } from "@floating-ui/react-dom";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export type DragHandlers = {
	onPointerDown: (e: React.PointerEvent) => void;
	onPointerMove: (e: React.PointerEvent) => void;
	onPointerUp: (e: React.PointerEvent) => void;
	/** True while a drag is actively in progress */
	isDragging: boolean;
};

const DRAG_THRESHOLD = 4; // px movement before drag starts

export default function PopupPositioning({
	target,
	children,
}: {
	target: HTMLElement | SVGElement;
	children: (dragHandlers: DragHandlers) => ReactNode;
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

	const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const pointerDown = useRef(false);
	const dragStarted = useRef(false);
	const startPoint = useRef({ pointerX: 0, pointerY: 0, elX: 0, elY: 0 });

	// Reset drag position when target changes (new element inspected)
	useEffect(() => {
		setDragPos(null);
	}, [target]);

	useEffect(() => {
		const handleUpdatePosition = () => {
			if (!dragPos) {
				update();
			}
		};

		document.addEventListener('updatePopupPosition', handleUpdatePosition);
		return () => {
			document.removeEventListener('updatePopupPosition', handleUpdatePosition);
		};
	}, [update, dragPos]);

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
		pointerDown.current = true;
		dragStarted.current = false;

		const floatingEl = refs.floating.current;
		if (!floatingEl) return;

		const rect = floatingEl.getBoundingClientRect();
		startPoint.current = {
			pointerX: e.clientX,
			pointerY: e.clientY,
			elX: dragPos ? dragPos.x : rect.left + window.scrollX,
			elY: dragPos ? dragPos.y : rect.top + window.scrollY,
		};
	}, [refs.floating, dragPos]);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!pointerDown.current) return;

		const dx = e.clientX - startPoint.current.pointerX;
		const dy = e.clientY - startPoint.current.pointerY;

		// Only start drag after threshold
		if (!dragStarted.current) {
			if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
			dragStarted.current = true;
			setIsDragging(true);
			// Capture pointer once we commit to dragging
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		}

		setDragPos({
			x: startPoint.current.elX + dx,
			y: startPoint.current.elY + dy,
		});
	}, []);

	const onPointerUp = useCallback((e: React.PointerEvent) => {
		if (dragStarted.current) {
			try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
		}
		pointerDown.current = false;
		dragStarted.current = false;
		setIsDragging(false);
	}, []);

	refs.setReference(target);

	const positionStyle: React.CSSProperties = dragPos
		? {
			position: 'absolute',
			top: dragPos.y,
			left: dragPos.x,
			font: '13px/1.3 "Helvetica Neue", Arial, sans-serif',
			zIndex: 2147483647,
		}
		: {
			...floatingStyles,
			font: '13px/1.3 "Helvetica Neue", Arial, sans-serif',
			zIndex: 2147483647,
		};

	return (
		<div
			ref={refs.setFloating}
			style={positionStyle}
		>
			{children({ onPointerDown, onPointerMove, onPointerUp, isDragging })}
		</div>
	);
}
