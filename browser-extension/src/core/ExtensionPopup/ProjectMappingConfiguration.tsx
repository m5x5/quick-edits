import React from "react";
import { SectionBody } from "../Section";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openPathInEditor } from "../../content_script/utils";
import Button from "../Button";
import ProjectMappingStorage from "../../content_script/ProjectStorage";
import type {
    ProjectMapping,
} from "../../content_script/ProjectStorage";
import Input from "../Input";

const projectMappingStorage = new ProjectMappingStorage();

const getActiveTabUrl = () => {
	return new Promise<string | undefined>((resolve) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			resolve(tabs[0].url);
		});
	});
};

export default function ProjectMappingConfiguration() {
	const queryClient = useQueryClient();
	const { data } = useQuery({
		queryKey: ["project_mapping"],
		queryFn: async () => {
			const url = await getActiveTabUrl();
			if (!url) return console.error("No active tab found");
			return await ProjectMappingStorage.getProjectMapping(url);
		},
	});
	const mutation = useMutation({
		mutationFn: (data: ProjectMapping) =>
			projectMappingStorage.addProjectMapping(data),
		onSuccess(data) {
			queryClient.setQueryData(["project_mapping"], data);
		},
	});

	return (
		<SectionBody>
			<Input
				placeholder={"Search Folder"}
				className={
					"rounded-[4px] text-xs border-gray-300 py-[0.05rem] px-[0.2rem] placeholder:text-gray-400 dark:text-white"
				}
				value={data?.searchFolder || ""}
				onChange={async (e) =>
					mutation.mutate({
						pattern: data?.pattern || (await getActiveTabUrl()) || "",
						searchFolder: e.target.value,
					})
				}
			/>
			{data?.searchFolder && (
				<Button onMouseDown={() => openPathInEditor(data.searchFolder)}>
					Open in Editor
				</Button>
			)}
		</SectionBody>
	);
}
