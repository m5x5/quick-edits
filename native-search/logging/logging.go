package logging

import (
	"fmt"
	"os"
	"strings"
	"time"
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

		// Read all lines
		content, err := os.ReadFile(log.FilePath)
		if err != nil {
			return
		}
		lines := strings.Split(string(content), "\n")

		// Keep only the most recent lines that fit within maxLogSize
		var newContent string
		for i := len(lines) - 1; i >= 0; i-- {
			line := lines[i] + "\n"
			if len(newContent)+len(line) > maxLogSize {
				break
			}
			newContent = line + newContent
		}

		// Reopen the file with truncate flag
		file, err := os.OpenFile(log.FilePath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return
		}
		log.File = file
		log.File.WriteString(newContent)
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

		// Read all lines
		content, err := os.ReadFile(filePath)
		if err != nil {
			return nil, err
		}
		lines := strings.Split(string(content), "\n")

		// Keep only the most recent lines that fit within maxLogSize
		var newContent string
		for i := len(lines) - 1; i >= 0; i-- {
			line := lines[i] + "\n"
			if len(newContent)+len(line) > maxLogSize {
				break
			}
			newContent = line + newContent
		}

		// Reopen with truncate flag
		file, err = os.OpenFile(filePath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return nil, err
		}

		// Write a message indicating the log was truncated
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		file.WriteString(fmt.Sprintf("[%s] Log file truncated as it exceeded 10KB\n", timestamp))

		file.WriteString(newContent)
	}

	return &Log{File: file, FilePath: filePath}, nil
}
