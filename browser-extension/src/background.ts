import NativeMessageController, {
  type ActionType,
  type NativeResponse,
} from "./background/NativeMessageController";

const polling = () => {
  setTimeout(polling, 1000 * 30);
};
polling();

// Track toolbar-active tabs in session storage (survives service worker restarts, clears on browser close)
async function getToolbarTabs(): Promise<Set<number>> {
  const data = await chrome.storage.session.get("toolbarTabs");
  return new Set<number>(data.toolbarTabs ?? []);
}

async function setToolbarTab(tabId: number) {
  const tabs = await getToolbarTabs();
  tabs.add(tabId);
  await chrome.storage.session.set({ toolbarTabs: [...tabs] });
}

async function removeToolbarTab(tabId: number) {
  const tabs = await getToolbarTabs();
  tabs.delete(tabId);
  await chrome.storage.session.set({ toolbarTabs: [...tabs] });
}

// Track which tabs currently have the content script injected (in-memory only, for idempotency)
const injectedTabs = new Set<number>();

/** Inject the content script into a tab (idempotent) and optionally send a follow-up message */
async function ensureContentScript(tabId: number, followUpMessage?: any) {
  if (!injectedTabs.has(tabId)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["src/content_script.js"],
      });
      injectedTabs.add(tabId);
    } catch (e) {
      console.error("Failed to inject content script:", e);
      return;
    }
  }
  // Mark this tab as having the toolbar active
  await setToolbarTab(tabId);
  if (followUpMessage) {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, followUpMessage).catch(() => {});
    }, 100);
  }
}

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  removeToolbarTab(tabId);
});

// Re-inject content script on reload/navigation if the tab had the toolbar
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    injectedTabs.delete(tabId);
  }
  if (changeInfo.status === "complete") {
    const tabs = await getToolbarTabs();
    if (tabs.has(tabId)) {
      ensureContentScript(tabId);
    }
  }
});

// Listen for the keyboard shortcut command — inject content script if needed, then toggle
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-inspect" && tab?.id) {
    ensureContentScript(tab.id, { action: "toggle-inspect" });
  }
});

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
        // TODO: Add the folder from the settings page
        folder: "/Users/michael/Software/quick-edits/",
        classes: "test",
        textContent: "test",
        browserUrl: "",
      })
      .then((response: NativeResponse<"perform_search">) => {
        sendResponse(response);
      });
    return true; // Keep the message channel open for async response
  }

  if (message.action === "enable_quick_edits") {
    // Inject content script into the specified tab and toggle inspect
    const tabId = message.tabId;
    if (tabId) {
      ensureContentScript(tabId, { action: "toggle-inspect" });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "hide_toolbar_session" && sender.tab?.id) {
    // Stop re-injecting toolbar on reload for this tab
    removeToolbarTab(sender.tab.id);
    injectedTabs.delete(sender.tab.id);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "class_change" && sender.tab) {
    // Only forward messages from content scripts (tab context), not from DevTools
    chrome.runtime.sendMessage(message).catch(() => {});
  } else if (message.type === "move_to_devtools" && sender.tab) {
    // Forward inspect state from content script to DevTools panel
    chrome.runtime.sendMessage({ ...message, tabId: sender.tab.id }).catch(() => {});
  } else if (message.type === "devtools_class_update" && !sender.tab) {
    // Forward class changes from DevTools panel to the content script
    if (message.tabId) {
      chrome.tabs.sendMessage(message.tabId, message);
    }
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
