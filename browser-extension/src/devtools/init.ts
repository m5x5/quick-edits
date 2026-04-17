// This script runs when DevTools opens. It creates the Quick Edits panel tab.
// It also listens for messages and stores them so the panel can retrieve them
// even if the panel tab hasn't been visited yet.

const pendingMessages: any[] = [];
let panelReady = false;
let panelPort: chrome.runtime.Port | null = null;

// Listen for messages from the background script (always active while DevTools is open)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "move_to_devtools" || message.type === "class_change") {
    if (panelReady && panelPort) {
      panelPort.postMessage(message);
    } else {
      pendingMessages.push(message);
    }
  }
});

// The panel connects when it loads and asks for pending messages
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "quick-edits-panel") {
    panelPort = port;
    panelReady = true;

    // Flush any messages that arrived before the panel was ready
    for (const msg of pendingMessages) {
      port.postMessage(msg);
    }
    pendingMessages.length = 0;

    port.onDisconnect.addListener(() => {
      panelReady = false;
      panelPort = null;
    });
  }
});

chrome.devtools.panels.create(
  "Quick Edits",
  "icon16.png",
  "panel.html",
  (panel) => {
    panel.onShown.addListener(() => {
      // When the panel becomes visible, auto-switch to it if there's a pending target
    });
  }
);
