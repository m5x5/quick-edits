import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InspectPopupClassListInput from "./InspectPopupClassListInput";

describe("InspectPopupClassListInput", () => {
  const mockOnChangeClasses = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle keyboard events correctly", () => {
    render(<InspectPopupClassListInput debounce={0} onChangeClasses={mockOnChangeClasses} />);
    const input = screen.getByPlaceholderText("Add classes");

    // Test keyboard event stopPropagation
    const keyDownEvent = new KeyboardEvent("keydown", { bubbles: true });
    vi.spyOn(keyDownEvent, "stopPropagation");
    fireEvent(input, keyDownEvent);
    expect(keyDownEvent.stopPropagation).toHaveBeenCalled();

    // Test click event prevention
    const clickEvent = new MouseEvent("click", { bubbles: true });
    vi.spyOn(clickEvent, "preventDefault");
    vi.spyOn(clickEvent, "stopPropagation");
    fireEvent(input, clickEvent);
    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });

  it("should update input value and trigger onChangeClasses", async () => {
    render(<InspectPopupClassListInput debounce={0} onChangeClasses={mockOnChangeClasses} />);
    const input = screen.getByPlaceholderText("Add classes");

    await act(async () => {
      // Simulate typing
      fireEvent.change(input, { target: { value: "test-class" } });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 2));
    });

    expect(input).toHaveDisplayValue("test-class");

    expect(mockOnChangeClasses).toHaveBeenCalledWith("test-class");
  });

  it("should prevent navigation events while typing", async () => {
    render(<InspectPopupClassListInput debounce={0} onChangeClasses={mockOnChangeClasses} />);
    const input = screen.getByPlaceholderText("Add classes");
    const mockHandleKeydown = vi.fn();

    // Attach a global event listener to the document
    document.addEventListener('keydown', mockHandleKeydown);

    // Test navigation key events
    const navigationKeys = ['h', 'j', 'k', 'l'];
    for (const key of navigationKeys) {
      const keyDownEvent = new KeyboardEvent("keydown", { key, bubbles: true });
      fireEvent(input, keyDownEvent);
    }
    // Check if document does not receive the event
    expect(mockHandleKeydown).toHaveBeenCalledTimes(0);

    // Verify input still works after navigation events
    fireEvent.change(input, { target: { value: "test-navigation" } });
    expect(input).toHaveDisplayValue("test-navigation");
  });
});

describe("InspectPopupClassListInput clipboard functionality", () => {
  const mockOnChangeClasses = vi.fn();

  it("should copy input value to clipboard when copy button is clicked", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<InspectPopupClassListInput debounce={0} onChangeClasses={mockOnChangeClasses} />);
    const input = screen.getByPlaceholderText("Add classes");
    const copyButton = screen.getByRole("button");

    await act(async () => {
      // Set input value and trigger change event
      fireEvent.change(input, { target: { value: "test-class" } });
      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 2));
    })

    // Ensure the input value is set before copying
    expect(input).toHaveDisplayValue("test-class");

    fireEvent.mouseDown(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-class");
  });
});