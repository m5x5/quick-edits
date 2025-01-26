package open_editor

import (
	"fmt"
	"os/exec"

	editor_manager "quick_edits.com/native-search/editor"
	"quick_edits.com/native-search/search"
	"quick_edits.com/native-search/types"
)

func OpenEditor(match search.Match, editor string, editorPath string) types.Response {
	if len(match.Path) == 0 {
		return types.Response{
			Message: "Path is empty.",
			Success: false,
		}
	}

	err := error(nil)

	launchEditor(match, editor)

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

func launchEditor(match search.Match, editor string) error {
	path, err := editor_manager.GetEditorPath(editor)

	if err != nil {
		return err
	}

	return exec.Command(
		path,
		"-g",
		fmt.Sprintf("%s:%d:%d", match.Path, match.LineNumber, match.CharNumber),
		"-r",
	).Run()
}
