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

    // Stop pointer/mouse events on the shadow host from reaching
    // the page behind the popup. Without this, clicking inside the
    // popup also triggers buttons/links underneath it because the
    // shadow DOM retargets the event to the host element.
    const stop = (e: Event) => {
      e.stopPropagation();
    };
    const events = ["mousedown", "mouseup", "click", "pointerdown", "pointerup", "dblclick", "contextmenu"] as const;
    for (const evt of events) {
      shadowHost.addEventListener(evt, stop);
    }

    if (parentElement) {
      parentElement.appendChild(shadowHost);
    }

    return () => {
      for (const evt of events) {
        shadowHost.removeEventListener(evt, stop);
      }
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
