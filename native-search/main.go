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

	editor_manager "quick_edits.com/native-search/editor"
	"quick_edits.com/native-search/open_editor"
	"quick_edits.com/native-search/save_changes"
	"quick_edits.com/native-search/search"
	native_messaging_setup "quick_edits.com/native-search/setup"
	"quick_edits.com/native-search/types"
)

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
			if len(args) != 4 {
				fmt.Fprintln(os.Stderr, "Usage: native-search register-editor <editor-name> <editor-path>")
				os.Exit(1)
			}
			err := editor_manager.ValidateAndRegisterEditor(args[2], args[3])
			if err != nil {
				fmt.Fprintln(os.Stderr, "Error registering editor:", err)
				os.Exit(1)
			}
			fmt.Println("Editor registered successfully")
			return
		default:
			fmt.Fprintln(os.Stderr, "Origin:", args[1])
		}
	}
	if len(args) > 2 && strings.HasPrefix(args[2], "--parent-window=") {
		parentWindow := strings.TrimPrefix(args[2], "--parent-window=")
		fmt.Fprintln(os.Stderr, "Parent window:", parentWindow)
	}

	log, err := NewLog(filepath.Join(executablePath, "native-messaging.log"))

	if err != nil {
		fmt.Fprintln(os.Stderr, "Error opening file:", err)
		return
	}

	defer log.Close()

	reader := bufio.NewReader(os.Stdin)

	for {
		fmt.Fprintln(os.Stderr, "Reading")
		// Read the length of the incoming message
		var length uint32
		err := binary.Read(reader, binary.LittleEndian, &length)
		if err != nil {
			if err == io.EOF {
				// Parent process has closed the pipe, exit gracefully
				fmt.Fprintln(os.Stderr, "Exiting")
				log.Log("Parent process closed connection, exiting...")
				return
			}
			fmt.Fprintln(os.Stderr, "Error reading length:", err)
			continue
		}

		// Ensure the message length does not exceed 1MB
		if length > 1024*1024 {
			fmt.Fprintln(os.Stderr, "Message length exceeds limits")
			log.Log("Error: Message length exceeds limits")
			// Discard the oversized message
			io.CopyN(io.Discard, reader, int64(length))
			continue
		}

		fmt.Fprintln(os.Stderr, "Here")
		// Read the message itself
		messageBytes := make([]byte, length)
		n, err := io.ReadFull(reader, messageBytes)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error reading message:", err)
			continue
		}
		if uint32(n) != length {
			fmt.Fprintln(os.Stderr, "Incomplete message read")
			continue
		}

		var message types.Message
		err = json.Unmarshal(messageBytes, &message)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error unmarshalling message:", err)
			continue
		}

		var response types.Response
		log.Log("Action: " + message.Action)
		log.Log("Data.Folder: " + message.Data.Folder)
		log.Log("Data.Classes: " + message.Data.Classes)
		log.Log("Data.TextContent: " + message.Data.TextContent)
		log.Log("Data.BrowserURL: " + message.Data.BrowserURL)
		log.Log("Data.CharNumber: " + fmt.Sprint(message.Data.CharNumber))
		log.Log("Data.Path: " + fmt.Sprint(message.Data.Path))
		if message.Action == "perform_search" {
			response = search.PerformSearch(message)
		} else if message.Action == "save_changes" {
			response = save_changes.SaveChanges(message)
		} else {
			match := search.Match{Path: message.Data.Path, LineNumber: message.Data.LineNumber, CharNumber: message.Data.CharNumber}
			response = open_editor.OpenEditor(match, message.Data.Editor, message.Data.EditorPath)
		}

		response.ID = message.ID

		// Marshal the response into JSON
		responseBytes, err := json.Marshal(response)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error marshalling response:", err)
			continue
		}

		// Write the length of the response
		length = uint32(len(responseBytes))
		err = binary.Write(os.Stdout, binary.LittleEndian, length)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error writing response length:", err)
			continue
		}

		// Write the response
		_, err = os.Stdout.Write(responseBytes)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error writing response:", err)
		}

		// Write the received message to the file
		log.Log(string(messageBytes) + "\n")
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error writing received message to file:", err)
		}
	}
}
