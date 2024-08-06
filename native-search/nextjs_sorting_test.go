package main

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestSorting(t *testing.T) {
	message := Message{
		Data: struct {
			PerformSearchData
			OpenEditorData
		}{
			PerformSearchData: PerformSearchData{
				Folder:      "",
				BrowserURL:  "",
				Classes:     "bg-berli-yellow",
				TextContent: "Test",
			},
		},
	}

	response, err := Search(message)

	jresponse, _ := json.MarshalIndent(response, "", "  ")
	t.Log(string(jresponse))

	nextJSHeuristicSorting(message.Data, response)
	jresponse, _ = json.MarshalIndent(response, "", "  ")
	t.Log(string(jresponse))

	t.Log("\n\n\n")
	t.Error("TestSorting")

	if err != nil {
		t.Errorf("Expected nil, got %v", err)
	}

	for _, match := range response {
		if !strings.Contains(match.Path, "chrome-extension-typescript-starter") {
			t.Errorf("It exited the folder 'chrome-extension-typescript-starter', got %v", match.Path)
		}
	}
}
