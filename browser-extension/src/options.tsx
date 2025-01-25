import React from "react";
import { createRoot } from "react-dom/client";
import Section, { SectionBody } from "./core/Section";
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import ProjectMappingStorage from "./content_script/ProjectStorage";
import Input from "./core/Input";
import Button from "./core/Button";

interface Editor {
	id: string;
	name: string;
	path?: string;
}

const defaultEditors: Editor[] = [
	{ id: "phpstorm", name: "PhpStorm" },
	{ id: "zed", name: "Zed" },
	{ id: "vscode", name: "VSCode" },
	{ id: "cursor", name: "Cursor" }
];

const Options = () => {
	const { data } = useQuery({
		queryKey: ["projectMappings"],
		queryFn: async () => {
			const response = await ProjectMappingStorage.getProjectMappings();
			return response;
		},
	});

	const { data: editorsData } = useQuery({
		queryKey: ["editors"],
		queryFn: async () => {
			const data = await chrome.storage.local.get(["editors"]);
			return data.editors || defaultEditors;
		},
	});

	const editorMutation = useMutation({
		mutationFn: async (editor: Editor) => {
			const currentEditors = (await chrome.storage.local.get(["editors"])).editors || defaultEditors;
			const updatedEditors = currentEditors.map((e) => e.id === editor.id ? editor : e);
			await chrome.storage.local.set({ editors: updatedEditors });
			return updatedEditors;
		},
		onSuccess: (data) => queryClient.setQueryData(["editors"], data),
	});

	const addEditorMutation = useMutation({
		mutationFn: async (newEditor: Editor) => {
			const currentEditors = (await chrome.storage.local.get(["editors"])).editors || defaultEditors;
			const updatedEditors = [...currentEditors, { ...newEditor, id: newEditor.name.toLowerCase() }];
			await chrome.storage.local.set({ editors: updatedEditors });
			return updatedEditors;
		},
		onSuccess: (data) => queryClient.setQueryData(["editors"], data),
	});

	const deleteEditorMutation = useMutation({
		mutationFn: async (editorId: string) => {
			const currentEditors = (await chrome.storage.local.get(["editors"])).editors || defaultEditors;
			const updatedEditors = currentEditors.filter((e) => e.id !== editorId);
			await chrome.storage.local.set({ editors: updatedEditors });
			return updatedEditors;
		},
		onSuccess: (data) => queryClient.setQueryData(["editors"], data),
	});

	const queryClient = useQueryClient();

	const { data: extensionDevelopmentPathData } = useQuery({
		queryKey: ["extensionDevelopmentPath"],
		queryFn: async () => {
			const developmentPath = await chrome.storage.local.get([
				"extensionDevelopmentPath",
			]);
			return developmentPath.extensionDevelopmentPath;
		},
	});

	const mutation = useMutation({
		mutationFn: async (extensionDevelopmentPath: string) => {
			await chrome.storage.local.set({ extensionDevelopmentPath });
			return extensionDevelopmentPath;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["extensionDevelopmentPath"], data);
		},
	});

	return (
		<div className="quick-edits flex flex-col pb-4 font-sans text-white min-w-[500px] min-h-full">
			<Section>All Mappings</Section>
			<SectionBody className={"!gap-2"}>
				{data?.map((mapping) => (
					<div key={mapping.pattern} className="flex items-center justify-between p-3 border border-[#3c4043] hover:bg-[#2c2e31] transition-colors rounded-lg">
						<div className="flex flex-col gap-2">
							<div className="font-mono font-medium text-[#e8eaed]">{mapping.pattern}</div>
							<div className="text-[#9aa0a6] font-mono">{mapping.searchFolder}</div>
						</div>
						<div className="flex gap-2">
							<button className="p-2 rounded-lg hover:bg-[#383a3d] text-[#9aa0a6] hover:text-[#e8eaed] transition-all">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
								</svg>
							</button>
							<button className="p-2 rounded-lg hover:bg-[#383a3d] text-[#9aa0a6] hover:text-[#e8eaed] transition-all">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
							</button>
						</div>
					</div>
				))}
			</SectionBody>
			<Section>Extension Development Path</Section>
			<SectionBody>
				<Input
					aria-label="Extension Development Path"
					onChange={(e) => mutation.mutate(e.target.value)}
					value={extensionDevelopmentPathData || ""}
				/>
			</SectionBody>
			<Section>Editor Configuration</Section>
			<SectionBody className="gap-0">
						<h3 className="text-[#e8eaed] text-sm font-medium">Available Editors</h3>
						{editorsData?.map((editor) => (
							<div key={editor.id} className="flex items-center justify-between p-3 border border-[#3c4043] hover:bg-[#2c2e31] transition-colors rounded-lg">
								<div className="flex flex-col gap-1">
									<div className="font-mono font-medium text-[#e8eaed]">{editor.name}</div>
									<div className="text-[#9aa0a6] font-mono">{editor.path || 'Default path'}</div>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => {
											const path = prompt('Enter editor path:', editor.path || '');
											if (path !== null) {
												editorMutation.mutate({ ...editor, path });
											}
										}}
										className="p-2 rounded-lg hover:bg-[#383a3d] text-[#9aa0a6] hover:text-[#e8eaed] transition-all"
									>
										<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
										</svg>
									</button>
									<button
										onClick={() => deleteEditorMutation.mutate(editor.id)}
										className="p-2 rounded-lg hover:bg-[#383a3d] text-[#9aa0a6] hover:text-[#e8eaed] transition-all"
									>
										<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
									</button>
								</div>
							</div>
						))}
					<div className="flex flex-col gap-2">
						<h3 className="text-[#e8eaed] text-sm font-medium">Add New Editor</h3>
						<form onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							const name = formData.get('name') as string;
							const path = formData.get('path') as string;

							if (name) {
								addEditorMutation.mutate({ name, path: path || undefined });
								e.currentTarget.reset();
							}
						}} className="flex gap-2">
							<Input
								name="name"
								placeholder="Editor Name"
								className="flex-1"
								required
								aria-label="Editor Name"
							/>
							<Input
								name="path"
								placeholder="Editor Path (optional)"
								className="flex-1"
								aria-label="Editor Path"
							/>
							<Button type="submit">
								Add Editor
							</Button>
						</form>
				</div>
			</SectionBody>
			<section
				className="dark:text-white w-full py-12 md:py-24 lg:py-32"
				id="contact"
				aria-label="Sektion zu Kontaktmöglichkeiten"
			>
				<div className="container px-4 md:px-6 mx-auto">
					<div className="flex flex-col items-center justify-center space-y-4 text-center">
						<div className="space-y-2">
							<h2 className="tracking-tight text-2xl font-medium">
								Contact me
							</h2>
							<p className="max-w-[900px] text-gray-500 lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
								Are you interested in a collaboration? Contact me.
							</p>
						</div>
						<div className="mt-6 flex flex-wrap gap-6 justify-center">
							<a
								className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 hover:scale-110 transform"
								aria-label="im neuen Tab in Twitter öffnen"
								target="_blank"
								href="https://twitter.com/m5x5p"
								rel="noreferrer"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="tabler-icon tabler-icon-brand-x h-6 w-6"
								>
									<title>Twitter</title>
									<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
									<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
								</svg>
								<span>Twitter</span>
							</a>
							<a
								className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 hover:scale-110 transform"
								aria-label="im neuen Tab in GitHub öffnen"
								target="_blank"
								href="https://github.com/m5x5"
								rel="noreferrer"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="tabler-icon tabler-icon-brand-github h-6 w-6"
								>
									<title>GitHub</title>
									<path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
								</svg>
								<span>GitHub</span>
							</a>
							<a
								className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 hover:scale-110 transform"
								aria-label="im neuen Tab in Linkedin öffnen"
								target="_blank"
								href="https://www.linkedin.com/in/michael-peters-3985a0223/"
								rel="noreferrer"
							>
								<svg
									className="h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<title>LinkedIn</title>
									<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
									<rect width="4" height="12" x="2" y="9" />
									<circle cx="4" cy="4" r="2" />
								</svg>
								<span>LinkedIn</span>
							</a>
							<a
								className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 hover:scale-110 transform"
								aria-label="im neuen Tab in Xing öffnen"
								target="_blank"
								href="https://www.xing.com/profile/Michael_Peters339"
								rel="noreferrer"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="tabler-icon tabler-icon-brand-xing h-6 w-6"
								>
									<title>Xing</title>
									<path d="M16 21l-4 -7l6.5 -11" />
									<path d="M7 7l2 3.5l-3 4.5" />
								</svg>
								<span>Xing</span>
							</a>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export { Options };

const renderOptions = () => {
	const root = createRoot(document.getElementById("root")!);
	const queryClient = new QueryClient();

	root.render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<Options />
			</QueryClientProvider>
		</React.StrictMode>,
	);
}

if (typeof process === 'undefined' || !process.env.VITEST) {
	renderOptions();
}