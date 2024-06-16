package main

import (
	"bufio"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type Match struct {
	Path       string `json:"path"`
	LineNumber int    `json:"lineNumber"`
	CharNumber int    `json:"charNumber"`
}

func PerformSearch(message Message) Response {
	search, err := Search(message)

	if err != nil {
		return Response{
			Message: err.Error(),
			Success: false,
		}
	}

	return Response{
		Success: true,
		Data:    search,
	}
}

func Search(message Message) ([]Match, error) {
	if len(message.Data.Classes) < 4 && len(message.Data.TextContent) < 7 {
		err := errors.New("Keyword length should be at least 4 characters")
		return nil, err
	}

	var matches []Match

	err := filepath.Walk(message.Data.Folder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if shouldIgnorePath(path) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if containsKeyword(path, message.Data.Classes, message.Data.TextContent) {
			file, err := os.Open(path)
			if err != nil {
				return nil
			}
			defer file.Close()

			scanner := bufio.NewScanner(file)
			buf := make([]byte, 0, 64*1024)
			scanner.Buffer(buf, 1024*1024)
			lineNumber := 1
			for scanner.Scan() {
				line := scanner.Text()

				charNumber := SearchLine(line, message)

				if charNumber >= 0 {
					match := Match{
						Path:       path,
						LineNumber: lineNumber,
						CharNumber: charNumber,
					}
					matches = append(matches, match)
				}

				lineNumber++
			}

			if err := scanner.Err(); err != nil {
				return nil
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return matches, nil
}

func SearchLine(line string, message Message) int {
	if message.Data.Classes != "" && strings.Contains(line, message.Data.Classes) {
		charNumber := strings.Index(line, message.Data.Classes) + 1
		return charNumber
	}

	if message.Data.TextContent != "" {
		if len(message.Data.TextContent) > 50 {
			firstHalf := message.Data.TextContent[:50]
			secondHalf := message.Data.TextContent[50:]

			if strings.Contains(line, firstHalf) {
				charNumber := strings.Index(line, firstHalf) + 1
				return charNumber
			}

			if strings.Contains(line, secondHalf) {
				charNumber := strings.Index(line, secondHalf) + 1
				return charNumber
			}
		} else {
			if strings.Contains(line, message.Data.TextContent) {
				charNumber := strings.Index(line, message.Data.TextContent) + 1
				return charNumber
			}
		}
	}

	return -1
}

func shouldIgnorePath(path string) bool {
	ignoreList := []string{
		".git", ".next", ".vercel", "node_modules", "vendor", "cache", "fileadmin", "lock", "log", "var", ".idea", ".DS_Store", "dist",
	}
	for _, ignore := range ignoreList {
		if strings.Contains(path, string(filepath.Separator)+ignore+string(filepath.Separator)) {
			return true
		}
	}
	return false
}

func containsKeyword(path, keyword string, textContent string) bool {
	// Read the file content and check if it contains the keyword
	// You can use ioutil.ReadFile and strings.Contains to perform the search
	content, err := os.ReadFile(path)
	if err != nil {
		return false
	}

	if keyword != "" {
		return strings.Contains(string(content), keyword)
	} else {
		return strings.Contains(string(content), textContent)
	}
}

func findTagName(code string) string {
	openingTag := regexp.MustCompile(`\<\w+`)
	foundString := openingTag.FindString(code)

	foundTagName := strings.TrimPrefix(foundString, "<")

	if foundTagName != "" {
		return foundTagName
	} else {
		return "Not found"
	}
}
