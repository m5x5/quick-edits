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

	return (
		<QueryClientProvider client={queryClient}>
			<div className="quick-edits flex flex-col pb-4 dark:bg-[#292929] bg-white font-sans text-white min-w-[500px]">
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
