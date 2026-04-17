import { createRoot } from "react-dom/client";
import styles from "../../../dist/popup.css?inline";
import { ShadowDomProvider } from "../context/ShadowDomContext";
import DevToolbar from "./index";

export const initDevToolbar = () => {
	const existing = document.querySelectorAll(
		'my-shadow-host[data-dev-toolbar="true"]',
	);
	for (const el of existing) el.remove();

	const container = document.createElement("div");
	container.dataset.devToolbar = "true";

	const root = createRoot(container);

	root.render(
		<ShadowDomProvider parentElement={document.body}>
			<style>{styles}</style>
			<DevToolbar />
		</ShadowDomProvider>,
	);

	return container;
};
