import React from "react";

export default function InspectPopupContainer({
	children,
	targetSelectionActive,
}: { children: React.ReactNode; targetSelectionActive: boolean }) {

	return (
		<div
			role="tooltip"
			className="bg-white dark:bg-[#202124] absolute top-0 left-0 max-w-[400px] rounded-lg shadow-lg border border-gray-200 dark:border-[#3c4043] font-medium overflow-x-auto m-3 border-solid transition-all duration-200 ease-in-out backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
			style={{
				pointerEvents: targetSelectionActive ? "none" : "auto",
				position: "relative",
				zIndex: 1,
			}}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			onKeyDown={(e) => e.stopPropagation()}
		>
			{children}
		</div>
	);
}
