package native_messaging_setup

import (
	"fmt"
	"os"
	"path/filepath"

	"quick_edits.com/native-search/logging"
)

func SetupNativeMessaging() error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}
	executablePath := filepath.Dir(executable)
	log, _ := logging.NewLog(filepath.Join(executablePath, "native-messaging.log"))
	defer log.Close()

	log.Log("Starting setup of native-search.")
	log.Log("During the setup we connect your Chrome Browser to this module so we can search the projects you configure.")

	extensionId := "mkgggehjablaljefihlkcleikcoinimk"
	if len(os.Args) > 2 {
		extensionId = os.Args[2]
	}

	content := fmt.Sprintf(`{
	"name": "com.quick_edits.native_search",
	"description": "Quick Edits",
	"path": "%s",
	"type": "stdio",
	"allowed_origins": ["chrome-extension://%s/"]
}`, executable, extensionId)

	log.Log(content)

	/// Define the file path
	filePath := "/Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json"

	// Ensure the directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Log(fmt.Sprintf("Failed to create directory: %v", err))
		return nil
	}

	// Write the content to the file
	err = os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		log.Log(fmt.Sprintf("Failed to write file: %v", err))
		return nil
	}

	log.Log("File written successfully.")
	return nil
}
