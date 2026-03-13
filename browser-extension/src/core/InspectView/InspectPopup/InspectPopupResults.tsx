import { useEffect, useState } from "react";
import { performSearch } from "../../../content_script/performSearch";
import { saveChanges } from "../../../content_script/utils";
import Button from "../../Button";
import useMapping from "../hooks/useMapping";

function commonPathPrefix(paths: string[]): string {
  if (paths.length < 2) return "";
  let prefix = paths[0];
  for (const p of paths.slice(1)) {
    while (!p.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) return "";
  }
  const lastSlash = prefix.lastIndexOf("/");
  return lastSlash >= 0 ? prefix.slice(0, lastSlash + 1) : "";
}

type Match = {
  path: string;
  lineNumber: number;
  charNumber: number;
  shortenedPath: string;
  isDirectMatch: boolean;
  ancestorLevel: number; // 0 = the element itself, 1–4 = levels up
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

    const search = async () => {
      let current: Element | null = target;
      for (let level = 0; level <= 4; level++) {
        if (!current || signal.aborted) return;

        const found = await performSearch({
          classes: Array.from(current.classList.values()).join(" "),
          textContent: current.textContent || "",
          browserUrl: window.location.href,
        });

        if (signal.aborted) return;

        if (found.length > 0) {
          setResults(
            found
              .map((result) => ({
                ...result,
                shortenedPath: result.path.replace(mapping?.searchFolder ?? "", ""),
                ancestorLevel: level,
              }))
              .sort((a, b) => {
                if (a.isDirectMatch && !b.isDirectMatch) return -1;
                if (!a.isDirectMatch && b.isDirectMatch) return 1;
                return 0;
              }),
          );
          return;
        }

        current = current.parentElement;
      }
      setResults([]);
    };

    search();
    return () => {
      abortController.abort();
    };
  }, [target, mapping?.searchFolder]);

  const commonPrefix = commonPathPrefix(results.map((r) => r.shortenedPath));

  return (
    <div className="text-left">
      {results?.map((result, i) => (
        <>
          <div key={result.path + result.charNumber + result.lineNumber}>
            <button
              type="button"
              className={`dark:text-[#e8eaed] text-[#292a2d] cursor-pointer hover:bg-gray-200 bg-transparent dark:hover:bg-[#292a2d] block text-left px-2 py-2 rounded-md transition-colors duration-200 ${result.isDirectMatch ? "border-0 border-l-4 border-[#8ab4f8] bg-[#1a73e8]/10" : "border-0"}`}
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
                      editorPath:
                        (await chrome.storage.local.get(["editor"])).editorPath ||
                        "",
                    },
                  },
                  () => { }
                );
              }}
            >
              <span className="flex items-center gap-1.5">
                {result.ancestorLevel > 0 && (
                  <span
                    title={`Matched ${result.ancestorLevel} level${result.ancestorLevel > 1 ? "s" : ""} up`}
                    className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400 shrink-0"
                  >
                    {Array.from({ length: result.ancestorLevel }).map((_, i) => (
                      <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
                      </svg>
                    ))}
                  </span>
                )}
                {`${result.shortenedPath.slice(commonPrefix.length)}:${result.lineNumber}:${result.charNumber}`}
              </span>
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
