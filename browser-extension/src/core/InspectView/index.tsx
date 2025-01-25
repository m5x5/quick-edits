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
  const { target, targetSelectionActive, left, up, down, right, ref } = useSelectedTarget();
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
        >
          <div className="border-y border-[#3c4043] flex items-center bg-[#202124] px-2 py-1">
            <button type="button" onClick={left} ref={ref} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Left</title>
                <path
                  d="M10 15L5 10L10 5L11.062 6.062L7.125 10L11.062 13.938L10 15Z"
                  fill="black"
                />
                <circle cx="12.5" cy="10.125" r="1.25" fill="black" />
              </svg>
            </button>
            <button type="button" onClick={up} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Out</title>
                <path
                  d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm-.75-6.5V4.875L7.062 7.062 6 6l4-4 4 4-1.062 1.062-2.188-2.187V11.5h-1.5Z"
                  fill="#000"
                />
              </svg>
            </button>
            <button type="button" onClick={down} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>In</title>
                <path
                  d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm0-6.5-4-4 1.062-1.062L9.25 8.625V2h1.5v6.625l2.188-2.187L14 7.5l-4 4Z"
                  fill="#000"
                />
              </svg>
            </button>
            <button type="button" onClick={right} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Right</title>
                <path
                  d="M7.99999 15L6.93799 13.938L10.875 10L6.93799 6.062L7.99999 5L13 10L7.99999 15Z"
                  fill="black"
                />
              </svg>
            </button>
            <button
            onClick={() => {
              setShowSelectBox(!showSelectBox);
            }}
            >
              Toggle Select box
            </button>
          </div>
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
