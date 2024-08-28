import React, { useEffect, useState } from "react";
import { performSearch } from "../../../content_script/performSearch";
import useMapping from "../hooks/useMapping";
import type { NativeResponse } from "../../../background/NativeMessageController";

type Match = {
  path: string;
  lineNumber: number;
  charNumber: number;
  shortenedPath: string;
}

export default function InspectPopupResults({
  target,
  ...props
}: { target: SVGElement | HTMLElement; astroResult?: boolean }) {
  const [results, setResults] = useState<
    Match[]
  >([]);
  const mapping = useMapping();

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    performSearch({
      classes: Array.from(target.classList.values()).join(' '),
      textContent: target.textContent || "",
      browserUrl: window.location.href,
    }).then((results) => {

      if (signal.aborted) {
        return;
      }

      setResults(results.map((result) => ({
        ...result,
        shortenedPath: result.path.replace(mapping?.searchFolder ?? "", ""),
      })));
    });
    return () => {
      abortController.abort();
    };
  }, [target, mapping?.searchFolder]);

  return (
    <div className="text-left">
      {results?.map((result, i) => (
        <button
          type="button"
          key={result.path + result.charNumber + result.lineNumber}
          className="text-[#666] cursor-pointer hover:text-[#000] block hover:bg-gray-100 text-left"
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
      ))}
    </div>
  );
}
