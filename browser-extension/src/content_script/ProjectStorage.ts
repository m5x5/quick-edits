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
  private static storageKey = "projectMappings";

  async addProjectMapping(projectMapping: ProjectMapping) {
    await ProjectMappingStorage.getProjectMappings();

    let host: string;

    try {
      host = new URL(projectMapping.pattern).host;
    } catch (error) {
      host = projectMapping.pattern;
    }

    // replace existing project mapping if pattern already exists
    const existingIndex = ProjectMappingStorage.projectMappings.findIndex(
      (mapping) => mapping.pattern === host,
    );
    console.log("mapping.pattern", projectMapping.pattern);
    console.log(ProjectMappingStorage.projectMappings);
    projectMapping.pattern = host;

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
    try {
      const rawResult = await chrome.storage.local.get([
        ProjectMappingStorage.storageKey,
      ]);

      if (!rawResult[ProjectMappingStorage.storageKey]) {
        log("No project mappings found in storage");
        return [];
      }

      const result = ProjectMappingArraySchema.safeParse(
        rawResult[ProjectMappingStorage.storageKey],
      );

      if (!result.success) {
        log("Invalid project mappings format in storage:", result.error);
        // Reset storage if data is invalid
        await ProjectMappingStorage.saveProjectMappings();
        return [];
      }

      ProjectMappingStorage.projectMappings = result.data;
      log(
        `Retrieved ${ProjectMappingStorage.projectMappings.length} project mappings`,
      );
      return ProjectMappingStorage.projectMappings;
    } catch (error) {
      log("Error retrieving project mappings:", error);
      return [];
    }
  }

  static async getProjectMapping(url: string) {
    console.log("getProjectMapping", url);
    const projectMappings = await ProjectMappingStorage.getProjectMappings();

    let host: string;
    try {
      host = new URL(url).host;
    } catch (error) {
      host = url;
    }

    console.log("getting host", host);
    log("Searching for host:", host);
    log("Available mappings:", projectMappings);

    return projectMappings.find(({ pattern }) => pattern === host);
  }

  static async saveProjectMappings() {
    try {
      await chrome.storage.local.set({
        [ProjectMappingStorage.storageKey]:
          ProjectMappingStorage.projectMappings,
      });

      // Verify the save was successful
      const verification = await chrome.storage.local.get([
        ProjectMappingStorage.storageKey,
      ]);
      if (!verification[ProjectMappingStorage.storageKey]) {
        throw new Error("Failed to verify project mappings save");
      }

      const result = ProjectMappingArraySchema.safeParse(
        verification[ProjectMappingStorage.storageKey],
      );
      if (!result.success) {
        throw new Error("Saved data failed schema validation");
      }

      log("Project mappings saved and verified successfully");
    } catch (error) {
      log("Error saving project mappings:", error);
      throw error;
    }
  }
}
