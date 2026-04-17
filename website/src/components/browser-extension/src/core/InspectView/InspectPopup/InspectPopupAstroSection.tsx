import AstroButton from "../AstroButton";
import React from "react";

export default function InspectPopupAstroSection({
	astroResult,
}: {
	target: HTMLElement;
	astroResult?: {
		file: string;
		loc: string;
	};
}) {
	if (!astroResult) {
		return null;
	}

	return (
		<div className="mt-2">
			<span className="text-[11px] text-gray-700">ASTRO COMPONENT</span>
			<br />
			<AstroButton
				onClick={() => {
					chrome.runtime.sendMessage({
						action: "open_editor",
						data: {
							path: astroResult.file,
							lineNumber: +astroResult.loc.split(":")[0],
							charNumber: +astroResult.loc.split(":")[1],
						},
					});
				}}
			/>
		</div>
	);
}
