import React from "react";
import ReactDOM from "react-dom";

export function ShadowDom({
	parentElement,
	children,
}: {
	parentElement: Element;
	position?: InsertPosition;
	children: React.ReactNode;
}) {
	const [shadowHost] = React.useState(() =>
		document.createElement("my-shadow-host"),
	);

	const [shadowRoot] = React.useState(() =>
		shadowHost.attachShadow({ mode: "closed" }),
	);

	React.useLayoutEffect(() => {
		if (shadowHost) {
			shadowHost.dataset.wsDeveloperTools = "true";
		}

		if (parentElement) {
			parentElement.appendChild(shadowHost);
		}

		return () => {
			shadowHost.remove();
		};
	}, [parentElement, shadowHost]);

	return ReactDOM.createPortal(children, shadowRoot);
}
