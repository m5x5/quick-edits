package main

import (
	"fmt"
	"os"
	"time"
)

type Log struct {
	File *os.File
}

func (log Log) Log(message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	_, err := log.File.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, message))
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

	// Close the file to avoid resource leaks

	return &Log{File: file}, nil
}
