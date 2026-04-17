import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useSelectedTarget from './useSelectedTarget';

describe('useSelectedTarget', () => {
  let mockBody: HTMLElement;
  let mockChild1: HTMLElement;
  let mockChild2: HTMLElement;
  let mockGrandChild: HTMLElement;

  beforeEach(() => {
    // Mock DOM structure
    mockBody = document.createElement('body');
    mockChild1 = document.createElement('div');
    mockChild2 = document.createElement('div');
    mockGrandChild = document.createElement('span');

    mockChild1.appendChild(mockGrandChild);
    mockBody.appendChild(mockChild1);
    mockBody.appendChild(mockChild2);

    // Mock document.body
    Object.defineProperty(document, 'body', {
      value: mockBody,
      writable: true
    });

    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no target and target selection inactive', () => {
    const { result } = renderHook(() => useSelectedTarget());

    expect(result.current.target).toBeNull();
    expect(result.current.targetSelectionActive).toBe(false);
  });

  it('should activate target selection on Alt key press', () => {
    const { result } = renderHook(() => useSelectedTarget());

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Alt' });
      document.dispatchEvent(event);
    });

    expect(result.current.targetSelectionActive).toBe(true);
  });

  it('should deactivate target selection on Alt key release', () => {
    const { result } = renderHook(() => useSelectedTarget());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    });

    expect(result.current.targetSelectionActive).toBe(false);
  });

  it('should set initial target on Ctrl+Cmd+Shift+L', () => {
    const { result } = renderHook(() => useSelectedTarget());

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'L',
        ctrlKey: true,
        metaKey: true,
        shiftKey: true
      });
      document.dispatchEvent(event);
    });

    expect(result.current.target).toBe(mockChild1);
    expect(result.current.targetSelectionActive).toBe(true);
  });

  describe('Navigation', () => {
    let result: any;

    beforeEach(() => {
      result = renderHook(() => useSelectedTarget()).result;
      // Set up initial target
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'L',
          ctrlKey: true,
          metaKey: true,
          shiftKey: true
        });
        document.dispatchEvent(event);
      });
    });

    it('should navigate down to child element', () => {
      act(() => {
        result.current.down();
      });

      expect(result.current.target).toBe(mockGrandChild);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should navigate up to parent element', () => {
      // First navigate to child
      act(() => {
        result.current.down();
      });

      // Then navigate up
      act(() => {
        result.current.up();
      });

      expect(result.current.target).toBe(mockChild1);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should navigate right to next sibling', () => {
      act(() => {
        result.current.right();
      });

      expect(result.current.target).toBe(mockChild2);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should navigate left to previous sibling', () => {
      // First navigate to second child
      act(() => {
        result.current.right();
      });

      // Then navigate back
      act(() => {
        result.current.left();
      });

      expect(result.current.target).toBe(mockChild1);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should handle vim-style navigation keys', () => {
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
      });

      expect(result.current.target).toBe(mockGrandChild);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      });

      expect(result.current.target).toBe(mockChild1);
    });
  });

  it('should unset target when clicking without Alt key', () => {
    const { result } = renderHook(() => useSelectedTarget());

    // Set initial target
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'L',
        ctrlKey: true,
        metaKey: true,
        shiftKey: true
      });
      document.dispatchEvent(event);
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click'));
    });

    expect(result.current.target).toBeNull();
  });

  it('should set target on mouseover when Alt is pressed', () => {
    const { result } = renderHook(() => useSelectedTarget());

    // Activate target selection
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
    });

    // Simulate mouseover on an element
    act(() => {
      const event = new MouseEvent('mouseover', {
        bubbles: true,
        altKey: true
      });
      Object.defineProperty(event, 'target', { value: mockChild1 });
      document.dispatchEvent(event);
    });

    expect(result.current.target).toBe(mockChild1);
  });
});