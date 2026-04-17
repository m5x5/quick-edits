import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hotkeyKeyUX, startKeyUX } from "keyux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "../../../dist/popup.css?inline";
import { ShadowDomProvider } from "../context/ShadowDomContext";
import InspectPopup from "./InspectPopup";
import InspectPopupAstroSection from "./InspectPopup/InspectPopupAstroSection";
import InspectPopupClassList from "./InspectPopup/InspectPopupClassList";
import InspectPopupCSSProperties from "./InspectPopup/InspectPopupCSSProperties";
import { injectClassCSS } from "./InspectPopup/InspectPopupClassListInput";
import InspectPopupResults from "./InspectPopup/InspectPopupResults";
import InspectPopupTokens from "./InspectPopup/InspectPopupTokens";
import { getCssSelectorShort } from "./InspectPopup/utils";
import PopupPositioning from "./PopupPositioning";
import SelectBox from "./SelectBox";
import { ErrorBoundary } from "./components/ErrorBoundary";
import useSelectedTarget from "./hooks/useSelectedTarget";

startKeyUX(window, [hotkeyKeyUX()]);
const queryClient = new QueryClient();

export default function InspectView() {
  const { target, targetSelectionActive, clearTarget } = useSelectedTarget();
  const [state, setState] = useState({
    classes: "",
    additionalClasses: "",
    showSelectBox: true,
    movedToDevTools: false
  });

  const { classes, additionalClasses, showSelectBox, movedToDevTools } = state;

  useEffect(() => {
    if (target) {
      setState(prev => ({
        ...prev,
        classes: target.className,
        additionalClasses: "",
        movedToDevTools: false
      }));
      // Broadcast target selection for the DevToolbar tokens panel
      const selector = getCssSelectorShort(target);
      (window as any).__quickEditsCurrentSelector = selector;
      window.postMessage({
        type: "quick-edits:target-changed",
        selector,
      }, "*");
    } else {
      setState(prev => ({
        ...prev,
        classes: "",
        additionalClasses: ""
      }));
      (window as any).__quickEditsCurrentSelector = null;
      window.postMessage({
        type: "quick-edits:target-changed",
        selector: null,
      }, "*");
    }
  }, [target]);

  // Listen for class changes coming from DevTools panel
  useEffect(() => {
    const handler = (message: any) => {
      if (!target) return;
      const selector = getCssSelectorShort(target);

      if (message.type === 'devtools_class_update' && message.selector === selector) {
        // Apply class changes to the real DOM element
        target.classList.remove(...target.classList.values());
        const allClasses = [
          ...message.classes.split(' ').filter(Boolean),
          ...message.additionalClasses.split(' ').filter(Boolean),
        ];
        if (allClasses.length) {
          target.classList.add(...allClasses);
          injectClassCSS(allClasses);
        }

        setState(prev => ({
          ...prev,
          classes: message.classes,
          additionalClasses: message.additionalClasses,
        }));
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [target]);

  const setClasses = useCallback((newClasses: string) => {
    setState(prev => ({ ...prev, classes: newClasses }));
  }, []);

  const setAdditionalClasses = useCallback((newClasses: string) => {
    setState(prev => ({ ...prev, additionalClasses: newClasses }));
  }, []);

  const setShowSelectBox = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showSelectBox: show }));
  }, []);

  const combinedClasses = useMemo(
    () => `${classes} ${additionalClasses}`.trim(),
    [classes, additionalClasses]
  );

  const handleMoveToDevTools = useCallback(() => {
    if (!target) return;
    const cs = window.getComputedStyle(target);
    chrome.runtime.sendMessage({
      type: 'move_to_devtools',
      selector: getCssSelectorShort(target),
      tagName: target.tagName.toLowerCase(),
      classes,
      additionalClasses,
      dimensions: `${target.offsetWidth} × ${target.offsetHeight}`,
      computedStyles: {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        textAlign: cs.textAlign,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        gap: cs.gap,
        display: cs.display,
        position: cs.position,
        flexDirection: cs.flexDirection,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        width: cs.width,
        height: cs.height,
        minWidth: cs.minWidth,
        maxWidth: cs.maxWidth,
        minHeight: cs.minHeight,
        maxHeight: cs.maxHeight,
        borderTopWidth: cs.borderTopWidth,
        borderTopStyle: cs.borderTopStyle,
        borderTopColor: cs.borderTopColor,
        borderTopLeftRadius: cs.borderTopLeftRadius,
      },
    });
    // Hide popup but keep the highlight box
    setState(prev => ({ ...prev, movedToDevTools: true }));
  }, [target, classes, additionalClasses]);

  if (!target) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {showSelectBox && <SelectBox target={target} classes={combinedClasses} />}
        {!movedToDevTools && (
          <PopupPositioning target={target}>
            {(dragHandlers) => (
              <InspectPopup
                targetSelectionActive={targetSelectionActive}
                tagName={target.tagName}
                showSelectBox={showSelectBox}
                setShowSelectBox={setShowSelectBox}
                dragHandlers={dragHandlers}
                onMoveToDevTools={handleMoveToDevTools}
              >
                <InspectPopupClassList
                  key={getCssSelectorShort(target)}
                  target={target}
                  classes={classes}
                  setClasses={setClasses}
                  additionalClasses={additionalClasses}
                  setAdditionalClasses={setAdditionalClasses}
                  setShowSelectBox={setShowSelectBox}
                />
                <InspectPopupAstroSection target={target} />
                <InspectPopupTokens target={target} />
                <InspectPopupCSSProperties target={target} />
                <InspectPopupResults
                  target={target}
                  classes={classes}
                  additionalClasses={additionalClasses}
                />
              </InspectPopup>
            )}
          </PopupPositioning>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
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
    <ShadowDomProvider parentElement={document.body}>
      <style>{styles}</style>
      <InspectView />
    </ShadowDomProvider>,
  );

  return popup;
};
