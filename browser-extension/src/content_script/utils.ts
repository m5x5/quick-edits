import type { SaveChangesData } from "../background/NativeMessageController";

export function saveChanges(data: SaveChangesData) {
  console.log('QuickEdits Extension: Saving changes:', data);
  chrome.runtime.sendMessage(
    {
      action: "save_changes",
      data,
    },
    (response: unknown) => {
      if (!response) {
        console.error('QuickEdits Extension: No response received from save changes request');
        return;
      }
      console.log('QuickEdits Extension: Save changes response:', response);
    },
  );
}

/**
 * Sends the request to the background script to open the project.
 * The background script will message the native host to open the project in the editor.
 * @param path Ideally the absolute path
 */
export async function openPathInEditor(path: string) {
  console.log('QuickEdits Extension: Opening path in editor:', path);

  const editor = (await chrome.storage.local.get(['editor']));
  console.log('QuickEdits Extension: Using editor:', editor);
  
  return chrome.runtime.sendMessage({
    action: "open_editor",
    data: {
      path,
      lineNumber: 1,
      charNumber: 0,
      editor: editor?.editor ?? 'vscode',
      editorPath: editor?.path ?? '',
    },
  }).then(response => {
    if (!response) {
      const error = 'No response received from open editor request';
      console.error('QuickEdits Extension:', error);
      throw new Error(error);
    }
    if (!response.success) {
      console.error('QuickEdits Extension: Failed to open editor:', response.message);
      throw new Error(response.message);
    }
    console.log('QuickEdits Extension: Open editor response:', response);
    return response;
  }).catch(error => {
    console.error('QuickEdits Extension: Failed to open editor:', error);
    throw error;
  });
}
