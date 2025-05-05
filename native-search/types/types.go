package types

import (
	"quick_edits.com/native-search/logging"
)

type Match struct {
	Path        string `json:"path"`
	LineNumber  int    `json:"lineNumber"`
	CharNumber  int    `json:"charNumber"`
	Type        string `json:"type"`
	DirectMatch bool   `json:"isDirectMatch"`
}

type OpenEditorData struct {
	Path       string `json:"path"`
	LineNumber int    `json:"lineNumber"`
	CharNumber int    `json:"charNumber"`
	Editor     string `json:"editor"`
	EditorPath string `json:"editorPath"`
}

type PerformSearchData struct {
	BrowserURL          string   `json:"browserURL"`
	Folder              string   `json:"folder"`
	Classes             string   `json:"classes"`
	TextContent         string   `json:"textContent"`
	ExcludedDirectories []string `json:"excludedDirectories"`
}

type SaveChangesData struct {
	OriginalContent string `json:"originalContent"`
	NewContent      string `json:"newContent"`
}

type Response struct {
	ID      string `json:"id"`
	Message string `json:"message"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
}

type Message struct {
	ID     string       `json:"id"`
	Action string       `json:"action"`
	Log    *logging.Log `json:"-"`
	Data   struct {
		PerformSearchData
		OpenEditorData
		SaveChangesData
	} `json:"data"`
}
