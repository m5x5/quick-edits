package search

import (
	"path/filepath"
	"strings"
)

var customExcludedDirectories []string

// SetCustomExcludedDirectories sets the custom directories to exclude
func SetCustomExcludedDirectories(dirs []string) {
	customExcludedDirectories = dirs
}

func IsDirectoryExcluded(directory string) bool {
	// Default excluded directories
	defaultExcludedList := []string{
		".git", ".next", ".vercel", "node_modules", "vendor", "cache", "fileadmin", "lock", "log", "var", ".idea",
		".DS_Store", "dist", "package.json", "package-lock.json", ".cursor", ".vscode", "docker-webhook", "e2e-tests",
		"fixtures", "public",
	}

	// Check custom excluded directories first
	for _, ignore := range customExcludedDirectories {
		// Check if the directory path ends with the excluded directory
		if strings.HasSuffix(directory, string(filepath.Separator)+ignore) {
			return true
		}

		// Check if the directory path contains the excluded directory as a component
		if strings.Contains(directory, string(filepath.Separator)+ignore+string(filepath.Separator)) {
			return true
		}

		// Check if the directory itself is the excluded directory (for top-level directories)
		if filepath.Base(directory) == ignore {
			return true
		}
	}

	// Then check default excluded directories
	for _, ignore := range defaultExcludedList {
		// Check if the directory path ends with the excluded directory
		if strings.HasSuffix(directory, string(filepath.Separator)+ignore) {
			return true
		}

		// Check if the directory path contains the excluded directory as a component
		if strings.Contains(directory, string(filepath.Separator)+ignore+string(filepath.Separator)) {
			return true
		}

		// Check if the directory itself is the excluded directory (for top-level directories)
		if filepath.Base(directory) == ignore {
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
