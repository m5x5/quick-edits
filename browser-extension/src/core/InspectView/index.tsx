import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hotkeyKeyUX, startKeyUX } from "keyux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "../../../dist/popup.css?inline";
import { ShadowDomProvider } from "../context/ShadowDomContext";
import InspectPopup from "./InspectPopup";
import InspectPopupAstroSection from "./InspectPopup/InspectPopupAstroSection";
import InspectPopupClassList from "./InspectPopup/InspectPopupClassList";
import InspectPopupResults from "./InspectPopup/InspectPopupResults";
import { getCssSelectorShort } from "./InspectPopup/utils";
import PopupPositioning from "./PopupPositioning";
import SelectBox from "./SelectBox";
import { ErrorBoundary } from "./components/ErrorBoundary";
import useSelectedTarget from "./hooks/useSelectedTarget";

startKeyUX(window, [hotkeyKeyUX()]);
const queryClient = new QueryClient();

export default function InspectView() {
  const { target, targetSelectionActive } = useSelectedTarget();
  const [state, setState] = useState({
    classes: "",
    additionalClasses: "",
    showSelectBox: true
  });

  const { classes, additionalClasses, showSelectBox } = state;

  useEffect(() => {
    if (target) {
      setState(prev => ({
        ...prev,
        classes: target.className,
        additionalClasses: ""
      }));
    } else {
      setState(prev => ({
        ...prev,
        classes: "",
        additionalClasses: ""
      }));
    }
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

  if (!target) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {showSelectBox && <SelectBox target={target} classes={combinedClasses} />}
        <PopupPositioning target={target}>
          <InspectPopup
            targetSelectionActive={targetSelectionActive}
            tagName={target.tagName}
            showSelectBox={showSelectBox}
            setShowSelectBox={setShowSelectBox}
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
            <InspectPopupResults
              target={target}
              classes={classes}
              additionalClasses={additionalClasses}
            />
          </InspectPopup>
        </PopupPositioning>
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
