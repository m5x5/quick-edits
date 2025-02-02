import NativeMessageController from "./background/NativeMessageController";

const polling = () => {
  setTimeout(polling, 1000 * 30);
};
polling();

const nativeMessageController = new NativeMessageController();

// add listener to receive message from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "class_change" && sender.tab) {
    // Only forward messages from content scripts (tab context), not from DevTools
    chrome.runtime.sendMessage(message);
  } else if (message.action === "perform_search" || message.action === "open_editor" || message.action === "save_changes") {
    nativeMessageController.exec(message.action, message.data).then(sendResponse);
    return true; // Required to use sendResponse asynchronously
  } else if (message.action === "reload_extension") {
    chrome.runtime.reload();
  }
  return true;
});
