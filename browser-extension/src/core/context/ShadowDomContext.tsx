import React, { createContext, type ReactPortal, useContext } from "react";
import { createPortal } from "react-dom";

interface ShadowDomContextType {
  shadowRoot: ShadowRoot;
  shadowHost: HTMLElement;
  portal: ReactPortal;
}

const ShadowDomContext = createContext<ShadowDomContextType | null>(null);

export function ShadowDomProvider({
  parentElement,
  children,
}: {
  parentElement: Element;
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

  const portal = createPortal(children, shadowRoot);

  return (
    <ShadowDomContext.Provider value={{ shadowRoot, shadowHost, portal }}>
      {portal}
    </ShadowDomContext.Provider>
  );
}

export function useShadowDom() {
  const context = useContext(ShadowDomContext);
  if (!context) {
    throw new Error("useShadowDom must be used within a ShadowDomProvider");
  }

  return context;
}
