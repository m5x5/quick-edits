package main

import (
	"fmt"
	"os/exec"
	"strings"
)

type OpenEditorData struct {
	Path       string `json:"path"`
	LineNumber int    `json:"lineNumber"`
	CharNumber int    `json:"charNumber"`
	Editor     string `json:"editor"`
}

func OpenEditor(match Match, editor string) Response {
	if len(match.Path) == 0 {
		return Response{
			Message: "Path is empty.",
			Success: false,
		}
	}

	err := error(nil)

	if editor == "phpstorm" {
		err = launchPHPStormIfPathIsAdequate(match)
	} else if editor == "zed" {
		err = launchZedIfPathIsAdequate(match)
	} else if editor == "vscode" {
		err = launchVSCodeIfPathIsAdequate(match)
	} else if editor == "cursor" {
		err = launchCursorIfPathIsAdequate(match)
	} else {
		err = fmt.Errorf("Editor not supported: " + editor)
	}

	if err != nil {
		return Response{
			Message: err.Error(),
			Success: false,
		}
	}

	return Response{
		Message: "Successfully launched editor.",
		Success: true,
	}
}

func isPathAdequate(path string) bool {
	extensions := []string{".html", ".js", ".tsx", ".ts"}
	is_path_adequate := false

	for i := 0; i < len(extensions); i++ {
		if strings.HasSuffix(path, extensions[i]) {
			is_path_adequate = true
		}
	}

	return is_path_adequate
}

func launchPHPStormIfPathIsAdequate(match Match) error {
	return exec.Command(
		"/usr/local/bin/phpstorm",
		"--line", fmt.Sprintf("%d", match.LineNumber),
		"--column",
		fmt.Sprintf("%d", match.CharNumber-1),
		match.Path,
	).Run()
}

func launchVSCodeIfPathIsAdequate(match Match) error {
	return exec.Command(
		"/usr/local/bin/code",
		"-g",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
	).Run()
}

func launchZedIfPathIsAdequate(match Match) error {
	return exec.Command(
		"/usr/local/bin/zed",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
	).Run()
}

func launchCursorIfPathIsAdequate(match Match) error {
	return exec.Command(
		"/usr/local/bin/cursor",
		"--line", fmt.Sprintf("%d", match.LineNumber),
		"--column",
		fmt.Sprintf("%d", match.CharNumber-1),
		match.Path,
	).Run()
}