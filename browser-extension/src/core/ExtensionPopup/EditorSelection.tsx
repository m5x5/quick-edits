import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionBody } from "../Section";

interface Editor {
  id: string;
  name: string;
}

const defaultEditors: Editor[] = [
  { id: "phpstorm", name: "PhpStorm" },
  { id: "zed", name: "Zed" },
  { id: "vscode", name: "VSCode" },
  { id: "cursor", name: "Cursor" }
];

export default function EditorSelection() {
  const queryClient = useQueryClient();
  const { isPending: isEditorPending, data: editorData } = useQuery({
    queryKey: ["editor"],
    queryFn: () => chrome.storage.local.get(["editor"]),
  });

  const { isPending: isEditorsPending, data: editorsData } = useQuery({
    queryKey: ["editors"],
    queryFn: async () => {
      const data = await chrome.storage.local.get(["editors"]);
      return data.editors || defaultEditors;
    },
  });

  const editorMutation = useMutation({
    mutationFn: async (editor: string) => {
      await chrome.storage.local.set({ editor });
      return { editor };
    },
    onSuccess: (data) => queryClient.setQueryData(["editor"], data),
  });

  const addEditorMutation = useMutation({
    mutationFn: async (newEditor: Editor) => {
      const currentEditors = (await chrome.storage.local.get(["editors"])).editors || defaultEditors;
      const updatedEditors = [...currentEditors, newEditor];
      await chrome.storage.local.set({ editors: updatedEditors });
      return updatedEditors;
    },
    onSuccess: (data) => queryClient.setQueryData(["editors"], data),
  });

  return (
    <SectionBody>
      {(isEditorPending || isEditorsPending) && <div>Loading...</div>}
      <div className="flex flex-col gap-2">
        <select
          title="Select your editor"
          onChange={(e) => editorMutation.mutate(e.target.value)}
          value={editorData?.editor || "vscode"}
          className="dark:text-white rounded-[4px]"
        >
          {editorsData?.map((editor: Editor) => (
            <option key={editor.id} value={editor.id}>
              {editor.name}
            </option>
          ))}
        </select>
        <a
          href={`chrome-extension://${chrome.runtime.id}/options.html`}
          className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          Configure native search integration
        </a>
      </div>
    </SectionBody>
  );
}
