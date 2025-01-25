import React from "react";
import InspectPopupContainer from "./InspectPopupContainer";

export default function InspectPopup({
	children,
	targetSelectionActive,
	tagName,
}: {
	targetSelectionActive: boolean;
	tagName: string;
	children: React.ReactNode;
}) {
	return (
		<InspectPopupContainer targetSelectionActive={targetSelectionActive}>
			<div className="bg-[#202124] rounded-sm shadow-lg">
				<div className="px-3 py-1.5 border-b border-[#3c4043]">
					<span className="text-blue-200 font-mono text-[13px]">{tagName?.toLowerCase()}</span>
				</div>
				<div className="p-3">{children}</div>
			</div>
		</InspectPopupContainer>
	);
}
