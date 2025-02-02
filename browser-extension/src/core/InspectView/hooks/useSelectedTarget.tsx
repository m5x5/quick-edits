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
  const ref = useRef(null);

  const up = useCallback(() => {
    if (!target) return;
    if (target.tagName === "BODY") return;
    if (target.parentElement) {
      const element = target.parentElement;
      if (!(element instanceof HTMLElement)) return;
      try {
        scrollToElement(element);
        setTarget(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to parent element:', error);
      }
    }
  }, [target]);

  const down = useCallback(() => {
    if (!target) return;
    if (target.tagName === "BODY") return;
    if (target.children?.[0]) {
      const element = target.children[0] as HTMLElement;
      try {
        scrollToElement(element);
        setTarget(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to child element:', error);
      }
    }
  }, [target]);

  const left = useCallback(() => {
    if (!target) return;
    if (target.tagName === "BODY") return;
    if (target.previousSibling) {
      const element = target.previousSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) return;
      try {
        scrollToElement(element);
        setTarget(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to previous sibling:', error);
      }
    }
  }, [target]);

  const right = useCallback(() => {
    if (!target) return;
    if (target.tagName === "BODY") return;
    if (target.nextSibling) {
      const element = target.nextSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) return;
      try {
        scrollToElement(element);
        setTarget(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to next sibling:', error);
      }
    }
  }, [target]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Handle Key Down', { e })
      const noOtherKeyPressed = !e.ctrlKey && !e.shiftKey && !e.metaKey;

      // Handle Alt key for target selection activation
      if (e.key === 'Alt' && noOtherKeyPressed && !targetSelectionActive) {
        setTargetSelectionActive(true);
        return;
      }

      // Handle Ctrl+Cmd+Shift+L
      if (e.ctrlKey && e.metaKey && e.shiftKey && e.key === "L") {
        setTargetSelectionActive(true);
        const firstChild = document.body?.children[0] as HTMLElement;
        if (firstChild) {
          setTarget(firstChild);
        }
        return;
      }

      // Handle vim-style navigation keys
      if (['h', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
        if (!target && e.altKey) {
          // If Alt is pressed but no target, select the first element
          const firstChild = document.body?.children[0] as HTMLElement;
          if (firstChild) {
            setTarget(firstChild);
            setTargetSelectionActive(true);
          }
          return;
        }

        if (!target) return;

        e.stopImmediatePropagation();
        e.preventDefault();

        switch (e.key.toLowerCase()) {
          case 'k': left(); break;
          case 'l': down(); break;
          case 'h': up(); break;
          case 'j': right(); break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setTargetSelectionActive(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [up, down, left, right, target, targetSelectionActive]);

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
