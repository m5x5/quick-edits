package search

import (
	"testing"

	"quick_edits.com/native-search/parsers/lexers"
	"quick_edits.com/native-search/parsers/utils"
)

func TestParseHTML(t *testing.T) {
	check := lexers.ParseHTML(`<h1 className="bg-blue-500">     s   </h1>`)
	t.Errorf("Expected: \"%v\", got \"%v\"", 1, check)
}

func TestCompare(t *testing.T) {
	check := utils.CheckIfChangesTokenTypeOrder(`<h1 className="bg-blue-500">     s   </h1>`, `<h1 className="bg-blue-500 outline"> </h1>`)

	if check != true {
		t.Errorf("Expected: \"%v\", got \"%v\"", true, check)
	} else {
		t.Errorf("Success")
	}
}
