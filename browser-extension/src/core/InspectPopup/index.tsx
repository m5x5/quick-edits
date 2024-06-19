import { flip, platform, useFloating } from "@floating-ui/react-dom";
import { hotkeyKeyUX, startKeyUX } from "keyux";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AstroButton from "./AstroButton";
import SelectBox from "./SelectBox";
import styles from "../../../dist/popup.css?inline";
import { ShadowDom } from "../ShadowDom";
import InspectPopupClassList from "./InspectPopupClassList";

type ActionType = "perform_search" | "open_editor" | "watch_extension_update";

type NativeResponse<T extends ActionType> = {
  success: boolean;
  message: string;
} & T extends "perform_search"
  ? { data: { path: string; lineNumber: number; charNumber: number }[] }
  : T extends "open_editor"
  ? object
  : T extends "watch_extension_update"
  ? { data: { updated: boolean } }
  : never;

startKeyUX(window, [hotkeyKeyUX()]);

export default function InspectPopup({
  tagName,
  classes: defaultClasses,
  target,
  results,
  astroResult,
}: {
  tagName: string;
  classes: string;
  target: HTMLElement | SVGElement;
  results?: {
    path: string;
    shortenedPath: string;
    lineNumber: number;
    charNumber: number;
  }[];
  astroResult?: {
    file: string;
    loc: string;
  };
}) {
  const [classes, setClasses] = useState<string>(defaultClasses);
  const [additionalClasses, setAdditionalClasses] = useState<string>("");

  if (results && results.length > 10) {
    results.length = 10;
  }
  const { refs, floatingStyles } = useFloating({
    platform: {
      ...platform,
    },
    placement: "bottom-start",
    middleware: [
      flip({ fallbackPlacements: ["top-start", "bottom-end", "top-end", "left"], fallbackStrategy: "bestFit", fallbackAxisSideDirection: 'end' }),
    ],
    strategy: "absolute",
  });
  refs.setReference(target);

  return (
    <ShadowDom parentElement={document.body}>
      <style>{styles}</style>
      <div
        ref={refs.setFloating}
        role="tooltip"
        className="quick-edits bg-white p-[10px] absolute top-0 left-0 z-[9999] max-w-[400px] rounded-md shadow-md border-[#ccc] border font-bold overflow-x-scroll m-2 border-solid"
        style={{
          font: '13px/1.3 "Helvetica Neue", Arial, sans-serif',
          zIndex: 2147483647,
          ...floatingStyles,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="text-[#77006e] font-bold">{tagName.toLowerCase()}</span>
        <InspectPopupClassList target={target} classes={classes} setClasses={setClasses} additionalClasses={additionalClasses} setAdditionalClasses={setAdditionalClasses} />
        <div>
          {results?.map((result, i) => (
            <button
              type="button"
              key={result.path + result.charNumber + result.lineNumber}
              className="text-[#666] cursor-pointer hover:text-[#000] block"
              aria-keyshortcuts={!astroResult && i === 0 ? "meta+enter" : undefined}
              onMouseDown={async () => {
                chrome.runtime.sendMessage(
                  {
                    action: "open_editor",
                    data: {
                      path: result.path,
                      lineNumber: result.lineNumber,
                      charNumber: result.charNumber,
                      editor: (await chrome.storage.local.get(['editor'])).editor || "phpstorm"
                    },
                  },
                  (response: NativeResponse<"open_editor">) => {
                    console.log("response", response);
                  }
                );
              }}
            >
              {`${result.shortenedPath}:${result.lineNumber}:${result.charNumber}`}
            </button>
          ))}
          {astroResult && (
            <div className="mt-2">
              <span className="text-[11px] text-gray-700">ASTRO COMPONENT</span>
              <br />
              <AstroButton
                onClick={() => {
                  chrome.runtime.sendMessage(
                    {
                      action: "open_editor",
                      data: {
                        path: astroResult.file,
                        lineNumber: +astroResult.loc.split(":")[0],
                        charNumber: +astroResult.loc.split(":")[1],
                      },
                    }
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
      <SelectBox target={target} classes={`${classes} ${additionalClasses}`} />
    </ShadowDom>
  );
}

export const initPopup = ({
  tagName,
  classes,
  target,
  results,
  astroResult,
}: {
  tagName: string;
  classes: string;
  target: HTMLElement | SVGElement;
  results?: {
    path: string;
    lineNumber: number;
    charNumber: number;
    shortenedPath: string;
  }[];
  astroResult?: {
    file: string;
    loc: string;
  };
}) => {
  let popup = document.querySelector<HTMLDivElement>(
    "[data-ws-developer-tools]"
  );

  if (!popup) {
    popup = document.createElement("div");
    popup.dataset.wsDeveloperTools = "true";
  }

  const root = createRoot(popup);

  root.render(
    <InspectPopup
      tagName={tagName}
      classes={classes}
      target={target}
      results={results}
      astroResult={astroResult}
    />
  );

  return popup;
};
