import { useEffect, useState } from "react";

const scrollToElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  // For better visibility, we scroll a bit less than the actual top
  const topOffset = 400;
  const top = rect.top + window.scrollY - topOffset;
  window.scrollTo(0, top);
};

export default function useSelectedTarget() {
  const [targetSelectionActive, setTargetSelectionActive] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const noOtherKeyPressed = !e.ctrlKey && !e.shiftKey && !e.metaKey;
      if (e.altKey && noOtherKeyPressed) {
        setTargetSelectionActive(true);
      }

      if (e.ctrlKey && e.metaKey && e.shiftKey && e.key === "L") {
        setTargetSelectionActive(true);
        const newTarget =
          (document.body?.children[0] as HTMLElement) ||
          (document.body as HTMLElement);
        setTarget(newTarget);
      }

      if (e.key === "l" || e.key === "C") {
        e.stopImmediatePropagation();
        if (target?.children?.[0]) {
          const element = target.children[0] as HTMLElement;
          try {
            element.focus();
            scrollToElement(element);
          } catch { }
          setTarget(element);
        }
      }
      if (e.key === "u" || e.key === "h") {
        e.stopImmediatePropagation();
        if (target?.parentElement) {
          const element = target.parentElement as HTMLElement;
          try {
            element.focus();
            scrollToElement(element);
          } catch { }
          setTarget(element);
        }
      }
      if (e.key === "j") {
        e.stopImmediatePropagation();
        if (target?.nextSibling) {
          const element = target.nextSibling as HTMLElement;
          try {
            element.focus();
            scrollToElement(element);
          } catch { }
          setTarget(element);
        }
      }
      if (e.key === "k") {
        e.stopImmediatePropagation();
        if (target?.previousSibling) {
          const element = target.previousSibling as HTMLElement;
          try {
            element.focus();
            scrollToElement(element);
          } catch { }
          setTarget(element);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setTargetSelectionActive(false);
      }
    }

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const unsetTarget = (e: MouseEvent) => {
      if (!e.altKey) setTarget(null);
    }
    document.addEventListener("click", unsetTarget);

    const setTargetIfNeeded = (e: MouseEvent) => {
      if (!e.altKey || !targetSelectionActive) return;
      if (e.target === target) return;
      e.stopImmediatePropagation();

      const newTarget = e.target as HTMLElement;
      setTarget(newTarget)
    }
    document.addEventListener("mouseover", setTargetIfNeeded, { passive: true });

    return () => {
      document.removeEventListener("click", unsetTarget);
      document.removeEventListener("mouseover", setTargetIfNeeded);
    }
  }, [target, targetSelectionActive])


  return { target, targetSelectionActive };
}
