import NativeMessageController, {
  type ActionType,
  type NativeResponse,
} from "./background/NativeMessageController";

const polling = () => {
  setTimeout(polling, 1000 * 30);
};
polling();

const nativeMessageController = new NativeMessageController();

// Listen for messages from the settings page and other components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle native messaging host errors
  if (message.type === "native_host_error") {
    // Forward the error to all extension views (popup, options, etc.)
    chrome.runtime.sendMessage(message);
    return true;
  }

  if (message.type === "settings_ready") {
    // When settings page is ready, test the native messaging host connection
    nativeMessageController
      .exec("perform_search", {
        folder: "",
        classes: "",
        textContent: "",
        browserUrl: "",
      })
      .then((response: NativeResponse<"perform_search">) => {
        if (!response.success) {
          // If there's an error, send it to the settings page
          chrome.runtime.sendMessage({
            type: "native_host_error",
            message: response.message,
          });
        }
        sendResponse({ success: true });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.action === "test_native_host") {
    // Test the native messaging host connection
    nativeMessageController
      .exec("perform_search", {
        folder: "",
        classes: "",
        textContent: "",
        browserUrl: "",
      })
      .then((response: NativeResponse<"perform_search">) => {
        sendResponse(response);
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === "class_change" && sender.tab) {
    // Only forward messages from content scripts (tab context), not from DevTools
    chrome.runtime.sendMessage(message);
  } else if (
    message.action === "perform_search" ||
    message.action === "open_editor" ||
    message.action === "save_changes"
  ) {
    nativeMessageController
      .exec(message.action, message.data)
      .then((response: NativeResponse<ActionType>) => {
        if (!response.success) {
          // If there's an error, send it to the popup
          chrome.runtime.sendMessage({
            type: "native_host_error",
            message: response.message,
          });
        }
        sendResponse(response);
      });
    return true; // Required to use sendResponse asynchronously
  } else if (message.action === "reload_extension") {
    chrome.runtime.reload();
  } else if (message.action === "test_native_host") {
    // Test if native messaging host is accessible
    try {
      const port = chrome.runtime.connectNative(
        "com.quick_edits.native_search"
      );
      port.onDisconnect.addListener(() => {
        sendResponse({
          success: false,
          message: "Native messaging host is not accessible",
        });
      });
      port.postMessage({ id: "test", action: "test" });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        message: "Native messaging host is not accessible",
      });
    }
    return true;
  }
  return true;
});
