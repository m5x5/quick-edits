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

        <Section className="hidden">Enhance extension</Section>
        <SectionBody className="hidden">
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
