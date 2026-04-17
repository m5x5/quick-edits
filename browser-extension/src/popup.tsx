import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openPathInEditor } from "./content_script/utils";
import Button from "./core/Button";
import EditorSelection from "./core/ExtensionPopup/EditorSelection";
import NativeHostStatus from "./core/NativeHostStatus";
import ProjectMappingConfiguration from "./core/ExtensionPopup/ProjectMappingConfiguration";
import Section, { SectionBody } from "./core/Section";

const queryClient = new QueryClient();

export const Popup = () => {
	const openExtensionInEditor = async () => {
		const developmentPath = await chrome.storage.local.get([
			"extensionDevelopmentPath",
		]);

		if (!developmentPath?.extensionDevelopmentPath) {
			console.error(
				"Please set the extension development path in the settings",
			);
			return;
		}

		openPathInEditor(developmentPath.extensionDevelopmentPath);
	};

	const handleEnableQuickEdits = async () => {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.id) {
			chrome.runtime.sendMessage({ action: "enable_quick_edits", tabId: tab.id });
			// Close the popup
			window.close();
		}
	};

	return (
		<QueryClientProvider client={queryClient}>
			<div className="quick-edits flex flex-col pb-4 dark:bg-[#292929] bg-white font-sans text-white min-w-[500px]">
				<SectionBody>
					<button
						type="button"
						onClick={handleEnableQuickEdits}
						className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-lg border-0 cursor-pointer transition-colors"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M15 15l-4-4m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
						Enable Quick Edits
					</button>
				</SectionBody>

				<Section>Project Folder</Section>
				<ProjectMappingConfiguration />

				<Section>Editor</Section>
				<EditorSelection />

				<Section>Native Search Module Status</Section>
				<SectionBody>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col">
							<NativeHostStatus showRetryButton={true} />
						</div>
						<div className="text-sm text-gray-400 dark:text-gray-500">
							The native search module is required for project folder
							functionality. If you're experiencing issues, please check the
							connection status above.
						</div>
					</div>
				</SectionBody>

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
