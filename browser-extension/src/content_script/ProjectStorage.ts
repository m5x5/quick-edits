import debug from "debug";
import { z } from "zod";
const log = debug("ProjectStorage");

const ProjectMappingSchema = z.object({
	pattern: z.string(),
	searchFolder: z.string(),
});

const ProjectMappingArraySchema = z.array(ProjectMappingSchema);

export type ProjectMapping = {
	pattern: string;
	searchFolder: string;
};

export default class ProjectMappingStorage {
	static projectMappings: ProjectMapping[] = [];

	async addProjectMapping(projectMapping: ProjectMapping) {
		await ProjectMappingStorage.getProjectMappings();

		// replace existing project mapping if pattern already exists
		const existingIndex = ProjectMappingStorage.projectMappings.findIndex(
			(mapping) => mapping.pattern === projectMapping.pattern,
		);

		if (existingIndex !== -1) {
			ProjectMappingStorage.projectMappings[existingIndex] = projectMapping;
		} else {
			if (projectMapping.pattern && projectMapping.searchFolder) {
				ProjectMappingStorage.projectMappings.push(projectMapping);
			}
		}

		await ProjectMappingStorage.saveProjectMappings();
		return projectMapping;
	}

	static async getProjectMappings() {
		const rawResult = await chrome.storage.local.get(["projectMappings"]);

		if (!rawResult.projectMappings) {
			log("No project mappings found. No value in storage.");
			return [];
		}

		const result = ProjectMappingArraySchema.safeParse(
			rawResult.projectMappings,
		);

		if (result.success) {
			ProjectMappingStorage.projectMappings = result.data;
		} else {
			log("Project mappings found but invalid. Resetting to empty array.");
			await ProjectMappingStorage.saveProjectMappings();
			return [];
		}

		if (!ProjectMappingStorage.projectMappings.length) {
			log("No project mappings found. Empty array.");
			return ProjectMappingStorage.projectMappings;
		}

		return ProjectMappingStorage.projectMappings;
	}

	static async getProjectMapping(pattern: string) {
		const projectMappings = await ProjectMappingStorage.getProjectMappings();
		return projectMappings.find((projectMapping) => {
			return new RegExp(projectMapping.pattern).test(pattern);
		});
	}

	static async saveProjectMappings() {
		await chrome.storage.local.set({
			projectMappings: ProjectMappingStorage.projectMappings,
		});
		log("Project mappings saved");
	}
}
