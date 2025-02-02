import type {
    NativeResponse,
    PerformSearchData,
} from "../background/NativeMessageController";
import ProjectMappingStorage from "./ProjectStorage";

export const performSearch = async (
  searchData: Omit<PerformSearchData, "folder">,
): Promise<{ path: string; lineNumber: number; charNumber: number, isDirectMatch: boolean }[]> => {
  const time = Date.now();
  console.log('QuickEdits Extension: Initiating search with data:', searchData);

  const mapping = await ProjectMappingStorage.getProjectMapping(
    window.location.href,
  );

  if (!mapping) {
    console.warn('QuickEdits Extension: No project mapping found for current URL');
    return [];
  }

  if (searchData.textContent.length >= 500) {
    console.warn('QuickEdits Extension: Search text content truncated to 500 characters');
    searchData.textContent = searchData.textContent.substring(0, 499)
  }

  return new Promise((resolve) => {
    console.log('QuickEdits Extension: Sending search request to background script');
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
          console.error("QuickEdits Extension: Native messaging host returned no response to perform search request.");
          return resolve([]);
        }
        if (!response.data?.length) {
          console.log('QuickEdits Extension: No search results found');
          return resolve([]);
        }
        console.log('QuickEdits Extension: Search completed with results:', response.data);
        resolve(response.data);

        console.debug(
          "QuickEdits Extension: Search completed in",
          Date.now() - time,
          "ms",
        );
      },
    );
  });
};
