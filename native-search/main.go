package main

import (
	"bufio"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	editor_manager "quick_edits.com/native-search/editor"
	"quick_edits.com/native-search/logging"
	"quick_edits.com/native-search/open_editor"
	"quick_edits.com/native-search/save_changes"
	"quick_edits.com/native-search/search"
	native_messaging_setup "quick_edits.com/native-search/setup"
	"quick_edits.com/native-search/types"
)

const maxLogSize = 10 * 1024 // 10KB

type Log struct {
	File     *os.File
	FilePath string
}

func (log Log) Log(message string) {
	// Check file size before writing
	fileInfo, err := log.File.Stat()
	if err == nil && fileInfo.Size() > maxLogSize {
		// Close the current file
		log.File.Close()

		// Reopen the file with truncate flag to clear it
		file, err := os.OpenFile(log.FilePath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return
		}
		log.File = file

		// Write a message indicating the log was truncated
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		log.File.WriteString(fmt.Sprintf("[%s] Log file truncated as it exceeded 10KB\n", timestamp))
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	_, err = log.File.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, message))
	if err != nil {
		return
	}
	err = log.File.Sync()
	if err != nil {
		return
	} // Flush changes to disk
}

func (log Log) Close() {
	err := log.File.Close()
	if err != nil {
		return
	}
}

func NewLog(filePath string) (*Log, error) {
	// Create the file if it doesn't exist
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	// Check if file size already exceeds limit
	fileInfo, err := file.Stat()
	if err == nil && fileInfo.Size() > maxLogSize {
		// Close the file
		file.Close()

		// Reopen with truncate flag
		file, err = os.OpenFile(filePath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return nil, err
		}

		// Write a message indicating the log was truncated
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		file.WriteString(fmt.Sprintf("[%s] Log file truncated as it exceeded 10KB\n", timestamp))
	}

	return &Log{File: file, FilePath: filePath}, nil
}

func main() {
	executable, err := os.Executable()
	if err != nil {
		panic(err)
	}
	executablePath := filepath.Dir(executable)

	// Handle command line arguments
	args := os.Args
	if len(args) > 1 {
		switch args[1] {
		case "setup":
			native_messaging_setup.SetupNativeMessaging()
			return
		case "register-editor":
			// Usage: native-search register-editor <name> <path> [arg1 arg2 ...]
			if len(args) < 4 {
				fmt.Fprintln(os.Stderr, "Usage: native-search register-editor <editor-name> <editor-path> [arg1 arg2 ...]")
				fmt.Fprintln(os.Stderr, "")
				fmt.Fprintln(os.Stderr, "Examples:")
				fmt.Fprintln(os.Stderr, "  native-search register-editor phpstorm /usr/local/bin/pstorm")
				fmt.Fprintln(os.Stderr, "  native-search register-editor vscode /usr/local/bin/code")
				fmt.Fprintln(os.Stderr, "  native-search register-editor myeditor /usr/bin/myeditor --line {line} {file}")
				fmt.Fprintln(os.Stderr, "")
				fmt.Fprintln(os.Stderr, "Run 'native-search list-presets' to see supported editors and their default args.")
				os.Exit(1)
			}
			var customArgs []string
			if len(args) > 4 {
				customArgs = args[4:]
			}
			if err := editor_manager.ValidateAndRegisterEditor(args[2], args[3], customArgs); err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
			return
		case "list-editors":
			fmt.Print(editor_manager.ListEditors())
			return
		case "list-presets":
			fmt.Print(editor_manager.ListPresets())
			return
		default:
			log, _ := logging.NewLog(filepath.Join(executablePath, "native-messaging.log"))
			log.Log(fmt.Sprintf("Origin: %s", args[1]))
			log.Close()
		}
	}
	if len(args) > 2 && strings.HasPrefix(args[2], "--parent-window=") {
		parentWindow := strings.TrimPrefix(args[2], "--parent-window=")
		log, _ := logging.NewLog(filepath.Join(executablePath, "native-messaging.log"))
		log.Log(fmt.Sprintf("Parent window: %s", parentWindow))
		log.Close()
	}

	log, err := logging.NewLog(filepath.Join(executablePath, "native-messaging.log"))

	if err != nil {
		log.Log(fmt.Sprintf("Error opening file: %v", err))
		return
	}

	defer log.Close()

	reader := bufio.NewReader(os.Stdin)

	for {
		// Read the length of the incoming message
		var length uint32
		err := binary.Read(reader, binary.LittleEndian, &length)
		if err != nil {
			if err == io.EOF {
				// Parent process has closed the pipe, exit gracefully
				log.Log("Parent process closed connection, exiting...")
				return
			}
			continue
		}

		// Ensure the message length does not exceed 1MB
		if length > 1024*1024 {
			log.Log("Error: Message length exceeds limits")
			// Discard the oversized message
			io.CopyN(io.Discard, reader, int64(length))
			continue
		}

		// Read the message itself
		messageBytes := make([]byte, length)
		n, err := io.ReadFull(reader, messageBytes)
		if err != nil {
			continue
		}
		if uint32(n) != length {
			continue
		}

		var message types.Message
		err = json.Unmarshal(messageBytes, &message)
		if err != nil {
			continue
		}

		// Set the log for the message
		message.Log = log

		var response types.Response
		log.Log("Action: " + message.Action)

		// Only log essential information, not the full content
		log.Log("Request ID: " + message.ID)

		if message.Action == "perform_search" {
			response = search.PerformSearch(message)
		} else if message.Action == "save_changes" {
			response = save_changes.SaveChanges(message)
		} else {
			match := types.Match{Path: message.Data.Path, LineNumber: message.Data.LineNumber, CharNumber: message.Data.CharNumber}
			response = open_editor.OpenEditor(match, message.Data.Editor, message.Data.EditorPath)
		}

		response.ID = message.ID

		// Marshal the response into JSON
		responseBytes, err := json.Marshal(response)
		if err != nil {
			continue
		}

		// Write the length of the response
		length = uint32(len(responseBytes))
		err = binary.Write(os.Stdout, binary.LittleEndian, length)
		if err != nil {
			continue
		}

		// Write the response
		_, err = os.Stdout.Write(responseBytes)
		if err != nil {
			continue
		}

		// Log response status but not the full content
		log.Log("Response: " + (map[bool]string{true: "Success", false: "Failure"})[response.Success])
	}
}
