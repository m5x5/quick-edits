import type {
  NativeResponse,
  PerformSearchData,
} from "../background/NativeMessageController";
import ProjectMappingStorage from "./ProjectStorage";

export const performSearch = async (
  searchData: Omit<PerformSearchData, "folder">,
): Promise<{ path: string; lineNumber: number; charNumber: number, isDirectMatch: boolean }[]> => {
  const time = Date.now();
  const mapping = await ProjectMappingStorage.getProjectMapping(
    window.location.href,
  );

  if (searchData.textContent.length >= 500) {
    searchData.textContent = searchData.textContent.substring(0, 499)
  }

  return new Promise((resolve) => {
    // TODO: handle multiple mappings with filter

    if (!mapping) return resolve([]);

    chrome.runtime.sendMessage(
      {
        action: "perform_search",
        data: {
          folder: mapping.searchFolder,
          classes: searchData.classes,
          textContent: searchData.textContent,
          browserUrl: searchData.browserUrl,
        },
      },
      (response: NativeResponse<"perform_search">) => {
        if (!response) {
          console.error("Quick Edits native messaging host returned no response to perform search request.")
        }
        if (!response.data?.length) return resolve([]);
        resolve(response.data);

        console.debug(
          "It took",
          Date.now() - time,
          "ms to perform the code search",
        );
      },
    );
  });
};
