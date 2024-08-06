import { hotkeyKeyUX, startKeyUX } from "keyux";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AstroButton from "./AstroButton";
import SelectBox from "./SelectBox";
import styles from "../../../dist/popup.css?inline";
import { ShadowDom } from "../ShadowDom";
import InspectPopupClassList from "./InspectPopupClassList";
import useSelectedTarget from "./hooks/useSelectedTarget";
import InspectPopupContainer from "./InspectPopupContainer";
import InspectPopupResults from "./InspectPopupResults";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

startKeyUX(window, [hotkeyKeyUX()]);
const queryClient = new QueryClient();

export default function InspectPopup(props: {
  tagName?: string;
  classes?: string;
  astroResult?: {
    file: string;
    loc: string;
  };
}) {
  const { target, targetSelectionActive } = useSelectedTarget();
  const [classes, setClasses] = useState<string>('');
  const [additionalClasses, setAdditionalClasses] = useState<string>("");

  useEffect(() => {
    if (target) setClasses(target.className);
  }, [target])

  if (!target) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SelectBox target={target} classes={`${classes} ${additionalClasses}`} />
      <style>{styles}</style>
      <InspectPopupContainer target={target} targetSelectionActive={targetSelectionActive}>
        <span className="text-[#77006e] font-bold">{target?.tagName?.toLowerCase()}</span>
        <InspectPopupClassList target={target} classes={classes} setClasses={setClasses} additionalClasses={additionalClasses} setAdditionalClasses={setAdditionalClasses} />
        <div>
          <InspectPopupResults target={target} />
          {props.astroResult && (
            <div className="mt-2">
              <span className="text-[11px] text-gray-700">ASTRO COMPONENT</span>
              <br />
              <AstroButton
                onClick={() => {
                  chrome.runtime.sendMessage(
                    {
                      action: "open_editor",
                      data: {
                        path: props.astroResult?.file,
                        lineNumber: +props.astroResult?.loc.split(":")[0],
                        charNumber: +props.astroResult?.loc.split(":")[1],
                      },
                    }
                  );
                }}
              />
            </div>
          )}
        </div>
      </InspectPopupContainer>
      <SelectBox target={target} classes={`${classes} ${additionalClasses}`} />
    </QueryClientProvider>
  );
}

export const initPopup = () => {
  const popups = document.querySelectorAll(
    'my-shadow-host[data-ws-developer-tools="true"]'
  );

  for (const popup of popups) popup?.remove();

  const popup = document.createElement("div");
  popup.dataset.wsDeveloperTools = "true";

  const root = createRoot(popup);

  root.render(
    <ShadowDom parentElement={document.body}>
      <InspectPopup />
    </ShadowDom >
  );

  return popup;
};
