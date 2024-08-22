package main

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func isNextJSProject(folder string) bool {
	configFilePaths := []string{
		filepath.Join(folder, "package.json"),
		filepath.Join(folder, "next.config.js"),
		filepath.Join(folder, "pages"),
	}
	for _, configFilePath := range configFilePaths {
		if _, err := os.Stat(configFilePath); !os.IsNotExist(err) {
			return true
		}
	}
	return false
}

func nextJSHeuristicSorting(performSearchData struct {
	PerformSearchData
	OpenEditorData
}, matches []Match) {
	browserUrl := performSearchData.BrowserURL
	if !strings.Contains(browserUrl, "http://") {
		return
	}

	lastRoute := browserUrl[strings.LastIndex(browserUrl, "/")+1:]

	sort.SliceStable(matches, func(i, j int) bool {
		// Example heuristic: prioritize files in `pages` directory, then by line number
		priorityI := 0
		priorityJ := 0

		if strings.Contains(matches[i].Path, lastRoute) {
			priorityI = 1
		}
		if strings.Contains(matches[j].Path, lastRoute) {
			priorityJ = 1
		}

		if priorityI != priorityJ {
			return priorityI > priorityJ
		}

		return len(matches[i].Path) < len(matches[j].Path)
	})
}
