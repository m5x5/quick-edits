import { SaveChangesData } from "../background/NativeMessageController";

/**
 * Sends the request to the background script to open the project.
 * The background script will message the native host to open the project in the editor.
 * @param path Ideally the absolute path
 */
export function openFileInEditor(path: string) {
  chrome.runtime.sendMessage(
    {
      action: "open_editor",
      data: {
        path,
        lineNumber: 1,
        charNumber: 0,
        editor: "zed",
      },
    },
    (response: any) => {
      console.log("response", response);
    },
  );
}

export function saveChanges(data: SaveChangesData) {
  chrome.runtime.sendMessage(
    {
      action: "save_changes",
      data,
    },
    (response: any) => {
      console.log("response", response);
    },
  );
}

export async function openFolderInEditor(path: string) {
  const response = chrome.runtime.sendMessage({
    action: "open_editor",
    data: {
      path,
      lineNumber: 1,
      charNumber: 0,
      editor: (await chrome.storage.local.get(["editor"])).editor || "phpstorm",
    },
  });

  return response;
}
