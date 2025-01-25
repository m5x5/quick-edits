import { useCallback, useEffect, useRef, useState } from "react";

const scrollToElement = (element: HTMLElement) => {
  if (!(element instanceof HTMLElement)) return;
  const rect = element.getBoundingClientRect();
  // For better visibility, we scroll a bit less than the actual top
  const topOffset = 400;
  const top = rect.top + window.scrollY - topOffset;
  window.scrollTo(0, top);
};

export default function useSelectedTarget() {
  const [targetSelectionActive, setTargetSelectionActive] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const ref = useRef();

  const up = useCallback(() => {
    if (target?.tagName === "BODY") return;
    if (target?.parentElement) {
      const element = target.parentElement as HTMLElement;
      try {
        scrollToElement(element);
      } catch { }
      setTarget(element);
    }
  }, [target]);

  const down = useCallback(() => {
    if (target?.tagName === "BODY") return;
    if (target?.children?.[0]) {
      const element = target.children[0] as HTMLElement;
      try {
        scrollToElement(element);
      } catch { }
      setTarget(element);
    }
  }, [target]);

  const left = useCallback(() => {
    if (target?.tagName === "BODY") return;
    if (target?.previousSibling) {
      const element = target.previousSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) return;
      try {
        scrollToElement(element);
      } catch { }
      setTarget(element);
    }
  }, [target]);

  const right = useCallback(() => {
    if (target?.tagName === "BODY") return;
    if (target?.nextSibling) {
      const element = target.nextSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) return;
      try {
        scrollToElement(element);
      } catch { }
      setTarget(element);
    }
  }, [target]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const noOtherKeyPressed = !e.ctrlKey && !e.shiftKey && !e.metaKey;
      if (e.altKey && noOtherKeyPressed) {
        setTargetSelectionActive(true);
      } else if (e.ctrlKey && e.metaKey && e.shiftKey && e.key === "L") {
        setTargetSelectionActive(true);
        const newTarget =
          (document.body?.children[0] as HTMLElement) ||
          (document.body as HTMLElement);
        setTarget(newTarget);
      } else {
        // return;
      }

      if (e.key === "l") {
        e.stopImmediatePropagation();
        down();
      }
      if (e.key === "h") {
        e.stopImmediatePropagation();
        up();
      }
      if (e.key === "j") {
        e.stopImmediatePropagation();
        right();
      }
      if (e.key === "k") {
        e.stopImmediatePropagation();
        left();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setTargetSelectionActive(false);
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [up, down, left, right]);

  useEffect(() => {
    const unsetTarget = (e: MouseEvent) => {
      if (!e.altKey) setTarget(null);
    };
    document.addEventListener("click", unsetTarget);

    const setTargetIfNeeded = (e: MouseEvent) => {
      if (!e.altKey || !targetSelectionActive) return;
      if (e.target === target) return;
      e.stopImmediatePropagation();

      const newTarget = e.target as HTMLElement;
      setTarget(newTarget);
    };
    document.addEventListener("mouseover", setTargetIfNeeded, {
      passive: true,
    });

    return () => {
      document.removeEventListener("click", unsetTarget);
      document.removeEventListener("mouseover", setTargetIfNeeded);
    };
  }, [target, targetSelectionActive]);

  return { target, targetSelectionActive, left, right, up, down, ref };
}
