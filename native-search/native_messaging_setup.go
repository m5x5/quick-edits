package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func setupNativeMessaging() error {
	fmt.Sprintln("Starting setup of native-search.")
	println("During the setup we connect your Chrome Browser to this module so we can search the projects you configure.")

	extension_id := "bfcjldhcnibiijidbbeddopkpljkahja"
	if len(os.Args) > 2 {
		extension_id = os.Args[2]
	}
	executable, err := os.Executable()
	if err != nil {
		panic(err)

	}

	content := fmt.Sprintf(`{
	"name": "com.quick_edits.native_search",
	"description": "Quick Edits",
	"path": "%s",
	"type": "stdio",
	"allowed_origins": ["chrome-extension://%s/"]
}`, executable, extension_id)

	println(content)

	/// Define the file path
	filePath := "/Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json"

	// Ensure the directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		fmt.Printf("Failed to create directory: %v\n", err)
		return nil
	}

	// Write the content to the file
	err = os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		fmt.Printf("Failed to write file: %v\n", err)
		return nil
	}

	fmt.Println("File written successfully.")
	return nil
}
