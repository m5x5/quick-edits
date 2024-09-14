package main

import (
	"encoding/json"
	"strings"
	"testing"

	"quick_edits.com/native-search/open_editor"
	"quick_edits.com/native-search/search"
	"quick_edits.com/native-search/types"
)

func TestSorting(t *testing.T) {
	message := types.Message{
		Data: struct {
			types.PerformSearchData
			open_editor.OpenEditorData
		}{
			PerformSearchData: types.PerformSearchData{
				Folder:      "",
				BrowserURL:  "",
				Classes:     "bg-yellow",
				TextContent: "Test",
			},
		},
	}

	response, err := search.Search(message)

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
