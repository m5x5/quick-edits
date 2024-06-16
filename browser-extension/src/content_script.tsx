import InspectView from "./content_script/InspectView";
import ProjectMappingStorage from "./content_script/ProjectStorage";

type ActionType = "perform_search" | "open_editor";
type NativeResponse<T extends ActionType> = {
  success: boolean;
  message: string;
} & T extends "perform_search"
  ? { data: { path: string; lineNumber: number; charNumber: number }[] }
  : T extends "open_editor"
  ? object
  : never;

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.color) {
    document.body.style.backgroundColor = msg.color;
    return sendResponse(`Change color to ${msg.color}`);
  }

  sendResponse("Color message is none.");
});

let enabled = false;
let lastElement = null as HTMLElement | null;

const enable = () => {
  enabled = true;
};

const disable = () => {
  removeIndicator();
  InspectView.delete();
  enabled = false;
};

const scrollToElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  // For better visibility, we scroll a bit less than the actual top
  const topOffset = 400;
  const top = rect.top + window.scrollY - topOffset;
  window.scrollTo(0, top);
};

document.addEventListener("keydown", (e) => {
  const noOtherKeyPressed = !e.ctrlKey && !e.shiftKey && !e.metaKey;
  if (e.altKey && noOtherKeyPressed) enable();

  if (e.ctrlKey && e.metaKey && e.shiftKey && e.key === "L") {
    enable();
    const target =
      (document.body?.children[0] as HTMLElement) ||
      (document.body as HTMLElement);
    createPopupForElement(target);
    lastElement = target;
  }

  if (e.key === "l" || e.key === "C") {
    e.stopImmediatePropagation();
    if (lastElement?.children?.[0]) {
      removeIndicator();
      InspectView.delete();
      const element = lastElement.children[0] as HTMLElement;
      try {
        element.focus();
        scrollToElement(element);
      } catch { }
      createPopupForElement(element);
      lastElement = element;
    }
  }
  if (e.key === "u" || e.key === "h") {
    e.stopImmediatePropagation();
    if (lastElement?.parentElement) {
      const element = lastElement.parentElement as HTMLElement;
      try {
        element.focus();
        scrollToElement(element);
      } catch { }
      removeIndicator();
      InspectView.delete();
      createPopupForElement(element);
      lastElement = element;
    }
  }
  if (e.key === "j") {
    e.stopImmediatePropagation();
    if (lastElement?.nextSibling) {
      const element = lastElement.nextSibling as HTMLElement;
      try {
        element.focus();
        scrollToElement(element);
      } catch { }
      removeIndicator();
      InspectView.delete();
      createPopupForElement(element);
      lastElement = element;
    }
  }
  if (e.key === "k") {
    e.stopImmediatePropagation();
    if (lastElement?.previousSibling) {
      const element = lastElement.previousSibling as HTMLElement;
      try {
        element.focus();
        scrollToElement(element);
      } catch { }
      removeIndicator();
      InspectView.delete();
      createPopupForElement(element);
      lastElement = element;
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (!e.altKey && InspectView.lastPopup) {
    InspectView.lastPopup.style.pointerEvents = "default";
  }
});

const createPopupForElement = (element: HTMLElement | SVGElement) => {
  const inspectPopup = new InspectView();
  const popup = inspectPopup.init(element);

  InspectView.lastPopup = popup;

  popup.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
  });

  const classes = element.className;

  performSearch({
    classes,
    textContent: element.textContent?.trim() || "",
  }).then(console.log)

  document.body.appendChild(InspectView.element as HTMLDivElement);
};

const lastHovered = null as HTMLElement | null;

document.addEventListener("click", (e) => {
  if (!e.altKey) disable();
});

document.addEventListener("mouseover", (e) => {
  if (!e.altKey || !enabled) return;
  if (e.target === lastHovered) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  const target = e.target as HTMLElement;
  highlightElement(target);
  lastElement = target;
});

const highlightElement = (target: HTMLElement) => {
  InspectView.delete();

  createPopupForElement(target);
};

const removeIndicator = () => {
  // There shouldn't be multiple indicators, but just in case
  const indicators = document.querySelectorAll(
    "[data-ws-developer-tools-indicator]"
  );

  for (const indicator of indicators) {
    indicator.remove();
  }
};

type SearchData = {
  classes: string;
  textContent: string;
}
const performSearch = async (searchData: SearchData) => {
  const time = Date.now();
  const mapping = await ProjectMappingStorage.getProjectMapping(window.location.href);

  return new Promise<string | null>((resolve) => {
    // TODO: handle multiple mappings with filter

    if (!mapping) return resolve(null);

    chrome.runtime.sendMessage(
      {
        action: "perform_search",
        data: {
          folder: mapping.searchFolder,
          classes: searchData.classes,
          textContent: searchData.textContent,
        },
      },
      (response: NativeResponse<"perform_search">) => {
        if (!response.data?.length) return resolve(null);
        resolve(response.data?.[0].path);

        InspectView.showResults(response.data, mapping);
        console.debug(
          "It took",
          Date.now() - time,
          "ms to perform the code search"
        );
      }
    );
  });
};

const interval = setInterval(() => {
  fetch(chrome.runtime.getURL('manifest.json'))
    .then(response => response.json())
    .then(manifest => {
      if (manifest.version !== chrome.runtime.getManifest().version) {
        console.debug('Extension has been updated. Reloading...');
        // send message to background to reload the extension
        chrome.runtime.sendMessage({ action: 'reload_extension' });
        clearInterval(interval);
        window.location.reload();
      }
    });
}, 1000);
