import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openPathInEditor } from "./content_script/utils";
import Button from "./core/Button";
import EditorSelection from "./core/ExtensionPopup/EditorSelection";
import ProjectMappingConfiguration from "./core/ExtensionPopup/ProjectMappingConfiguration";
import Section, { SectionBody } from "./core/Section";

const queryClient = new QueryClient();

export const Popup = () => {
	const [nativeHostError, setNativeHostError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const testNativeHostConnection = useCallback(() => {
		chrome.runtime.sendMessage(
			{
				action: "test_native_host",
				folder: "some/invalid/folder",
				classes: "hello",
				textContent: "hello",
        browserUrl: "",
			},
			(response) => {
				if (!response?.success) {
					setNativeHostError(true);
					setErrorMessage(
						response?.message || "Native messaging host is not accessible",
					);
				} else {
					setNativeHostError(false);
					setErrorMessage(null);
				}
			},
		);
	}, []);

	useEffect(() => {
		// Listen for native messaging host errors
		const messageListener = (message: { type: string; message: string }) => {
			if (message.type === "native_host_error") {
				setNativeHostError(true);
				setErrorMessage(message.message);
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		// Test native messaging host connection on load
		testNativeHostConnection();

		return () => {
			chrome.runtime.onMessage.removeListener(messageListener);
		};
	}, [testNativeHostConnection]);

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
						<div className="flex items-center justify-between flex-col">
							<Button onMouseDown={testNativeHostConnection}>
								{nativeHostError ? "Retry Connection" : "Test Connection"}
							</Button>
							{nativeHostError && (
								<div
									className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 rounded relative text-sm"
									role="alert"
								>
									<strong className="font-bold">Connection Error</strong>
									<span className="block sm:inline">
										{" "}
										{errorMessage ||
											"The native messaging host is not accessible. Please follow the setup instructions at "}
										<a
											href="https://quick-edits.dev"
											target="_blank"
											rel="noopener noreferrer"
											className="underline hover:text-red-800 dark:hover:text-red-200"
										>
											quick-edits.dev
										</a>{" "}
										to configure the native messaging host.
									</span>
								</div>
							)}
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
