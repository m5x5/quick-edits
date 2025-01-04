import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionBody } from "../Section";

export default function EditorSelection() {
  const queryClient = useQueryClient();
  const { isPending, data } = useQuery({
    queryKey: ["editor"],
    queryFn: () => chrome.storage.local.get(["editor"]),
  });
  const mutation = useMutation({
    mutationFn: async (editor: string) => {
      await chrome.storage.local.set({ editor });
      return { editor };
    },
    onSuccess: (data) => queryClient.setQueryData(["editor"], data),
  });

  return (
    <SectionBody>
      {isPending && <div>Loading...</div>}
      <select
        title="Select your editor"
        onChange={(e) => mutation.mutate(e.target.value)}
        value={data?.editor || "vscode"}
        className="dark:text-white rounded-[4px]"
      >
        <option value="phpstorm">PhpStorm</option>
        <option value="zed">Zed</option>
        <option value="vscode">VSCode</option>
        <option value="cursor">Cursor</option>
      </select>
    </SectionBody>
  );
}
