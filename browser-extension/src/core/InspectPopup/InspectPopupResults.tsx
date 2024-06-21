import React, { useEffect, useState } from "react";
import { performSearch } from "../../content_script/performSearch";
import type { NativeResponse } from "../../background/NativeMessageController";
import useMapping from "./hooks/useMapping";

export default function InspectPopupResults({ target, ...props }: { target: HTMLElement, astroResult?: boolean }) {
  const [results, setResults] = useState<{ path: string, lineNumber: number, charNumber: number }[]>([]);
  const mapping = useMapping();

  useEffect(() => {
    performSearch({
      classes: target.className,
      textContent: target.textContent || "",
    }).then((results) => {
      setResults(results);
    });
  }, [target]);

  if (mapping?.searchFolder && results.length > 0) {
    for (const result of results) {
      result.shortenedPath = result.path.replace(mapping.searchFolder, '');
    }
  }

  return (
    <div className="text-left">
      {results?.map((result, i) => (
        <button
          type="button"
          key={result.path + result.charNumber + result.lineNumber}
          className="text-[#666] cursor-pointer hover:text-[#000] block hover:bg-gray-100"
          aria-keyshortcuts={!props.astroResult && i === 0 ? "meta+enter" : undefined}
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
    </div>
  )
}
