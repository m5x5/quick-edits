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

    // replace existing project mapping if pattern already exists
    const existingIndex = ProjectMappingStorage.projectMappings.findIndex(
      (mapping) => mapping.pattern === projectMapping.pattern
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
    try {
      const rawResult = await chrome.storage.local.get([this.storageKey]);

      if (!rawResult[this.storageKey]) {
        log("No project mappings found in storage");
        return [];
      }

      const result = ProjectMappingArraySchema.safeParse(
        rawResult[this.storageKey]
      );

      if (!result.success) {
        log("Invalid project mappings format in storage:", result.error);
        // Reset storage if data is invalid
        await this.saveProjectMappings();
        return [];
      }

      this.projectMappings = result.data;
      log(`Retrieved ${this.projectMappings.length} project mappings`);
      return this.projectMappings;
    } catch (error) {
      log("Error retrieving project mappings:", error);
      return [];
    }
  }

  static async getProjectMapping(pattern: string) {
    const projectMappings = await this.getProjectMappings();
    log("Searching for pattern:", pattern);
    log("Available mappings:", projectMappings);

    const found = projectMappings.find((projectMapping) => {
      try {
        const matches = new RegExp(projectMapping.pattern).test(pattern);
        log("Testing pattern:", projectMapping.pattern, "Result:", matches);
        return matches;
      } catch (error) {
        log("Error testing pattern:", error);
        return false;
      }
    });

    return found;
  }

  static async saveProjectMappings() {
    try {
      await chrome.storage.local.set({
        [this.storageKey]: this.projectMappings,
      });

      // Verify the save was successful
      const verification = await chrome.storage.local.get([this.storageKey]);
      if (!verification[this.storageKey]) {
        throw new Error("Failed to verify project mappings save");
      }

      const result = ProjectMappingArraySchema.safeParse(
        verification[this.storageKey]
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
