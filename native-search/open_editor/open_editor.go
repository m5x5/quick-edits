package open_editor

import (
	"fmt"
	"os/exec"
	"quick_edits.com/native-search/search"
	"quick_edits.com/native-search/types"
)

func OpenEditor(match search.Match, editor string) types.Response {
	if len(match.Path) == 0 {
		return types.Response{
			Message: "Path is empty.",
			Success: false,
		}
	}

	err := error(nil)

	if editor == "phpstorm" {
		err = launchPHPStorm(match)
	} else if editor == "zed" {
		err = launchZed(match)
	} else if editor == "vscode" {
		err = launchVSCode(match)
	} else if editor == "cursor" {
		err = launchCursor(match)
	} else {
		err = fmt.Errorf("Editor not supported: " + editor)
	}

	if err != nil {
		return types.Response{
			Message: err.Error(),
			Success: false,
		}
	}

	return types.Response{
		Message: "Successfully launched editor.",
		Success: true,
	}
}

func launchPHPStorm(match search.Match) error {
	return exec.Command(
		"/usr/local/bin/phpstorm",
		"--line", fmt.Sprintf("%d", match.LineNumber),
		"--column",
		fmt.Sprintf("%d", match.CharNumber-1),
		match.Path,
	).Run()
}

func launchVSCode(match search.Match) error {
	return exec.Command(
		"/usr/local/bin/code",
		"-g",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
	).Run()
}

func launchZed(match search.Match) error {
	return exec.Command(
		"/usr/local/bin/zed",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
	).Run()
}

func launchCursor(match search.Match) error {
	return exec.Command(
		"/usr/local/bin/cursor",
		"-g",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
		"-r",
	).Run()
}
