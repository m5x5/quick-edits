package search

import (
	"strings"

	"quick_edits.com/native-search/parsers/lexers"
)

type ContextSearchResult struct {
	IsDirectMatch bool
}

func SearchWithContext(fileContent string, lineNumber int, classes string, textContent string) bool {
	lines := strings.Split(fileContent, "\n")
	line := lines[lineNumber]

	//if DirectClassMatch(line, classes) {
	//return true
	//}

	windowStart := lineNumber - 5
	windowEnd := lineNumber + 5
	if windowStart < 0 {
		windowStart = 0
	}
	if windowEnd > len(lines) {
		windowEnd = len(lines)
	}

	contextWindow := lines[windowStart:windowEnd]
	if DirectClassMatch(line, classes) && ApproximateTextMatch(contextWindow, textContent) {
		return true
	}

	return false
}

func DirectClassMatch(line string, classes string) bool {
	lexed := lexers.ParseHTML(line)
	for _, token := range lexed {
		if token.TokenType == lexers.AttributeValueDoubleQuoted {
			// do something
			if token.Value == classes {
				return true
			}
		}
	}
	return false
}

func ApproximateTextMatch(contextWindow []string, textContent string) bool {
	content := strings.Join(contextWindow, "\n")
	if textContent != "" {
		if len(textContent) > 50 {
			firstHalf := textContent[:50]
			secondHalf := textContent[50:]

			if strings.Contains(content, firstHalf) {
				return true
			}

			if strings.Contains(content, secondHalf) {
				return true
			}
		} else {
			if strings.Contains(content, textContent) {
				return true
			}
		}
	}
	return false
}
