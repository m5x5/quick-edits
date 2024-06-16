package main

import (
	"strings"
	"testing"
)

func TestSearch(t *testing.T) {
	message := Message{
		Data: struct {
			PerformSearchData
			OpenEditorData
		}{
			PerformSearchData: PerformSearchData{
				Folder:  "/Users/michael/Software/private/chrome-extension-typescript-starter/",
				Keyword: "chrome",
			},
		},
	}

	response, err := Search(message)

	if err != nil {
		t.Errorf("Expected nil, got %v", err)
	}

	for _, match := range response {
		if !strings.Contains(match.Path, "chrome-extension-typescript-starter") {
			t.Errorf("It exited the folder 'chrome-extension-typescript-starter', got %v", match.Path)
		}
	}
}

func TestShouldIgnoreChecking(t *testing.T) {
	ignoresTest := shouldIgnorePath("/test/")

	if ignoresTest {
		t.Errorf("Expected false, got %v", ignoresTest)
	}

	ignoresLog := shouldIgnorePath("/log/")

	if !ignoresLog {
		t.Errorf("Expected true, got false")
	}
}

func TestContainsKeyword(t *testing.T) {
	t.Run("find in same line", func(t *testing.T) {
		code := `<h1 className="bg-red-500 text-white">Test</h1>`

		tagName := findTagName(code)

		if tagName != "h1" {
			t.Errorf("Expected \"h1\", got \"%v\"", tagName)
		}
	})

	t.Run("find in same line, without arguments", func(t *testing.T) {
		code := `<h1>Test</h1>`

		tagName := findTagName(code)

		if tagName != "h1" {
			t.Errorf("Expected \"h1\", got \"%v\"", tagName)
		}
	})
}
