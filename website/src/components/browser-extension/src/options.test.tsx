import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Options } from "./options";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProjectMappingStorage from "./content_script/ProjectStorage";
import '@testing-library/jest-dom';

vi.mock("./content_script/ProjectStorage", () => ({
  default: {
    getProjectMappings: vi.fn(),
  },
}));

vi.mock("chrome", () => ({
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
}));

vi.mock("@testing-library/react", async () => {
  const actual = await vi.importActual("@testing-library/react");
  return actual;
});

beforeEach(() => {
  vi.clearAllMocks();
});

global.chrome = {
  storage: {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        QUOTA_BYTES: 0,
    } as any,
  } as any,
} as any;

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
}

describe("Options Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.storage.local.get as Mock).mockImplementation((keys) => {
      if (Array.isArray(keys) && keys.includes("editors")) {
        return Promise.resolve({ editors: [] });
      }
      if (Array.isArray(keys) && keys.includes("extensionDevelopmentPath")) {
        return Promise.resolve({ extensionDevelopmentPath: "/test/path" });
      }
      return Promise.resolve({});
    });
    (ProjectMappingStorage.getProjectMappings as Mock).mockResolvedValue([]);
  });

  it("should display the editor configuration section", async () => {
    renderWithQueryClient(<Options />);
    const heading = await screen.findByRole("heading", { name: /editor configuration/i });
    expect(heading).toBeInTheDocument();
  });

  it("should allow users to add a new editor with name and path", async () => {
    renderWithQueryClient(<Options />);
    
    const nameInput = screen.getByRole("textbox", { name: /editor name/i });
    const pathInput = screen.getByRole("textbox", { name: /editor path/i });
    const submitButton = screen.getByRole("button", { name: /add editor/i });

    await fireEvent.change(nameInput, { target: { value: "Test Editor" } });
    await fireEvent.change(pathInput, { target: { value: "/test/editor/path" } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        editors: expect.arrayContaining([
          expect.objectContaining({
            name: "Test Editor",
            path: "/test/editor/path",
            id: "test editor",
          }),
        ]),
      });
    });
  });

  it("should display project mappings when they exist", async () => {
    const mockMappings = [
      { pattern: "test-pattern", searchFolder: "/test/folder" },
    ];
    (ProjectMappingStorage.getProjectMappings as Mock).mockResolvedValue(mockMappings);

    renderWithQueryClient(<Options />);

    const patternText = await screen.findByText("test-pattern");
    const folderText = await screen.findByText("/test/folder");

    expect(patternText).toBeInTheDocument();
    expect(folderText).toBeInTheDocument();
  });

  it("should allow users to update the extension development path", async () => {
    renderWithQueryClient(<Options />);

    const input = await screen.findByRole("textbox", { name: /extension development path/i });
    await fireEvent.change(input, { target: { value: "/new/test/path" } });

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        extensionDevelopmentPath: "/new/test/path",
      });
    });
  });
});