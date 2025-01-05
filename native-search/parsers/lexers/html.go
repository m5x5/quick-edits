package lexers

type TokenType int

const (
	Data                      TokenType = iota // 0
	CharacterReference                         // 1
	TagOpen                                    // 2
	RCDATA                                     // 3
	RCDATALessThanSign                         // 4
	RAWTEXT                                    // 5
	RAWTEXTLessThanSign                        // 6
	ScriptData                                 // 7
	ScriptDataLessThanSign                     // 8
	PLAINTEXT                                  // 9
	EndTagOpen                                 // 10
	TagName                                    // 11
	BogusComment                               // 12
	BeforeAttributeName                        // 13
	RCDATAEndTagOpen                           // 14
	RCDATAEndTagName                           // 15
	SelfClosingStartTag                        // 16
	RAWTEXTEndTagOpen                          // 17
	RAWTEXTEndTagName                          // 18
	ScriptDataEndTagOpen                       // 19
	ScriptDataEndTagName                       // 20
	ScriptDataEscapeStart                      // 21
	ScriptDataEscapeStartDash                  // 22
	ScriptDataEscaped                          // 23
	ScriptDataEscapedDash
	ScriptDataEscapedDashDash
	ScriptDataEscapedLessThanSign
	ScriptDataEscapedEndTagOpen
	ScriptDataEscapedEndTagName
	ScriptDataDoubleEscapeStart
	ScriptDataDoubleEscaped
	ScriptDataDoubleEscapedDash
	ScriptDataDoubleEscapedDashDash
	ScriptDataDoubleEscapedLessThanSign
	ScriptDataDoubleEscapeEnd
	AttributeName
	AfterAttributeName
	BeforeAttributeValue
	AttributeValueDoubleQuoted
	AttributeValueSingleQuoted
	AttributeValueUnQuoted
	AfterAttributeValueQuoted
	MarkupDeclarationOpen
	CommentStart
	CommentStartDash
	Comment
	CommentLessThanSign
	CommentLessThanSignBang
	CommentLessThanSignBangDash
	CommentLessThanSignBangDashDash
	CommentEndDash
	CommentEnd
	CommentEndBang
	DOCTYPE
	BeforeDOCTYPEName
	DOCTYPEName
	AfterDOCTYPEName
	AfterDOCTYPEPublicKeyword
	BeforeDOCTYPEPublicIdentifier
	DOCTYPEPublicIdentifierDoubleQuoted
	DOCTYPEPublicIdentifierSingleQuoted
	AfterDOCTYPEPublicIdentifier
	BetweenDOCTYPEPublicAndSystemIdentifiers
	AfterDOCTYPESystemKeyword
	BeforeDOCTYPESystemIdentifier
	DOCTYPESytemIdentifierSingleQuoted
	DOCTYPESytemIdentifierDoubleQuoted
	AfterDOCTYPESystemIdentifier
	BogusDOCTYPE
	CDATASection
	CDATASectionBracket
	CDATASectionEnd
	NamedCharacterReference
	AmbiguousAmpersand
	NumericCharacterReference
	HexadecimalCharacterReferenceStart
	DecimalCharacterReferenceStart
	HexadecimalCharacterReference
	DecimalCharacterReference
	NumericCharacterReferenceEnd
)

func (me TokenType) String() string {
	return [...]string{
		"Data",
		"CharacterReference",
		"TagOpen",
		"RCDATA",
		"RCDATALessThanSign",
		"RAWTEXT",
		"RAWTEXTLessThanSign",
		"ScriptData",
		"ScriptDataLessThanSign",
		"PLAINTEXT",
		"EndTagOpen",
		"TagName",
		"BogusComment",
		"BeforeAttributeName",
		"RCDATAEndTagOpen",
		"RCDATAEndTagName",
		"SelfClosingStartTag",
		"RAWTEXTEndTagOpen",
		"RAWTEXTEndTagName",
		"ScriptDataEndTagOpen",
		"ScriptDataEndTagName",
		"ScriptDataEscapeStart",
		"ScriptDataEscapeStartDash",
		"ScriptDataEscaped",
		"ScriptDataEscapedDash",
		"ScriptDataEscapedDashDash",
		"ScriptDataEscapedLessThanSign",
		"ScriptDataEscapedEndTagOpen",
		"ScriptDataEscapedEndTagName",
		"ScriptDataDoubleEscapeStart",
		"ScriptDataDoubleEscaped",
		"ScriptDataDoubleEscapedDash",
		"ScriptDataDoubleEscapedDashDash",
		"ScriptDataDoubleEscapedLessThanSign",
		"ScriptDataDoubleEscapeEnd",
		"AttributeName",
		"AfterAttributeName",
		"BeforeAttributeValue",
		"AttributeValueDoubleQuoted",
		"AttributeValueSingleQuoted",
		"AttributeValueUnQuoted",
		"AfterAttributeValueQuoted",
	}[me]
}

type LexedTokenValue struct {
	TokenType TokenType
	Value     string
}

func ParseHTML(code string) []LexedTokenValue {

	lexed := [](LexedTokenValue){}
	state := Data
	temp := ""

	for _, r := range code {

		switch state {
		case Data:
			temp = string(r)
			if r == '<' {
				state = TagOpen
				break
			}
			if r == '{' {
				temp = ""
				lexed = append(lexed, LexedTokenValue{TokenType: Data, Value: string(r)})
				state = CharacterReference
				break
			}

			lexed = append(lexed, LexedTokenValue{TokenType: CharacterReference, Value: temp})
			break
		case TagOpen:
			if r == '/' {
				lexed = append(lexed, LexedTokenValue{TokenType: TagOpen, Value: temp})
				temp = string(r)
				state = EndTagOpen
			}

			temp = string(r)
			state = TagName
			break
		case TagName:
			if r == '>' {
				lexed = append(lexed, LexedTokenValue{TokenType: TagName, Value: temp})
				temp = string(r)
				state = Data
			}
			if r == ' ' {
				lexed = append(lexed, LexedTokenValue{TokenType: TagName, Value: temp})
				temp = string(r)
				state = BeforeAttributeName
			}

			temp += string(r)
			break
		case BeforeAttributeName:
			if r == '>' {
				lexed = append(lexed, LexedTokenValue{TokenType: BeforeAttributeName, Value: temp})
				break
			}
			if r == ' ' {
				temp += string(r)
				break
			}

			lexed = append(lexed, LexedTokenValue{TokenType: BeforeAttributeName, Value: temp})
			temp = string(r)
			state = AttributeName
			break
		case AttributeName:
			if r == '>' {
				lexed = append(lexed, LexedTokenValue{TokenType: AttributeName, Value: temp})
				temp = ""
				state = Data
				break
			}
			if r == '=' {
				lexed = append(lexed, LexedTokenValue{TokenType: AttributeName, Value: temp})
				temp = string(r)
				state = BeforeAttributeValue
				break
			}

			temp += string(r)
			break
		case EndTagOpen:
			lexed = append(lexed, LexedTokenValue{TokenType: EndTagOpen, Value: temp})
			temp = string(r)
			state = Data
			break
		case BeforeAttributeValue:
			if r == '"' {
				lexed = append(lexed, LexedTokenValue{TokenType: BeforeAttributeValue, Value: temp})
				temp = ""
				state = AttributeValueDoubleQuoted
				break
			}

			lexed = append(lexed, LexedTokenValue{TokenType: BeforeAttributeValue, Value: temp})
			temp = ""
			break
		case AttributeValueDoubleQuoted:
			if r == '"' {
				lexed = append(lexed, LexedTokenValue{TokenType: AttributeValueDoubleQuoted, Value: temp})
				temp = ""
				state = AfterAttributeValueQuoted
			}

			temp += string(r)
			break

		case AfterAttributeValueQuoted:
			if r == '>' {
				state = Data
			}
			if r == ' ' {
				temp = string(r)
				state = BeforeAttributeName
				break
			}

			lexed = append(lexed, LexedTokenValue{TokenType: AfterAttributeValueQuoted, Value: temp})
			temp = ""
			break
		default:
		}
	}

	return lexed
}
