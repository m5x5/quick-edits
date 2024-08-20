import { useQuery } from "@tanstack/react-query";
import ProjectMappingStorage from "../../../content_script/ProjectStorage";

export default function useMapping() {
	const { data } = useQuery({
		queryKey: ["project_mapping"],
		queryFn: async () => {
			const url = window.location.href;
			if (!url) return console.error("No active tab found");
			return await ProjectMappingStorage.getProjectMapping(url);
		},
	});

	return data;
}
