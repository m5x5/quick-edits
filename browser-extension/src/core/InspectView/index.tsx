import { hotkeyKeyUX, startKeyUX } from "keyux";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import SelectBox from "./SelectBox";
import styles from "../../../dist/popup.css?inline";
import { ShadowDom } from "../ShadowDom";
import useSelectedTarget from "./hooks/useSelectedTarget";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PopupPositioning from "./PopupPositioning";
import InspectPopup from "./InspectPopup";
import InspectPopupAstroSection from "./InspectPopup/InspectPopupAstroSection";
import InspectPopupClassList from "./InspectPopup/InspectPopupClassList";
import InspectPopupResults from "./InspectPopup/InspectPopupResults";

startKeyUX(window, [hotkeyKeyUX()]);
const queryClient = new QueryClient();

export default function InspectView() {
	const { target, targetSelectionActive } = useSelectedTarget();
	const [classes, setClasses] = useState<string>("");
	const [additionalClasses, setAdditionalClasses] = useState<string>("");

	useEffect(() => {
		if (target) setClasses(target.className);
	}, [target]);

	if (!target) return null;

	return (
		<QueryClientProvider client={queryClient}>
			<SelectBox target={target} classes={`${classes} ${additionalClasses}`} />
			<PopupPositioning target={target}>
				<InspectPopup
					targetSelectionActive={targetSelectionActive}
					tagName={target.tagName}
				>
					<InspectPopupClassList
						target={target}
						classes={classes}
						setClasses={setClasses}
						additionalClasses={additionalClasses}
						setAdditionalClasses={setAdditionalClasses}
					/>
					<InspectPopupAstroSection target={target} />
					<InspectPopupResults target={target} />
				</InspectPopup>
			</PopupPositioning>
		</QueryClientProvider>
	);
}

export const initPopup = () => {
	const popups = document.querySelectorAll(
		'my-shadow-host[data-ws-developer-tools="true"]',
	);

	for (const popup of popups) popup?.remove();

	const popup = document.createElement("div");
	popup.dataset.wsDeveloperTools = "true";

	const root = createRoot(popup);

	root.render(
		<ShadowDom parentElement={document.body}>
			<style>{styles}</style>
			<InspectView />
		</ShadowDom>,
	);

	return popup;
};
