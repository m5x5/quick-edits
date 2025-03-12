package search

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"quick_edits.com/native-search/types"
)

type Match struct {
	Path        string `json:"path"`
	LineNumber  int    `json:"lineNumber"`
	CharNumber  int    `json:"charNumber"`
	Type        string `json:"type"`
	DirectMatch bool   `json:"isDirectMatch"`
}

func PerformSearch(message types.Message) types.Response {
	// Set custom excluded directories if provided
	if message.Data.ExcludedDirectories != nil {
		fmt.Fprintf(os.Stderr, "Setting custom excluded directories: %v\n", message.Data.ExcludedDirectories)
		SetCustomExcludedDirectories(message.Data.ExcludedDirectories)
	} else {
		// Reset to empty if not provided
		SetCustomExcludedDirectories([]string{})
	}

	search, err := Search(message)

	if err != nil {
		return types.Response{
			Message: err.Error(),
			Success: false,
		}
	}

	if isNextJSProject(message.Data.Folder) {
		nextJSHeuristicSorting(message.Data, search)
	}

	return types.Response{
		Success: true,
		Data:    search,
	}
}

func Search(message types.Message) ([]Match, error) {
	if len(message.Data.Classes) < 4 && len(message.Data.TextContent) < 7 {
		err := errors.New("keyword length should be at least 4 characters")
		return nil, err
	}

	var matches []Match

	err := filepath.WalkDir(message.Data.Folder, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if len(matches) >= 15 {
			return nil
		}

		if IsDirectoryExcluded(path) {
			if d.IsDir() {
				fmt.Fprintf(os.Stderr, "Skipping excluded directory: %s\n", path)
				return filepath.SkipDir
			}
			return nil
		} else if d.IsDir() {
			return nil
		}

		if IsFileExcluded(d.Name()) {
			return nil
		}

		fileContent, err := fileContainsKeyword(path, message.Data.Classes, message.Data.TextContent)

		if err != nil {
			return err
		}

		if fileContent != "" {
			for lineNumber, line := range strings.Split(fileContent, "\n") {
				charNumber := SearchLine(line, message)

				if charNumber == -1 {
					continue
				}
				directMatch := WithContext(fileContent, lineNumber, message.Data.Classes, message.Data.TextContent)

				match := Match{
					Path:        path,
					LineNumber:  lineNumber + 1,
					CharNumber:  charNumber,
					Type:        "class",
					DirectMatch: directMatch,
				}
				matches = append(matches, match)
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return matches, nil
}

func SearchLine(line string, message types.Message) int {
	if message.Data.Classes != "" && strings.Contains(line, message.Data.Classes) {
		charNumber := strings.Index(line, message.Data.Classes) + 1
		return charNumber
	}

	return -1
}

func fileContainsKeyword(path, keyword string, textContent string) (string, error) {
	rawContent, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	content := string(rawContent)

	if keyword != "" && strings.Contains(content, keyword) {
		return content, nil
	} else if textContent != "" && strings.Contains(content, textContent) {
		return content, nil
	} else {
		return "", nil
	}
}
