/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/

describe("WikiAST serialization unit tests", function () {
  var wiki = new $tw.Wiki();

  wiki.addTiddler({
    title: "BoldEmphasisTest",
    text: "This is ''bold'' text",
  });
  it("should serialize bold emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("BoldEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("BoldEmphasisTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ItalicEmphasisTest",
    text: "This is //italic// text",
  });
  it("should serialize italic emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ItalicEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ItalicEmphasisTest").trimEnd());
  });

  wiki.addTiddler({
    title: "StrikethroughEmphasisTest",
    text: "This is ~~strikethrough~~ text",
  });
  it("should serialize strikethrough emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("StrikethroughEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("StrikethroughEmphasisTest").trimEnd());
  });

  wiki.addTiddler({
    title: "SubscriptEmphasisTest",
    text: "This is ,,subscript,, text",
  });
  it("should serialize subscript emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("SubscriptEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("SubscriptEmphasisTest").trimEnd());
  });

  wiki.addTiddler({
    title: "SuperscriptEmphasisTest",
    text: "This is ^^superscript^^ text",
  });
  it("should serialize superscript emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("SuperscriptEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("SuperscriptEmphasisTest").trimEnd());
  });

  wiki.addTiddler({
    title: "UnderscoreEmphasisTest",
    text: "This is __underscore__ text",
  });
  it("should serialize underscore emphasis correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("UnderscoreEmphasisTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("UnderscoreEmphasisTest").trimEnd());
  });

  wiki.addTiddler({ title: "SimpleTextTest", text: "The quick brown fox" });
  it("should render tiddlers with no special markup as-is", function () {
    // `trimEnd` because when we handle `p` element when parsing block rules, we always add a newline. But original text that may not have a trailing newline, will still be recognized as a block.
    expect($tw.utils.serializeParseTree(wiki.parseTiddler("SimpleTextTest").tree).trimEnd()).toBe(
      wiki.getTiddlerText("SimpleTextTest")
    );
  });

  wiki.addTiddler({ title: "SoftLineBreakTest", text: "The rain in Spain\nfalls mainly on the plain" });
  it("should preserve single new lines", function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler("SoftLineBreakTest").tree).trimEnd()).toBe(
      wiki.getTiddlerText("SoftLineBreakTest")
    );
  });

  wiki.addTiddler({ title: "BlockRule", text: "The speed of sound\n\nThe light of speed" });
  it("should preserve double new lines to create paragraphs", function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler("BlockRule").tree).trimEnd()).toBe(
      wiki.getTiddlerText("BlockRule")
    );
  });

  wiki.addTiddler({
    title: "CodeBlockTest",
    text: "Simple `JS` and complex\n\n---\n\n```js\nvar match = reEnd.exec(this.parser.source)\n```\nend",
  });
  it("should render inline code and block code", function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler("CodeBlockTest").tree).trimEnd()).toBe(
      wiki.getTiddlerText("CodeBlockTest")
    );
  });

  wiki.addTiddler({
    title: "CommentBlockTest",
    text: "<!-- This is a comment -->\n\nSome text\n\n<!-- Another comment -->\n\nMore text",
  });
  it("should serialize block comments correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("CommentBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("CommentBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "CommentInlineTest",
    text: "This is some text with an inline comment <!-- This is a comment --> and some more text.",
  });
  it("should serialize inline comments correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("CommentInlineTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("CommentInlineTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ConditionalTest",
    text: "This is a <% if [{something}] %>Elephant<% elseif [{else}] %>Pelican<% else %>Crocodile<% endif %>",
  });
  it("should serialize conditional statements correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ConditionalTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ConditionalTest").trimEnd());
  });

  wiki.addTiddler({
    title: "DashTest",
    text: "This is an en-dash: --\n\nThis is an em-dash: ---",
  });
  it("should serialize dashes correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("DashTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("DashTest").trimEnd());
  });

  wiki.addTiddler({
    title: "EntityTest",
    text: "This is a copyright symbol: &copy;",
  });
  it("should serialize HTML entities correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("EntityTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("EntityTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ExtLinkTest",
    text: "An external link: https://www.tiddlywiki.com/\n\nA suppressed external link: ~http://www.tiddlyspace.com/",
  });
  it("should serialize external links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ExtLinkTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ExtLinkTest").trimEnd());
  });

  wiki.addTiddler({
    title: "FilteredTranscludeBlockTest",
    text: "{{{ [tag[docs]] }}}\n{{{ [tag[docs]] |tooltip}}}\n{{{ [tag[docs]] ||TemplateTitle}}}\n{{{ [tag[docs]] |tooltip||TemplateTitle}}}\n{{{ [tag[docs]] }}width:40;height:50;}.class.class",
  });
  it("should serialize block-level filtered transclusion correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("FilteredTranscludeBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("FilteredTranscludeBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "FilteredTranscludeInlineTest",
    text: "{{{ [tag[docs]] }}} {{{ [tag[docs]] |tooltip}}} {{{ [tag[docs]] ||TemplateTitle}}} {{{ [tag[docs]] |tooltip||TemplateTitle}}} {{{ [tag[docs]] }}width:40;height:50;}.class.class",
  });
  it("should serialize inline filtered transclusion correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("FilteredTranscludeInlineTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("FilteredTranscludeInlineTest").trimEnd());
  });

  // Test case based on the rule code's comment
  wiki.addTiddler({
    title: "FunctionDefinition",
    text: "\\function name(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end\n\n\\procedure name(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end\n\n\\widget $mywidget(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end",
  });
  it("should serialize function, procedure, and widget definitions correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("FunctionDefinition").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("FunctionDefinition").trimEnd());
  });

  wiki.addTiddler({
    title: "HardLineBreaksTest",
    text: '"""\nThis is some text\nThat is set like\nIt is a Poem\nWhen it is\nClearly\nNot\n"""\n',
  });
  it("should serialize hard line breaks correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("HardLineBreaksTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("HardLineBreaksTest").trimEnd());
  });

  wiki.addTiddler({
    title: "HeadingTest",
    text: "! Heading 1\n!! Heading 2\n!!! Heading 3\n!!!! Heading 4\n!!!!! Heading 5\n!!!!!! Heading 6",
  });
  it("should serialize headings correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("HeadingTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("HeadingTest").trimEnd());
  });

  wiki.addTiddler({
    title: "HtmlTest",
    text: '<aside>\nThis is an HTML5 aside element\n</aside>\n\n<$slider target="MyTiddler">\nThis is a widget invocation\n</$slider>',
  });
  it("should serialize HTML elements and widgets correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("HtmlTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("HtmlTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ImageTest",
    text: '[img[https://tiddlywiki.com/fractalveg.jpg]]\n[img width="23" height="24" [https://tiddlywiki.com/fractalveg.jpg]]\n[img width={{!!width}} height={{!!height}} [https://tiddlywiki.com/fractalveg.jpg]]\n[img[Description of image|https://tiddlywiki.com/fractalveg.jpg]]\n[img[TiddlerTitle]]\n[img[Description of image|TiddlerTitle]]',
  });
  it("should serialize image tags correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ImageTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ImageTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ImportTest",
    text: "\\import [[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]\n\\import [[$:/core/ui/PageMacros]]",
  });
  it("should serialize import pragma correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ImportTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ImportTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ListTest",
    text: "* This is an unordered list\n* It has two items\n\n# This is a numbered list\n## With a subitem\n# And a third item\n\n; This is a term that is being defined\n: This is the definition of that term\n\n#** One\n#* Two\n#** Three\n#**** Four\n#**# Five\n#**## Six\n## Seven\n### Eight\n## Nine\n\n* List item one\n*.active List item two has the class `active`\n* List item three",
  });
  it("should serialize lists correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ListTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ListTest").trimEnd());
  });

  wiki.addTiddler({
    title: "MacroCallBlockTest",
    text: '<<name "value" "value2">>\n\n<<.def "macro calls">>',
  });
  it("should serialize block macro calls correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("MacroCallBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("MacroCallBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "MacroCallInlineTest",
    text: 'These are macro calls in a line: <<name "value" "value2">> and <<.def "macro calls">>',
  });
  it("should serialize inline macro calls correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("MacroCallInlineTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("MacroCallInlineTest").trimEnd());
  });

  wiki.addTiddler({
    title: "MacroDefTest",
    text: "\\define name(param:defaultvalue,param2:defaultvalue)\ndefinition text, including $param$ markers\n\\end",
  });
  it("should serialize macro definitions correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("MacroDefTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("MacroDefTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ParametersTest",
    text: "\\parameters(param:defaultvalue,param2:defaultvalue)",
  });
  it("should serialize parameter definitions correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ParametersTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ParametersTest").trimEnd());
  });

  wiki.addTiddler({
    title: "ParserModeTest",
    text: "\\parsermode block\n\n\\parsermode inline\n\nTest.",
  });
  it("should serialize parser mode specifications correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("ParserModeTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("ParserModeTest").trimEnd());
  });

  wiki.addTiddler({
    title: "PrettyExtLinkTest",
    text: "[ext[https://tiddlywiki.com/fractalveg.jpg]]\n[ext[Tooltip|https://tiddlywiki.com/fractalveg.jpg]]",
  });
  it("should serialize pretty external links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("PrettyExtLinkTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("PrettyExtLinkTest").trimEnd());
  });

  wiki.addTiddler({
    title: "PrettyLinkTest",
    text: "[[Introduction]]\n[[Link description|TiddlerTitle]]",
  });
  it("should serialize pretty links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("PrettyLinkTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("PrettyLinkTest").trimEnd());
  });

  wiki.addTiddler({
    title: "QuoteBlockTest",
    text: "<<<tc-quote\nQuote text\n<<<",
  });
  it("should serialize quote blocks correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("QuoteBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("QuoteBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "RulesPragmaTest",
    text: "\\rules except ruleone ruletwo rulethree\n\\rules only ruleone ruletwo rulethree",
  });
  it("should serialize rules pragma correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("RulesPragmaTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("RulesPragmaTest").trimEnd());
  });

  wiki.addTiddler({
    title: "StyleBlockTest",
    text: "@@.myClass\n@@background-color:red;\nThis paragraph will have the CSS class `myClass`.\n\n* The `<ul>` around this list will also have the class `myClass`\n* List item 2\n@@\n\n@@font-size:1.5em;\n@@.coloured-text\n@@.coloured-bg\n* Block content\n* With custom style and classes\n@@",
  });
  wiki.addTiddler({
    title: "StyleBlockTest2",
    text: "@@.myFirstClass.mySecondClass\n@@width:100px;.myThirdClass\nThis is a paragraph\n@@\n\n@@background-color:lightcyan;\n* Item one\n* Item two\n@@",
  });
  it("should serialize style blocks correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("StyleBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("StyleBlockTest").trimEnd());
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("StyleBlockTest2").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("StyleBlockTest2").trimEnd());
  });
  return;

  wiki.addTiddler({
    title: "StyleInlineTest",
    text: "@@.myClass This is some text with a class@@\n@@background-color:red;This is some text with a background colour@@\n@@width:100px;.myClass This is some text with a class and a width@@",
  });
  it("should serialize style inlines correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("StyleInlineTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("StyleInlineTest").trimEnd());
  });

  wiki.addTiddler({
    title: "SysLinkTest",
    text: "$:TiddlerTitle\n~$:TiddlerTitle",
  });
  it("should serialize system links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("SysLinkTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("SysLinkTest").trimEnd());
  });

  wiki.addTiddler({
    title: "TableTest",
    text: "|! |!Alpha |!Beta |!Gamma |!Delta |\n|!One | | | | |\n|!Two | | | | |\n|!Three | | | | |",
  });
  it("should serialize tables correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("TableTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("TableTest").trimEnd());
  });

  wiki.addTiddler({
    title: "TranscludeBlockTest",
    text: "{{MyTiddler}}\n{{MyTiddler||TemplateTitle}}",
  });
  it("should serialize block-level transclusions correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("TranscludeBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("TranscludeBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "TranscludeInlineTest",
    text: "{{MyTiddler}}\n{{MyTiddler||TemplateTitle}}",
  });
  it("should serialize inline-level transclusions correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("TranscludeInlineTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("TranscludeInlineTest").trimEnd());
  });

  wiki.addTiddler({
    title: "TypedBlockTest",
    text: '$$$.js\nThis will be rendered as JavaScript\n$$$\n$$$.svg\n<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">\n  <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />\n</svg>\n$$$\n$$$text/vnd.tiddlywiki>text/html\nThis will be rendered as an //HTML representation// of WikiText\n$$$',
  });
  it("should serialize typed blocks correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("TypedBlockTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("TypedBlockTest").trimEnd());
  });

  wiki.addTiddler({
    title: "WikiLinkTest",
    text: "AWikiLink\nAnotherLink\n~SuppressedLink",
  });
  it("should serialize wiki links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("WikiLinkTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("WikiLinkTest").trimEnd());
  });

  wiki.addTiddler({
    title: "WikiLinkPrefixTest",
    text: "~SuppressedLink",
  });
  it("should serialize suppressed wiki links correctly", function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler("WikiLinkPrefixTest").tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText("WikiLinkPrefixTest").trimEnd());
  });
});
