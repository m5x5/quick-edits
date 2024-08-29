import React, { useEffect, useState } from "react";
import { performSearch } from "../../../content_script/performSearch";
import useMapping from "../hooks/useMapping";
import type { NativeResponse } from "../../../background/NativeMessageController";
import { saveChanges } from "../../../content_script/utils";

type Match = {
  path: string;
  lineNumber: number;
  charNumber: number;
  shortenedPath: string;
  isDirectMatch: boolean;
};

export default function InspectPopupResults({
  target,
  ...props
}: {
  target: SVGElement | HTMLElement;
  astroResult?: boolean;
  classes: string;
  additionalClasses: string;
}) {
  const [results, setResults] = useState<Match[]>([]);
  const mapping = useMapping();

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    performSearch({
      classes: Array.from(target.classList.values()).join(" "),
      textContent: target.textContent || "",
      browserUrl: window.location.href,
    }).then((results) => {
      console.log("results", results);
      if (signal.aborted) {
        return;
      }

      setResults(
        results.map((result) => ({
          ...result,
          shortenedPath: result.path.replace(mapping?.searchFolder ?? "", ""),
        })).sort((a, b) => {
          if (a.isDirectMatch && !b.isDirectMatch) {
            return -1;
          }
          if (!a.isDirectMatch && b.isDirectMatch) {
            return 1;
          }
          return 0;
        }),
      );
    });
    return () => {
      abortController.abort();
    };
  }, [target, mapping?.searchFolder]);

  return (
    <div className="text-left">
      {results?.map((result, i) => (
        <>
          <div key={result.path + result.charNumber + result.lineNumber}>
            <button
              type="button"
              className={`text-[#666] cursor-pointer hover:text-[#000] block hover:bg-gray-100 text-left  ${result.isDirectMatch ? "border-l-4 border-2 border-yellow-300" : ""}`}
              aria-keyshortcuts={
                !props.astroResult && i === 0 ? "meta+enter" : undefined
              }
              onMouseDown={async () => {
                chrome.runtime.sendMessage(
                  {
                    action: "open_editor",
                    data: {
                      path: result.path,
                      lineNumber: result.lineNumber,
                      charNumber: result.charNumber,
                      editor:
                        (await chrome.storage.local.get(["editor"])).editor ||
                        "phpstorm",
                    },
                  },
                  (response: NativeResponse<"open_editor">) => {
                    console.log("response", response);
                  },
                );
              }}
            >
              {`${result.shortenedPath}:${result.lineNumber}:${result.charNumber}`}
            </button>
            <button
              type="button"
              disabled={props.additionalClasses === ""}
              className={`bg-blue-600 px-1 rounded-sm text-white hover:bg-blue-700 disabled:bg-gray-500`}
              onClick={() => {
                console.log(props.classes, props.additionalClasses);
                saveChanges({
                  originalContent: props.classes,
                  newContent: `${props.classes} ${props.additionalClasses}`,
                  charNumber: result.charNumber,
                  lineNumber: result.lineNumber,
                  path: result.path,
                });

                alert("Save button clicked");
              }}
            >
              Save
            </button>
          </div>
        </>
      ))}
    </div>
  );
}
