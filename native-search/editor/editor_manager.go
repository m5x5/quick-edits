package editor_manager

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type EditorConfig struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Command string `json:"command"`
}

func ValidateAndRegisterEditor(name, path string) error {
	if name == "" {
		return errors.New("editor name cannot be empty")
	}

	// Ensure the path is absolute
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	// Check if file exists and is executable
	info, err := os.Stat(absPath)
	if err != nil {
		return err
	}

	// Check if it's a regular file and has execute permission
	if info.Mode().IsRegular() && (info.Mode()&0111 != 0) {
		// Test if the binary is actually executable
		cmd := exec.Command(absPath, "--version")
		if err := cmd.Start(); err != nil {
			return errors.New("provided path is not a valid executable")
		}
		cmd.Process.Kill() // We don't need the full output

		// Store the editor configuration
		return saveEditorConfig(EditorConfig{
			Name: name,
			Path: absPath,
		})
	}

	return errors.New("provided path is not a valid executable")
}

func GetEditorPath(name string) (string, error) {
	configs, err := loadEditorConfigs()
	if err != nil {
		return "", fmt.Errorf("Unable to load editor configurations: %v", err)
	}

	if len(configs) == 0 {
		return "", fmt.Errorf("No editors are configured. To set up an editor, please run:\n'native-search register-editor <editor-name> <editor-path>'")
	}

	config, exists := configs[name]
	if !exists {
		names := make([]string, 0, len(configs))
		for editorName := range configs {
			names = append(names, editorName)
		}
		return "", fmt.Errorf("Editor '%s' is not configured. Available editors: %v\nTo configure a new editor, use:\n'native-search register-editor <editor-name> <editor-path>'", name, names)
	}

	return config.Path, nil
}

func saveEditorConfig(config EditorConfig) error {
	configPath := getConfigPath()
	configDir := filepath.Dir(configPath)

	// Check if directory exists
	if _, err := os.Stat(configDir); os.IsNotExist(err) {
		fmt.Printf("Configuration directory %s does not exist. Create it? (y/N): ", configDir)
		var response string
		fmt.Scanln(&response)

		if response != "y" && response != "Y" {
			return errors.New("configuration directory creation cancelled by user")
		}

		if err := os.MkdirAll(configDir, 0755); err != nil {
			return fmt.Errorf("failed to create configuration directory: %v", err)
		}
	}

	// Read existing configurations
	configs, err := loadEditorConfigs()
	if err != nil {
		configs = make(map[string]EditorConfig)
	}

	// Add or update the configuration
	configs[config.Name] = config

	// Save to file
	return os.WriteFile(configPath, []byte(formatConfigs(configs)), 0600)
}

func loadEditorConfigs() (map[string]EditorConfig, error) {
	configPath := getConfigPath()
	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return make(map[string]EditorConfig), nil
		}
		return nil, err
	}

	configs := make(map[string]EditorConfig)
	if err := json.Unmarshal(data, &configs); err != nil {
		return nil, err
	}

	return configs, nil
}

func formatConfigs(configs map[string]EditorConfig) string {
	data, err := json.MarshalIndent(configs, "", "  ")
	if err != nil {
		return "{}"
	}
	return string(data)
}

func getConfigPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	return filepath.Join(homeDir, ".quick-edits", "editors.json")
}
