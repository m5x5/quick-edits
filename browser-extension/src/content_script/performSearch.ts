import { NativeResponse, PerformSearchData } from "../background/NativeMessageController";
import ProjectMappingStorage from "./ProjectStorage";

export const performSearch = async (searchData: Omit<PerformSearchData, "folder">): Promise<{ path: string, lineNumber: number, charNumber: number }[]> => {
  const time = Date.now();
  const mapping = await ProjectMappingStorage.getProjectMapping(window.location.href);

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
        },
      },
      (response: NativeResponse<"perform_search">) => {
        if (!response.data?.length) return resolve([]);
        resolve(response.data);

        console.debug(
          "It took",
          Date.now() - time,
          "ms to perform the code search"
        );
      }
    );
  });
};
