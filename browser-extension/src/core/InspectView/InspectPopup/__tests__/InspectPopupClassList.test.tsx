import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InspectPopupClassList from "../InspectPopupClassList";

describe("InspectPopupClassList", () => {
  let mockTarget: HTMLElement;
  const mockSetClasses = vi.fn();
  const mockSetAdditionalClasses = vi.fn();
  const mockSetShowSelectBox = vi.fn();
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    mockTarget = document.createElement("div");
    mockTarget.className = "text-lg bg-white";
    vi.clearAllMocks();

    // Mock chrome.runtime.sendMessage
    global.chrome = {
      runtime: {
        sendMessage: mockSendMessage
      }
    } as any;

    // Mock CustomEvent
    global.CustomEvent = vi.fn();
    global.document.dispatchEvent = vi.fn();
  });

  it("should record class deletion in version history", () => {
    render(
      <InspectPopupClassList
        target={mockTarget}
        classes="text-lg bg-white"
        setClasses={mockSetClasses}
        setAdditionalClasses={mockSetAdditionalClasses}
        additionalClasses=""
        setShowSelectBox={mockSetShowSelectBox}
      />
    );

    // Find and click delete button for text-lg class
    const classItems = screen.getAllByText("text-lg");
    const deleteButton = classItems[0].nextElementSibling as HTMLElement;
    fireEvent.mouseDown(deleteButton);

    // Verify class removal and history update
    expect(mockSetClasses).toHaveBeenCalledWith("bg-white");
    expect(mockTarget.classList.contains("text-lg")).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: "class_change",
      element: mockTarget.tagName.toLowerCase(),
      oldClasses: "text-lg bg-white",
      newClasses: "bg-white"
    });
  });

  it("should record additional class changes in version history", () => {
    render(
      <InspectPopupClassList
        target={mockTarget}
        classes="text-lg"
        setClasses={mockSetClasses}
        setAdditionalClasses={mockSetAdditionalClasses}
        additionalClasses="p-4"
        setShowSelectBox={mockSetShowSelectBox}
      />
    );

    // Find and click delete button for additional class
    const classItems = screen.getAllByText("p-4");
    const deleteButton = classItems[0].nextElementSibling as HTMLElement;
    fireEvent.mouseDown(deleteButton);

    // Verify additional class removal and history update
    expect(mockSetAdditionalClasses).toHaveBeenCalledWith("");
    expect(mockTarget.classList.contains("p-4")).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: "class_change",
      element: mockTarget.tagName.toLowerCase(),
      oldClasses: "p-4",
      newClasses: ""
    });
  });

  it("should record class variant changes in version history", async () => {
    render(
      <InspectPopupClassList
        target={mockTarget}
        classes="p-4"
        setClasses={mockSetClasses}
        setAdditionalClasses={mockSetAdditionalClasses}
        additionalClasses=""
        setShowSelectBox={mockSetShowSelectBox}
      />
    );

    // Find and click the class button to show variants
    const classButton = screen.getByText("p-4");
    fireEvent.mouseDown(classButton);

    // Find and click a variant option
    const variantButton = await screen.findByText("6");
    fireEvent.mouseDown(variantButton);

    // Verify class variant change and history update
    expect(mockSetClasses).toHaveBeenCalledWith("p-6");
    expect(mockTarget.classList.contains("p-6")).toBe(true);
    expect(mockTarget.classList.contains("p-4")).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: "class_change",
      element: mockTarget.tagName.toLowerCase(),
      oldClasses: "p-4",
      newClasses: "p-6"
    });
  });

  it("should support undo operation for class changes", async () => {
    render(
      <InspectPopupClassList
        target={mockTarget}
        classes="text-lg bg-white"
        setClasses={mockSetClasses}
        setAdditionalClasses={mockSetAdditionalClasses}
        additionalClasses=""
        setShowSelectBox={mockSetShowSelectBox}
      />
    );

    // Delete a class to create history
    const classItems = screen.getAllByText("text-lg");
    const deleteButton = classItems[0].nextElementSibling as HTMLElement;
    await fireEvent.mouseDown(deleteButton);

    expect(mockSetClasses).toHaveBeenLastCalledWith("bg-white");

    // Simulate Cmd+Z (or Ctrl+Z) keyboard shortcut using fireEvent
    fireEvent.keyDown(window, {
      key: 'z',
      code: 'KeyZ',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });

    // Verify class restoration
    expect(mockSetClasses).toHaveBeenLastCalledWith("text-lg bg-white");
    expect(mockTarget.classList.contains("text-lg")).toBe(true);
    expect(mockTarget.classList.contains("bg-white")).toBe(true);
  });

  it("should change the class if a variant is mouse clicked in dropdown", async () => {
    render(
      <InspectPopupClassList
        target={mockTarget}
        classes="text-lg bg-white"
        setClasses={mockSetClasses}
        setAdditionalClasses={mockSetAdditionalClasses}
        additionalClasses=""
        setShowSelectBox={mockSetShowSelectBox}
      />
    );

    // Find and click the text-lg class button to show variants
    const classButton = screen.getByText("text-lg");
    fireEvent.mouseDown(classButton);

    // Find and click a variant option (text-xl)
    const variantButton = await screen.findByText("xl");
    fireEvent.mouseDown(variantButton);

    // Verify class update and history tracking
    expect(mockSetClasses).toHaveBeenCalledWith("text-xl bg-white");
    expect(mockTarget.classList.contains("text-xl")).toBe(true);
    expect(mockTarget.classList.contains("text-lg")).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: "class_change",
      element: mockTarget.tagName.toLowerCase(),
      oldClasses: "text-lg bg-white",
      newClasses: "text-xl bg-white"
    });
  })
});