import type { SaveChangesData } from "../background/NativeMessageController";

export function saveChanges(data: SaveChangesData) {
  chrome.runtime.sendMessage(
    {
      action: "save_changes",
      data,
    },
    (response: unknown) => {
      console.debug("response", response);
    },
  );
}

/**
 * Sends the request to the background script to open the project.
 * The background script will message the native host to open the project in the editor.
 * @param path Ideally the absolute path
 */
export async function openPathInEditor(path: string) {
  return chrome.runtime.sendMessage({
    action: "open_editor",
    data: {
      path,
      lineNumber: 1,
      charNumber: 0,
      editor: (await chrome.storage.local.get(["editor"])).editor || "phpstorm",
    },
  });
}
