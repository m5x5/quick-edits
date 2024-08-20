import React from "react";
import { createRoot } from "react-dom/client";
import Section, { SectionBody } from "./core/Section";
import "./popup.css";
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import ProjectMappingStorage from "./content_script/ProjectStorage";

const Options = () => {
	const { data } = useQuery({
		queryKey: ["projectMappings"],
		queryFn: async () => {
			const response = await ProjectMappingStorage.getProjectMappings();
			return response;
		},
	});

	const queryClient = useQueryClient();

	const { data: extensionDevelopmentPathData } = useQuery({
		queryKey: ["extensionDevelopmentPath"],
		queryFn: async () => {
			const developmentPath = await chrome.storage.local.get([
				"extensionDevelopmentPath",
			]);
			console.log(developmentPath);
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
		<>
			<Section>All Mappings</Section>
			<SectionBody>
				{data?.map((mapping) => (
					<div key={mapping.pattern}>
						<div>{mapping.pattern}</div>
						<div>{mapping.searchFolder}</div>
					</div>
				))}
			</SectionBody>
			<Section>Extension Development Path</Section>
			<SectionBody>
				<input
					onChange={(e) => mutation.mutate(e.target.value)}
					value={extensionDevelopmentPathData || ""}
				/>
			</SectionBody>
			<section
				className="dark:bg-black dark:text-white w-full py-12 md:py-24 lg:py-32"
				id="contact"
				aria-label="Sektion zu Kontaktmöglichkeiten"
			>
				<div className="container px-4 md:px-6 mx-auto">
					<div className="flex flex-col items-center justify-center space-y-4 text-center">
						<div className="space-y-2">
							<h2 className="text-3xl font-bold tracking-tight md:text-4xl/tight">
								Kontakt aufnehmen
							</h2>
							<p className="max-w-[900px] text-gray-500 lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
								Sind Sie an einer Zusammenarbeit interessiert? Kontaktieren Sie
								mich gerne.
							</p>
						</div>
						<div className="mt-6 flex space-x-4">
							<a
								className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								aria-label="im neuen Tab in Twitter öffnen"
								target="_blank"
								href="https://twitter.com/m5x5p" rel="noreferrer"
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
							</a>
							<a
								className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								aria-label="im neuen Tab in GitHub öffnen"
								target="_blank"
								href="https://github.com/m5x5" rel="noreferrer"
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
							</a>
							<a
								className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								aria-label="im neuen Tab in Linkedin öffnen"
								target="_blank"
								href="https://www.linkedin.com/in/michael-peters-3985a0223/" rel="noreferrer"
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
							</a>
							<a
								className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								aria-label="im neuen Tab in Xing öffnen"
								target="_blank"
								href="https://www.xing.com/profile/Michael_Peters339" rel="noreferrer"
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
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

const root = createRoot(document.getElementById("root")!);
const queryClient = new QueryClient();

root.render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Options />
		</QueryClientProvider>
	</React.StrictMode>,
);
