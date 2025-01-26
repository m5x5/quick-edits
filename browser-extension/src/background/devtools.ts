// Handle messages from content script to DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'devtools' && message.type === 'class_change') {
    // Forward the message to all DevTools panels
    chrome.runtime.sendMessage({
      source: 'background',
      type: 'class_change',
      data: {
        element: message.element,
        oldClasses: message.oldClasses,
        newClasses: message.newClasses,
        timestamp: Date.now()
      }
    });
  }
});

// Keep track of connections from DevTools panels
const connections = new Map();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name.startsWith('devtools-')) {
    const tabId = port.name.split('-')[1];
    connections.set(tabId, port);

    port.onDisconnect.addListener(() => {
      connections.delete(tabId);
    });
  }
});