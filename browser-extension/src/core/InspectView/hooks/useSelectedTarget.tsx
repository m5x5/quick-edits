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
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const track = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("mousemove", track, { passive: true });
    return () => document.removeEventListener("mousemove", track);
  }, []);

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

  // Listen for toggle-inspect command from the background script (triggered by keyboard shortcut)
  useEffect(() => {
    const handleToggle = () => {
      setTargetSelectionActive(prev => {
        const next = !prev;
        if (next) {
          const el = document.elementFromPoint(mousePos.current.x, mousePos.current.y);
          if (el instanceof HTMLElement) {
            setTarget(el);
          } else {
            const firstChild = document.body?.children[0] as HTMLElement;
            if (firstChild) setTarget(firstChild);
          }
        } else {
          setTarget(null);
        }
        return next;
      });
    };

    const handleMessage = (message: { action: string }) => {
      if (message.action === "toggle-inspect") handleToggle();
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Listen for inspect requests via postMessage (works across isolated worlds)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "quick-edits:inspect" && e.data?.selector) {
        const el = document.querySelector(e.data.selector);
        if (el instanceof HTMLElement) {
          scrollToElement(el);
          setTarget(el);
          setTargetSelectionActive(false);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle vim-style navigation keys when inspection is active
      if (['h', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
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

      // Escape to deactivate inspection
      if (e.key === 'Escape' && targetSelectionActive) {
        setTargetSelectionActive(false);
        setTarget(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [up, down, left, right, target, targetSelectionActive]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if click is on the popup (shadow host retargets events)
      if ((e.target as HTMLElement)?.closest?.('my-shadow-host[data-ws-developer-tools]')) return;

      if (targetSelectionActive) {
        // Lock in the current target and stop selection mode
        setTargetSelectionActive(false);
      } else if (target) {
        // Click outside the modal dismisses it
        setTarget(null);
      }
    };
    document.addEventListener("click", handleClick);

    const setTargetIfNeeded = (e: MouseEvent) => {
      if (!targetSelectionActive) return;
      if (e.target === target) return;

      const newTarget = e.target as HTMLElement;
      setTarget(newTarget);
    };
    document.addEventListener("mouseover", setTargetIfNeeded, {
      passive: true,
    });

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mouseover", setTargetIfNeeded);
    };
  }, [target, targetSelectionActive]);

  const clearTarget = useCallback(() => setTarget(null), []);

  return { target, targetSelectionActive, left, right, up, down, ref, clearTarget };
}
