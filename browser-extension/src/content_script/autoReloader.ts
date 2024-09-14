const DEVELOPMENT = true;
export const initAutoReload = () => {

  if (DEVELOPMENT) {
    const interval = setInterval(() => {
      fetch(chrome.runtime.getURL("manifest.json"))
        .then((response) => response.json())
        .then((manifest) => {
          if (manifest.version !== chrome.runtime.getManifest().version) {
            console.debug("Extension has been updated. Reloading...");
            // send message to background to reload the extension
            chrome.runtime.sendMessage({ action: "reload_extension" });
            clearInterval(interval);
            window.location.reload();
          }
        });
    }, 1000);
  }
};
