package save_changes

import (
	"fmt"
	"os"
	"strings"

	"quick_edits.com/native-search/types"
)

func SaveChanges(message types.Message) types.Response {
	fmt.Fprintln(os.Stderr, "SaveChanges called2")

	// Open the file with write permissions
	content, err := os.ReadFile(message.Data.Path)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error reading file:", err)
		return types.Response{Success: false, Message: fmt.Sprintf("Error reading file: %v", err)}
	}

	fmt.Fprintln(os.Stderr, "Content: ", string(content))

	// replace the text
	newContent := strings.Replace(string(content), message.Data.OriginalContent, message.Data.NewContent, -1)

	// Write the new content to the file
	err = os.WriteFile(message.Data.Path, []byte(newContent), 0644)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error writing to file:", err)
		return types.Response{Success: false, Message: fmt.Sprintf("Error writing to file: %v", err)}
	}
	fmt.Fprintln(os.Stderr, "File written successfully")

	return types.Response{Success: true, Message: ""}
}
