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
    console.log('[Navigation] Up called, current target:', target?.tagName);
    if (!target) {
      console.log('[Navigation] Up aborted - no target');
      return;
    }
    if (target.tagName === "BODY") {
      console.log('[Navigation] Up aborted - at BODY');
      return;
    }
    if (target.parentElement) {
      const element = target.parentElement;
      if (!(element instanceof HTMLElement)) {
        console.log('[Navigation] Up aborted - parent not HTMLElement');
        return;
      }
      try {
        console.log('[Navigation] Up - scrolling to parent:', element.tagName);
        scrollToElement(element);
        setTarget(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to parent element:', error);
      }
    }
  }, [target]);

  const down = useCallback(() => {
    console.log('[Navigation] Down called, current target:', target?.tagName);
    if (target?.tagName === "BODY") {
      console.log('[Navigation] Down aborted - at BODY');
      return;
    }
    if (target?.children?.[0]) {
      const element = target.children[0] as HTMLElement;
      try {
        console.log('[Navigation] Down - scrolling to first child:', element.tagName);
        scrollToElement(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to child element:', error);
      }
      setTarget(element);
    } else {
      console.log('[Navigation] Down aborted - no children');
    }
  }, [target]);

  const left = useCallback(() => {
    console.log('[Navigation] Left called, current target:', target?.tagName);
    if (target?.tagName === "BODY") {
      console.log('[Navigation] Left aborted - at BODY');
      return;
    }
    if (target?.previousSibling) {
      const element = target.previousSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) {
        console.log('[Navigation] Left aborted - previous sibling not HTMLElement');
        return;
      }
      try {
        console.log('[Navigation] Left - scrolling to previous sibling:', element.tagName);
        scrollToElement(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to previous sibling:', error);
      }
      setTarget(element);
    } else {
      console.log('[Navigation] Left aborted - no previous sibling');
    }
  }, [target]);

  const right = useCallback(() => {
    console.log('[Navigation] Right called, current target:', target?.tagName);
    if (target?.tagName === "BODY") {
      console.log('[Navigation] Right aborted - at BODY');
      return;
    }
    if (target?.nextSibling) {
      const element = target.nextSibling as HTMLElement;
      if (!(element instanceof HTMLElement)) {
        console.log('[Navigation] Right aborted - next sibling not HTMLElement');
        return;
      }
      try {
        console.log('[Navigation] Right - scrolling to next sibling:', element.tagName);
        scrollToElement(element);
      } catch (error) {
        console.error('[Navigation] Error scrolling to next sibling:', error);
      }
      setTarget(element);
    } else {
      console.log('[Navigation] Right aborted - no next sibling');
    }
  }, [target]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[KeyEvent] Key pressed:', e.key, 'Alt:', e.altKey, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey, 'Meta:', e.metaKey);
      const noOtherKeyPressed = !e.ctrlKey && !e.shiftKey && !e.metaKey;
      
      // Handle vim-style navigation keys
      if (['h', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
        if (!target) {
          console.log('[KeyEvent] Navigation aborted - no target selected');
          return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
        
        switch(e.key.toLowerCase()) {
          case 'k': left(); break;
          case 'l': down(); break;
          case 'h': up(); break;
          case 'j': right(); break;
        }
        return;
      }

      // Handle Alt key for target selection activation
      // Only activate if Alt is pressed alone and target selection is not already active
      if (e.key === 'Alt' && noOtherKeyPressed && !targetSelectionActive) {
        console.log('[KeyEvent] Alt pressed - activating target selection');
        setTargetSelectionActive(true);
        return;
      } 
      
      if (e.ctrlKey && e.metaKey && e.shiftKey && e.key === "L") {
        console.log('[KeyEvent] Ctrl+Cmd+Shift+L - selecting body');
        setTargetSelectionActive(true);
        const newTarget =
          (document.body?.children[0] as HTMLElement) ||
          (document.body as HTMLElement);
        setTarget(newTarget);
        return;
      }

      if (!targetSelectionActive || !target) {
        console.log('[KeyEvent] Navigation aborted - selection not active or no target');
        return;
      }

      e.stopImmediatePropagation();
      e.preventDefault();
      
      switch(e.key.toLowerCase()) {
        case 'h':
          console.log('[KeyEvent] H pressed - moving left');
          left();
          break;
        case 'j':
          console.log('[KeyEvent] J pressed - moving down');
          down();
          break;
        case 'k':
          console.log('[KeyEvent] K pressed - moving up');
          up();
          break;
        case 'l':
          console.log('[KeyEvent] L pressed - moving right');
          right();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setTargetSelectionActive(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
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
