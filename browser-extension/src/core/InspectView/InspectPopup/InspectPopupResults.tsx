import React, { useEffect, useState } from "react";
import { performSearch } from "../../../content_script/performSearch";
import useMapping from "../hooks/useMapping";
import type { NativeResponse } from "../../../background/NativeMessageController";
import { saveChanges } from "../../../content_script/utils";
import Button from "../../Button";

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
              className={`text-[#e8eaed] cursor-pointer hover:bg-[#292a2d] block hover:bg-[#3c4043] text-left px-4 py-3 rounded-md transition-colors duration-200 ${result.isDirectMatch ? "border-l-4 border-[#8ab4f8] bg-[#1a73e8]/10" : ""}`}
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
                    console.debug("response", response);
                  },
                );
              }}
            >
              {`${result.shortenedPath}:${result.lineNumber}:${result.charNumber}`}
            </button>
            <Button
              type="button"
              disabled={props.additionalClasses === ""}
              onClick={() => {
                saveChanges({
                  originalContent: props.classes,
                  newContent: `${props.classes} ${props.additionalClasses}`,
                  charNumber: result.charNumber,
                  lineNumber: result.lineNumber,
                  path: result.path,
                });
              }}
            >
              Save
            </Button>
          </div>
        </>
      ))}
    </div>
  );
}
