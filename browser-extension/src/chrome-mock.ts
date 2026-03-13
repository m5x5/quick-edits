// Chrome API shim for the standalone dev page.
// Imported as a side effect before any component imports.
(globalThis as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: async (keys: string | string[]) => {
        const data: Record<string, unknown> = {
          showArrowControls: true,
          editor: "vscode",
          editorPath: "",
          excludedDirectories: [],
          projectMappings: [
            {
              pattern: "localhost:5173",
              searchFolder:
                "/Users/michael/Software/quick-edits/browser-extension/src",
            },
          ],
        };
        if (typeof keys === "string") return { [keys]: data[keys] };
        return Object.fromEntries(
          (keys as string[]).map((k) => [k, data[k]]),
        );
      },
      set: async () => {},
    },
  },
  runtime: {
    sendMessage: (
      msg: Record<string, unknown>,
      callback?: (response: unknown) => void,
    ) => {
      if (msg?.action === "perform_search") {
        callback?.({
          data: [
            {
              path: "/Users/michael/Software/quick-edits/browser-extension/src/core/InspectView/InspectPopup/InspectPopupClassList.tsx",
              lineNumber: 29,
              charNumber: 1,
              isDirectMatch: true,
            },
            {
              path: "/Users/michael/Software/quick-edits/browser-extension/src/core/InspectView/InspectPopup/InspectPopupContainer.tsx",
              lineNumber: 8,
              charNumber: 3,
              isDirectMatch: true,
            },
            {
              path: "/Users/michael/Software/quick-edits/browser-extension/src/core/InspectView/InspectPopup/InspectPopupResults.tsx",
              lineNumber: 15,
              charNumber: 1,
              isDirectMatch: false,
            },
            {
              path: "/Users/michael/Software/quick-edits/browser-extension/src/core/InspectView/index.tsx",
              lineNumber: 76,
              charNumber: 12,
              isDirectMatch: false,
            },
            {
              path: "/Users/michael/Software/quick-edits/browser-extension/src/core/InspectView/PopupPositioning.tsx",
              lineNumber: 44,
              charNumber: 7,
              isDirectMatch: false,
            },
          ],
        });
      } else {
        callback?.({});
      }
      return true;
    },
    lastError: undefined as { message?: string } | undefined,
  },
};
