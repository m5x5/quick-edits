import NativeMessageController from "./background/NativeMessageController";

const polling = () => {
  setTimeout(polling, 1000 * 30);
};
polling();

const nativeMessageController = new NativeMessageController();

// add listener to receive message from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "perform_search") {
    const data = request?.data as any;
    if (typeof data?.folder !== "string") {
      sendResponse({
        success: false,
        message: "Invalid request",
        folder: data.folder || "",
        classes: data.classes || "",
        textContent: data.textContent,
      });
      return false;
    }
    nativeMessageController
      .exec("perform_search", {
        folder: data.folder,
        classes: data.classes,
        textContent: data.textContent,
      })
      .then((response) => {
        sendResponse(response);
      });
  } else if (request.action === "open_editor") {
    const data = request?.data as any;

    const openEditor = () => {
      if (
        typeof data?.path !== "string" ||
        typeof data?.lineNumber !== "number" ||
        typeof data?.charNumber !== "number" ||
        typeof data?.editor !== "string"
      ) {
        sendResponse({ success: false, message: "Invalid request" });
        return false;
      }
      nativeMessageController
        .exec("open_editor", {
          path: data.path,
          lineNumber: data.lineNumber,
          charNumber: data.charNumber,
          editor: data.editor,
        })
        .then((response) => {
          sendResponse(response);
        });
    }

    if (!request?.data.editor) {
      chrome.storage.local.get("editor").then((editor) => {
        request.data.editor = editor;
        openEditor();
      })
    } else {
      openEditor();
    }
  } else if (request.action === "reload_extension") {
    chrome.runtime.reload();
    sendResponse({ success: true });
  }
  return true;
});
