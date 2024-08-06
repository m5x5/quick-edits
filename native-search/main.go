package main

import (
	"bufio"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type PerformSearchData struct {
	BrowserURL  string `json:"browserURL"`
	Folder      string `json:"folder"`
	Classes     string `json:"classes"`
	TextContent string `json:"textContent"`
}

type Message struct {
	ID     string `json:"id"`
	Action string `json:"action"`
	Data   struct {
		PerformSearchData
		OpenEditorData
	} `json:"data"`
}

type Response struct {
	ID      string `json:"id"`
	Message string `json:"message"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
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
		origin := args[1]
		fmt.Fprintln(os.Stderr, "Origin:", origin)
	}
	if len(args) > 2 && strings.HasPrefix(args[2], "--parent-window=") {
		parentWindow := strings.TrimPrefix(args[2], "--parent-window=")
		fmt.Fprintln(os.Stderr, "Parent window:", parentWindow)
	}

	log, err := NewLog(executablePath + "/native-messaging.log")

	if err != nil {
		fmt.Fprintln(os.Stderr, "Error opening file:", err)
		return
	}

	defer log.Close()

	reader := bufio.NewReader(os.Stdin)

	for {
		// Read the length of the incoming message
		var length uint32
		err := binary.Read(reader, binary.LittleEndian, &length)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error reading length:", err)
			continue
		}

		// Ensure the message length does not exceed 1MB
		if length > 1024*1024 {
			fmt.Fprintln(os.Stderr, "Message length exceeds limit")
			continue
		}

		// Read the message itself
		messageBytes := make([]byte, length)
		_, err = reader.Read(messageBytes)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error reading message:", err)
			continue
		}

		var message Message
		err = json.Unmarshal(messageBytes, &message)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Error unmarshalling message:", err)
			continue
		}

		var response Response
		log.Log("Action: " + message.Action)
		log.Log("Data.Folder: " + message.Data.Folder)
		log.Log("Data.Classes: " + message.Data.Classes)
		log.Log("Data.TextContent: " + message.Data.TextContent)
		log.Log("Data.BrowserURL: " + message.Data.BrowserURL)
		log.Log("Data.CharNumber: " + fmt.Sprint(message.Data.CharNumber))
		log.Log("Data.Path: " + fmt.Sprint(message.Data.Path))
		if message.Action == "perform_search" {
			response = PerformSearch(message)
		} else {
			match := Match{Path: message.Data.Path, LineNumber: message.Data.LineNumber, CharNumber: message.Data.CharNumber}
			response = OpenEditor(match, message.Data.Editor)
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

func log(msg string, file *os.File) {
	msg = msg + "\n"
	// Write the received message to the file
	_, err := file.Write([]byte(msg))
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error writing received message to file:", err)
	}
}
