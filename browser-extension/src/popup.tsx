import React from "react";
import { createRoot } from "react-dom/client";
import { openFolderInEditor } from "./content_script/utils";
import Button from "./core/Button";
import Section, { SectionBody } from "./core/Section";
import EditorSelection from "./core/ExtensionPopup/EditorSelection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProjectMappingConfiguration from "./core/ExtensionPopup/ProjectMappingConfiguration";

const queryClient = new QueryClient()

export const Popup = () => {
  const openExtensionInEditor = async () => {
    const developmentPath = (await chrome.storage.local.get(['extensionDevelopmentPath']));

    if (!developmentPath?.extensionDevelopmentPath) {
      console.error('Please set the extension development path in the settings');
      return;
    }

    openFolderInEditor(developmentPath.extensionDevelopmentPath);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="quick-edits flex flex-col pb-4 dark:bg-[#292929] bg-white font-sans text-white min-w-[500px]">
        <Section>Project Folder</Section>
        <ProjectMappingConfiguration />

        <Section>Editor</Section>
        <EditorSelection />

        <Section>Extension Settings</Section>
        <SectionBody>
          <div className="flex items-center gap-2 mb-0">
            <input
              className="form-checkbox h-3 w-3 text-orange-600 ml-2"
              id="setting1"
              name="setting1"
              type="checkbox"
            />
            <label
              className="dark:text-gray-300 text-blue-700"
              htmlFor="setting1"
            >
              Enable Auto-Run
            </label>
          </div>
          <div className="flex items-center gap-2 mb-0">
            <input
              className="form-checkbox h-3 w-3 text-orange-600 ml-2"
              id="setting2"
              name="setting2"
              type="checkbox"
            />
            <label
              className="dark:text-gray-300 text-blue-700"
              htmlFor="setting2"
            >
              Show Notifications
            </label>
          </div>
        </SectionBody>
        <Section>Enhance extension</Section>
        <SectionBody>
          <Button onMouseDown={() => openExtensionInEditor()}>
            Improve in Editor!
          </Button>
        </SectionBody>
      </div>
    </QueryClientProvider>
  );
};

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Popup />);
} else {
  console.error("Root element not found");
}
