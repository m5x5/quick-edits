package utils

import (
	"slices"

	"quick_edits.com/native-search/parsers/lexers"
)

func CheckIfChangesTokenTypeOrder(originalCode string, newCode string) bool {
	originalResult := lexers.ParseHTML(originalCode)
	newResult := lexers.ParseHTML(newCode)

	originalOrder := GetResultOrder(originalResult)
	newOrder := GetResultOrder(newResult)

	if !slices.Equal(originalOrder, newOrder) {
		return false
	} else {
		return true
	}
}

func GetResultOrder(rawTokenValue []lexers.LexedTokenValue) []lexers.TokenType {
	tokenTypeOrder := []lexers.TokenType{}
	for _, token := range rawTokenValue {
		tokenTypeOrder = append(tokenTypeOrder, token.TokenType)
	}
	slices.Sort(tokenTypeOrder)
	return slices.Compact(tokenTypeOrder)
}
