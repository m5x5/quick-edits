import { initPopup } from "../../core/InspectPopup";

export default class InspectView {
  static lastPopup: HTMLElement | null = null;
  static element: HTMLDivElement | null = null;
  static target: HTMLElement | SVGElement | null = null;
  static targetTagName: string | null = null;
  static targetClasses: string | null = null;
  static astroResult: { file: string; loc: string } | null = null;

  init(target: HTMLElement | SVGElement) {
    let classes: string;

    if (target instanceof SVGElement) {
      classes = ` ${Array.from(target.classList.values()).join(" ")}`;
    } else {
      classes = ` ${target.className}`;
    }
    InspectView.targetTagName = target.tagName;
    InspectView.targetClasses = classes;

    if (target.dataset?.astroSourceFile) {
      InspectView.astroResult = {
        file: target.dataset.astroSourceFile,
        loc: target.dataset.astroSourceLoc as string,
      };
    }

    if (!InspectView.element) {
      InspectView.delete();
      InspectView.element = initPopup({
        tagName: InspectView.targetTagName,
        classes: InspectView.targetClasses,
        target,
        results: [],
        astroResult: InspectView.astroResult ?? undefined,
      });
      document.body.appendChild(InspectView.element);
    }

    InspectView.target = target;

    return InspectView.element;
  }

  static showResults(
    response: { path: string; lineNumber: number; charNumber: number }[],
    mapping: { searchFolder: string }
  ) {
    const results = [];

    for (const res of response) {
      const path = res.path;
      if (path.endsWith(".typoscript")) continue;
      const shortenedPath = path.replace(mapping.searchFolder, "");
      const result = document.createElement("div");
      result.innerText = `${shortenedPath}:${res.lineNumber}:${res.charNumber}`;
      results.push({
        path,
        shortenedPath,
        lineNumber: res.lineNumber,
        charNumber: res.charNumber,
      });
    }
    InspectView.delete();

    initPopup({
      tagName: InspectView.targetTagName as string,
      classes: InspectView.targetClasses as string,
      target: InspectView.target as HTMLElement | SVGElement,
      results: results,
      astroResult: InspectView.astroResult ?? undefined,
    });
  }

  static delete() {
    const popups = document.querySelectorAll("[data-ws-developer-tools]");
    for (const popup of popups) {
      popup.remove();
      InspectView.element = null;
    }
  }
}
