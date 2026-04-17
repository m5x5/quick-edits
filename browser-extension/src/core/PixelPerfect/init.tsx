import { createRoot } from "react-dom/client";
import styles from "../../../dist/popup.css?inline";
import { ShadowDomProvider } from "../context/ShadowDomContext";
import PixelPerfect from "./index";

export const initPixelPerfect = () => {
	const existing = document.querySelectorAll(
		'my-shadow-host[data-pixel-perfect="true"]',
	);
	for (const el of existing) el.remove();

	const container = document.createElement("div");
	container.dataset.pixelPerfect = "true";

	const root = createRoot(container);

	root.render(
		<ShadowDomProvider parentElement={document.body}>
			<style>{styles}</style>
			<PixelPerfect />
		</ShadowDomProvider>,
	);

	return container;
};
