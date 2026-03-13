package editor_manager

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type EditorConfig struct {
	Name string   `json:"name"`
	Path string   `json:"path"`
	Args []string `json:"args"`
}

// knownPresets defines argument templates for common editors.
// Placeholders: {file} = file path, {line} = line number, {col} = column number
var knownPresets = map[string]struct {
	args        []string
	description string
}{
	"vscode":    {[]string{"-g", "{file}:{line}:{col}", "-r"}, "VS Code"},
	"code":      {[]string{"-g", "{file}:{line}:{col}", "-r"}, "VS Code"},
	"cursor":    {[]string{"-g", "{file}:{line}:{col}", "-r"}, "Cursor"},
	"windsurf":  {[]string{"-g", "{file}:{line}:{col}", "-r"}, "Windsurf"},
	"phpstorm":  {[]string{"--line", "{line}", "{file}"}, "PhpStorm"},
	"pstorm":    {[]string{"--line", "{line}", "{file}"}, "PhpStorm"},
	"webstorm":  {[]string{"--line", "{line}", "{file}"}, "WebStorm"},
	"wstorm":    {[]string{"--line", "{line}", "{file}"}, "WebStorm"},
	"goland":    {[]string{"--line", "{line}", "{file}"}, "GoLand"},
	"idea":      {[]string{"--line", "{line}", "{file}"}, "IntelliJ IDEA"},
	"rubymine":  {[]string{"--line", "{line}", "{file}"}, "RubyMine"},
	"clion":     {[]string{"--line", "{line}", "{file}"}, "CLion"},
	"datagrip":  {[]string{"--line", "{line}", "{file}"}, "DataGrip"},
	"rider":     {[]string{"--line", "{line}", "{file}"}, "Rider"},
	"vim":       {[]string{"+{line}", "{file}"}, "Vim"},
	"nvim":      {[]string{"+{line}", "{file}"}, "Neovim"},
	"neovim":    {[]string{"+{line}", "{file}"}, "Neovim"},
	"sublime":   {[]string{"{file}:{line}:{col}"}, "Sublime Text"},
	"subl":      {[]string{"{file}:{line}:{col}"}, "Sublime Text"},
	"emacs":     {[]string{fmt.Sprintf("+%s:%s", "{line}", "{col}"), "{file}"}, "Emacs"},
	"textmate":  {[]string{"--line", "{line}", "{file}"}, "TextMate"},
	"mate":      {[]string{"--line", "{line}", "{file}"}, "TextMate"},
	"zed":       {[]string{"{file}:{line}:{col}"}, "Zed"},
	"atom":      {[]string{"-g", "{file}:{line}:{col}"}, "Atom"},
}

// defaultArgs is the fallback when no preset matches (VS Code style)
var defaultArgs = []string{"-g", "{file}:{line}:{col}", "-r"}

func detectPreset(name string) ([]string, string) {
	lower := strings.ToLower(name)
	for key, preset := range knownPresets {
		if strings.Contains(lower, key) {
			return preset.args, preset.description
		}
	}
	return nil, ""
}

// ValidateAndRegisterEditor registers an editor with optional custom arg templates.
// If customArgs is empty, a preset is detected from the name, falling back to VS Code-style args.
func ValidateAndRegisterEditor(name, path string, customArgs []string) error {
	if name == "" {
		return errors.New("editor name cannot be empty")
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	info, err := os.Stat(absPath)
	if err != nil {
		return fmt.Errorf("cannot access path: %v", err)
	}

	if !info.Mode().IsRegular() || info.Mode()&0111 == 0 {
		return errors.New("provided path is not a valid executable")
	}

	cmd := exec.Command(absPath, "--version")
	if err := cmd.Start(); err != nil {
		return errors.New("provided path is not a valid executable")
	}
	cmd.Process.Kill()

	var args []string
	if len(customArgs) > 0 {
		args = customArgs
		fmt.Printf("Using custom args template: %s\n", strings.Join(args, " "))
	} else if presetArgs, presetName := detectPreset(name); presetArgs != nil {
		args = presetArgs
		fmt.Printf("Detected %s preset. Using args template: %s\n", presetName, strings.Join(args, " "))
	} else {
		args = defaultArgs
		fmt.Printf("No preset found for '%s'. Using default args: %s\n", name, strings.Join(args, " "))
		fmt.Println("To specify custom args, run: native-search register-editor <name> <path> <arg1> [arg2...]")
		fmt.Println("To see available presets, run: native-search list-presets")
	}

	if err := saveEditorConfig(EditorConfig{
		Name: name,
		Path: absPath,
		Args: args,
	}); err != nil {
		return err
	}

	fmt.Printf("Successfully registered '%s' at %s\n", name, absPath)
	return nil
}

// GetEditorConfig returns the full config for an editor, with args migration for old entries.
func GetEditorConfig(name string) (EditorConfig, error) {
	configs, err := loadEditorConfigs()
	if err != nil {
		return EditorConfig{}, fmt.Errorf("unable to load editor configurations: %v", err)
	}

	if len(configs) == 0 {
		return EditorConfig{}, fmt.Errorf("no editors are configured. To set up an editor, run:\n  native-search register-editor <name> <path>")
	}

	config, exists := configs[name]
	if !exists {
		names := make([]string, 0, len(configs))
		for editorName := range configs {
			names = append(names, editorName)
		}
		return EditorConfig{}, fmt.Errorf("editor '%s' is not configured. Available editors: %v\nTo configure it, run:\n  native-search register-editor %s <path>", name, names, name)
	}

	// Migrate old configs that were saved without args
	if len(config.Args) == 0 {
		if presetArgs, _ := detectPreset(name); presetArgs != nil {
			config.Args = presetArgs
		} else {
			config.Args = defaultArgs
		}
	}

	return config, nil
}

// GetEditorPath returns just the executable path for an editor.
func GetEditorPath(name string) (string, error) {
	config, err := GetEditorConfig(name)
	return config.Path, err
}

// ListEditors returns a formatted string of all configured editors.
func ListEditors() string {
	configs, err := loadEditorConfigs()
	if err != nil || len(configs) == 0 {
		return "No editors configured.\nRun: native-search register-editor <name> <path>"
	}
	var sb strings.Builder
	sb.WriteString("Configured editors:\n")
	for name, config := range configs {
		args := config.Args
		if len(args) == 0 {
			args = defaultArgs
		}
		sb.WriteString(fmt.Sprintf("  %-12s %s\n             args: %s\n", name, config.Path, strings.Join(args, " ")))
	}
	return sb.String()
}

// ListPresets returns a formatted string of all built-in editor presets.
func ListPresets() string {
	var sb strings.Builder
	sb.WriteString("Available editor presets (auto-detected by name):\n\n")
	shown := make(map[string]bool)
	for key, preset := range knownPresets {
		label := fmt.Sprintf("%s (%s)", preset.description, key)
		if !shown[label] {
			shown[label] = true
			sb.WriteString(fmt.Sprintf("  %-30s args: %s\n", label, strings.Join(preset.args, " ")))
		}
	}
	sb.WriteString("\nPlaceholders: {file} = file path, {line} = line number, {col} = column number\n")
	sb.WriteString("\nCustom example: native-search register-editor myeditor /path/to/editor --line {line} {file}\n")
	return sb.String()
}

func saveEditorConfig(config EditorConfig) error {
	configPath := getConfigPath()
	configDir := filepath.Dir(configPath)

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

	configs, err := loadEditorConfigs()
	if err != nil {
		configs = make(map[string]EditorConfig)
	}

	configs[config.Name] = config

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
