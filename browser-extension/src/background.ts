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
  }
  return true;
});
