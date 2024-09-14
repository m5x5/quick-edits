package search

import (
	"path/filepath"
	"strings"
)

func IsDirectoryExcluded(directory string) bool {
	excludedList := []string{".git", ".next", ".vercel", "node_modules", "vendor", "cache", "fileadmin", "lock", "log", "var", ".idea", ".DS_Store", "dist", "package.json", "package-lock.json"}

	for _, ignore := range excludedList {
		if strings.Contains(directory, string(filepath.Separator)+ignore+string(filepath.Separator)) {
			return true
		}
	}
	return false
}

func IsFileExcluded(fileName string) bool {
	excludedList := []string{".gitignore", ".gitattributes", ".gitmodules", ".gitkeep", ".gitlab-ci.yml", ".gitlab-ci.yml.example", ".json"}

	for _, ignore := range excludedList {
		if strings.Contains(fileName, ignore) {
			return true
		}
	}

	return false
}
