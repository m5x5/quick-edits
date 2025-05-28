package search

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"quick_edits.com/native-search/types"
)

type dirStats struct {
	path      string
	startTime time.Time
	files     int
	timeSpent time.Duration
}

type FolderStats struct {
	TotalTime   time.Duration `json:"totalTime"`
	FileCount   int           `json:"fileCount"`
	SearchCount int           `json:"searchCount"`
}

var (
	folderStats     = make(map[string]FolderStats)
	folderStatsLock sync.Mutex
	statsFile       string
)

func init() {
	executable, err := os.Executable()
	if err != nil {
		return
	}
	executablePath := filepath.Dir(executable)
	statsFile = filepath.Join(executablePath, "folder-stats.json")
	loadFolderStats()
}

func loadFolderStats() {
	folderStatsLock.Lock()
	defer folderStatsLock.Unlock()

	data, err := os.ReadFile(statsFile)
	if err != nil {
		return
	}

	var stats map[string]FolderStats
	if err := json.Unmarshal(data, &stats); err != nil {
		return
	}
	folderStats = stats
}

func saveFolderStats() {
	folderStatsLock.Lock()
	defer folderStatsLock.Unlock()

	data, err := json.MarshalIndent(folderStats, "", "  ")
	if err != nil {
		return
	}

	os.WriteFile(statsFile, data, 0644)
}

func updateFolderStats(path string, duration time.Duration, fileCount int) {
	folderStatsLock.Lock()
	defer folderStatsLock.Unlock()

	stats := folderStats[path]
	stats.TotalTime += duration
	stats.FileCount = fileCount
	stats.SearchCount++
	folderStats[path] = stats

	// Save after every update
	go saveFolderStats()
}

func PerformSearch(message types.Message) types.Response {
	searchStart := time.Now()
	message.Log.Log("Starting search operation")

	// Set custom excluded directories if provided
	if message.Data.ExcludedDirectories != nil {
		message.Log.Log(fmt.Sprintf("Setting custom excluded directories: %v", message.Data.ExcludedDirectories))
		SetCustomExcludedDirectories(message.Data.ExcludedDirectories)
	} else {
		// Reset to empty if not provided
		SetCustomExcludedDirectories([]string{})
	}

	search, err := Search(message)

	if err != nil {
		message.Log.Log(fmt.Sprintf("Search failed after %v: %v", time.Since(searchStart), err))
		return types.Response{
			Message: err.Error(),
			Success: false,
		}
	}

	if isNextJSProject(message.Data.Folder) {
		sortStart := time.Now()
		nextJSHeuristicSorting(message.Data, search)
		message.Log.Log(fmt.Sprintf("NextJS sorting took: %v", time.Since(sortStart)))
	}

	message.Log.Log(fmt.Sprintf("Total search operation took: %v", time.Since(searchStart)))
	return types.Response{
		Success: true,
		Data:    search,
	}
}

func Search(message types.Message) ([]types.Match, error) {
	if len(message.Data.Classes) < 4 && len(message.Data.TextContent) < 7 {
		err := errors.New("keyword length should be at least 4 characters")
		return nil, err
	}

	var matches []types.Match
	startTime := time.Now()
	firstTwoLevelsDone := false
	filesChecked := 0
	matchesFound := 0

	// Track directory traversal times
	dirStack := []dirStats{}
	slowDirs := make(map[string]time.Duration)
	firstLevelDirs := make(map[string]time.Duration)
	firstLevelFileCounts := make(map[string]int)

	err := filepath.WalkDir(message.Data.Folder, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return fmt.Errorf("failed to WalkDir: %w", err)
		}

		if len(matches) >= 15 {
			return nil
		}

		// Check if we're still in first two levels
		relPath, _ := filepath.Rel(message.Data.Folder, path)
		level := strings.Count(relPath, string(os.PathSeparator))
		if level <= 1 {
			if d.IsDir() {
				if IsDirectoryExcluded(relPath) {
					message.Log.Log(fmt.Sprintf("Skipping excluded directory: %s", relPath))
					return filepath.SkipDir
				}
				// Start tracking new directory
				dirStack = append(dirStack, dirStats{
					path:      path,
					startTime: time.Now(),
				})
				return nil
			}

			// Update first level directory stats
			if len(dirStack) > 0 {
				dirStack[len(dirStack)-1].files++
			}
		}

		if !firstTwoLevelsDone && level > 1 {
			firstTwoLevelsDone = true
			// Record stats for first level directories
			for _, dir := range dirStack {
				timeSpent := time.Since(dir.startTime)
				firstLevelDirs[dir.path] = timeSpent
				firstLevelFileCounts[dir.path] = dir.files
				updateFolderStats(dir.path, timeSpent, dir.files)
			}
			message.Log.Log("First level directory statistics:")
			for path, duration := range firstLevelDirs {
				message.Log.Log(fmt.Sprintf("- %s: %v (%d files)", path, duration, firstLevelFileCounts[path]))
			}
		}

		if IsFileExcluded(d.Name()) {
			return nil
		}

		filesChecked++
		fileStart := time.Now()
		fileContent, err := fileContainsKeyword(path, message.Data.Classes, message.Data.TextContent)

		if err != nil {
			return err
		}

		if fileContent != "" {
			fileMatches := 0
			for lineNumber, line := range strings.Split(fileContent, "\n") {
				charNumber := SearchLine(line, message)

				if charNumber == -1 {
					continue
				}
				directMatch := WithContext(fileContent, lineNumber, message.Data.Classes, message.Data.TextContent)

				match := types.Match{
					Path:        path,
					LineNumber:  lineNumber + 1,
					CharNumber:  charNumber,
					Type:        "class",
					DirectMatch: directMatch,
				}
				matches = append(matches, match)
				fileMatches++
				matchesFound++
			}
			if fileMatches > 0 {
				message.Log.Log(fmt.Sprintf("Found %d matches in %s (took %v)", fileMatches, path, time.Since(fileStart)))
			}
		}

		// Update time spent in current directory
		if len(dirStack) > 0 {
			dirStack[len(dirStack)-1].timeSpent += time.Since(fileStart)
		}
		return nil
	})

	// Process directory timings
	for _, dir := range dirStack {
		timeSpent := time.Since(dir.startTime)
		slowDirs[dir.path] = timeSpent
	}

	// Sort directories by time spent
	type dirTime struct {
		path string
		time time.Duration
	}
	var sortedDirs []dirTime
	for path, duration := range slowDirs {
		sortedDirs = append(sortedDirs, dirTime{path, duration})
	}
	sort.Slice(sortedDirs, func(i, j int) bool {
		return sortedDirs[i].time > sortedDirs[j].time
	})

	// Log slow directories
	message.Log.Log("Slow directories:")
	for i, dir := range sortedDirs {
		if i < 3 || dir.time > 20*time.Millisecond {
			message.Log.Log(fmt.Sprintf("- %s: %v (%d files)", dir.path, dir.time, dirStack[len(dirStack)-1].files))
		}
	}

	message.Log.Log(fmt.Sprintf("Search stats: checked %d files, found %d matches, total time: %v",
		filesChecked, matchesFound, time.Since(startTime)))

	if err != nil {
		return nil, err
	}

	return matches, nil
}

func SearchLine(line string, message types.Message) int {
	if message.Data.Classes != "" && strings.Contains(line, message.Data.Classes) {
		charNumber := strings.Index(line, message.Data.Classes) + 1
		return charNumber
	}

	return -1
}

func fileContainsKeyword(path, keyword string, textContent string) (string, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		// We ignore errors here because it's not a big deal if we can't read a file
		// Last time it happened, it was a symlink, and we don't need to read
		// We'll need to change this handling if we want to support symlinks
		// Maybe via a "Follow Symlinks" setting?
		return "", nil
	}
	if fileInfo.IsDir() {
		return "", nil
	}
	rawContent, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	content := string(rawContent)

	if keyword != "" && strings.Contains(content, keyword) {
		return content, nil
	} else if textContent != "" && strings.Contains(content, textContent) {
		return content, nil
	} else {
		return "", nil
	}
}
