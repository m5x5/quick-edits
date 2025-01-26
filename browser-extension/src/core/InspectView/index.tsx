import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hotkeyKeyUX, startKeyUX } from "keyux";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "../../../dist/popup.css?inline";
import { ShadowDom } from "../ShadowDom";
import InspectPopup from "./InspectPopup";
import InspectPopupAstroSection from "./InspectPopup/InspectPopupAstroSection";
import InspectPopupClassList from "./InspectPopup/InspectPopupClassList";
import InspectPopupResults from "./InspectPopup/InspectPopupResults";
import { getCssSelectorShort } from "./InspectPopup/utils";
import PopupPositioning from "./PopupPositioning";
import SelectBox from "./SelectBox";
import useSelectedTarget from "./hooks/useSelectedTarget";

startKeyUX(window, [hotkeyKeyUX()]);
const queryClient = new QueryClient();

export default function InspectView() {
  const { target, targetSelectionActive, } = useSelectedTarget();
  const [classes, setClasses] = useState<string>("");
  const [additionalClasses, setAdditionalClasses] = useState<string>("");
  const [showSelectBox, setShowSelectBox] = useState<boolean>(true);

  useEffect(() => {
    if (target) {
      setClasses(target.className);
      setAdditionalClasses("");
    } else {
      setClasses("");
      setAdditionalClasses("");
    }
  }, [target]);

  if (!target) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {showSelectBox && <SelectBox target={target} classes={`${classes} ${additionalClasses}`} />}
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
          <InspectPopupResults target={target} classes={classes} additionalClasses={additionalClasses} />
        </InspectPopup>
      </PopupPositioning >
    </QueryClientProvider >
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
