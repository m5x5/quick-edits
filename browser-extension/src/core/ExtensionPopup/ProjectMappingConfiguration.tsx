import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import type { ProjectMapping } from "../../content_script/ProjectStorage";
import ProjectMappingStorage from "../../content_script/ProjectStorage";
import { openPathInEditor } from "../../content_script/utils";
import Button from "../Button";
import Input from "../Input";
import { SectionBody } from "../Section";

const projectMappingStorage = new ProjectMappingStorage();

const getActiveTabUrl = () => {
  return new Promise<string | undefined>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0].url);
    });
  });
};

// Escape special regex characters in the URL
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


export default function ProjectMappingConfiguration() {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

  const { data, isError, refetch } = useQuery({
    queryKey: ["project_mapping"],
    queryFn: async () => {
      const url = await getActiveTabUrl();
      if (!url) {
        console.error("No active tab found");
        return undefined;
      }
      const mapping = await ProjectMappingStorage.getProjectMapping(url);
      console.log("Retrieved mapping:", mapping);
      return mapping;
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
    retry: 2, // Retry failed requests twice
  });

  // Update local input value when query data changes
  useEffect(() => {
    console.log("data", data);
    if (data && !inputValue) {
      setInputValue(data.searchFolder || "");
    }
  }, [data]);

  // Auto-retry on error
  React.useEffect(() => {
    if (isError) {
      const timeoutId = setTimeout(() => {
        refetch();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isError, refetch]);

  const mutation = useMutation({
    mutationFn: async (data: ProjectMapping) => {
      setSaveStatus("saving");
      try {
        const result = await projectMappingStorage.addProjectMapping(data);
        console.log("result", result);
        const mapping = await ProjectMappingStorage.getProjectMapping(
          data.pattern
        );
        console.log("mapping", mapping);
        setSaveStatus("saved");
        return result;
      } catch (error) {
        console.error("Mutation error:", error);
        setSaveStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to save project folder"
        );
        throw error;
      }
    },
    onSuccess(data) {
      // Update the cache with the new data
      queryClient.setQueryData(["project_mapping"], data);

      // Invalidate the query to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["project_mapping"] });

      // Reset save status after 2 seconds
      const timeoutId = setTimeout(() => {
        setSaveStatus("idle");
        setErrorMessage(null);
      }, 2000);

      return () => clearTimeout(timeoutId);
    },
    onError(error) {
      console.error("Failed to save project folder:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save project folder"
      );

      // Retry the query to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["project_mapping"] });
    },
    // Retry failed mutations
    retry: 2,
  });

  return (
    <SectionBody>
      <div className="flex flex-col gap-2">
        <Input
          placeholder={"Search Folder"}
          className={
            "rounded-[4px] text-xs border-gray-300 py-[0.05rem] px-[0.2rem] placeholder:text-gray-400 dark:text-white"
          }
          value={inputValue}
          onChange={async (e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            const url = await getActiveTabUrl();
            if (!url) return;
            mutation.mutate({
              pattern: url,
              searchFolder: newValue,
            });
          }}
        />
        <div className="flex items-center justify-between">
          {inputValue && (
            <Button onMouseDown={() => openPathInEditor(inputValue)}>
              Open in Editor
            </Button>
          )}
          <div className="text-xs">
            {saveStatus === "saving" && (
              <span className="text-gray-500 dark:text-gray-400">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-500 dark:text-green-400">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-500 dark:text-red-400">
                {errorMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </SectionBody>
  );
}
