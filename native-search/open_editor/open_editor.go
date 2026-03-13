package open_editor

import (
	"fmt"
	"os/exec"
	"strings"

	editor_manager "quick_edits.com/native-search/editor"
	"quick_edits.com/native-search/types"
)

func OpenEditor(match types.Match, editor string, editorPath string) types.Response {
	if len(match.Path) == 0 {
		return types.Response{
			Message: "Path is empty.",
			Success: false,
		}
	}

	if err := launchEditor(match, editor); err != nil {
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

func launchEditor(match types.Match, editor string) error {
	config, err := editor_manager.GetEditorConfig(editor)
	if err != nil {
		return err
	}

	args := buildArgs(config.Args, match)
	return exec.Command(config.Path, args...).Run()
}

func buildArgs(template []string, match types.Match) []string {
	args := make([]string, len(template))
	for i, arg := range template {
		arg = strings.ReplaceAll(arg, "{file}", match.Path)
		arg = strings.ReplaceAll(arg, "{line}", fmt.Sprintf("%d", match.LineNumber))
		arg = strings.ReplaceAll(arg, "{col}", fmt.Sprintf("%d", match.CharNumber))
		args[i] = arg
	}
	return args
}
