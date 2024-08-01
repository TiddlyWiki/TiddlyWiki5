/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/

describe('WikiAST serialization tests', function () {
  var wiki = new $tw.Wiki();

  wiki.addTiddler({ title: 'TiddlerOne', text: 'The quick brown fox' });
  it('should render tiddlers with no special markup as-is', function () {
    // `trimEnd` because when we handle `p` element when parsing block rules, we always add a newline. But original text that may not have a trailing newline, will still be recognized as a block.
    expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerOne').tree).trimEnd()).toBe(
      wiki.getTiddlerText('TiddlerOne')
    );
  });

  wiki.addTiddler({ title: 'TiddlerTwo', text: 'The rain in Spain\nfalls mainly on the plain' });
  it('should preserve single new lines', function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerTwo').tree).trimEnd()).toBe(
      wiki.getTiddlerText('TiddlerTwo')
    );
  });

  wiki.addTiddler({ title: 'TiddlerThree', text: 'The speed of sound\n\nThe light of speed' });
  it('should preserve double new lines to create paragraphs', function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerThree').tree).trimEnd()).toBe(
      wiki.getTiddlerText('TiddlerThree')
    );
  });

  wiki.addTiddler({
    title: 'TiddlerFour',
    text: 'Simple `JS` and complex\n\n---\n\n```js\nvar match = reEnd.exec(this.parser.source)\n```\nend',
  });
  it('should render inline code and block code', function () {
    expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerFour').tree).trimEnd()).toBe(
      wiki.getTiddlerText('TiddlerFour')
    );
  });

  // Test case for commentblock rule
  wiki.addTiddler({
    title: 'CommentBlockTest',
    text: '<!-- This is a comment -->\n\nSome text\n\n<!-- Another comment -->\n\nMore text',
  });
  it('should serialize block comments correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('CommentBlockTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('CommentBlockTest').trimEnd());
  });

  // Test case for commentinline rule
  wiki.addTiddler({
    title: 'CommentInlineTest',
    text: 'This is some text with an inline comment <!-- This is a comment --> and some more text.',
  });
  it('should serialize inline comments correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('CommentInlineTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('CommentInlineTest').trimEnd());
  });

  // Test case for conditional rule
  wiki.addTiddler({
    title: 'ConditionalTest',
    text: 'This is a <% if [{something}] %>Elephant<% elseif [{else}] %>Pelican<% else %>Crocodile<% endif %>',
  });
  it('should serialize conditional statements correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ConditionalTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ConditionalTest').trimEnd());
  });

  // Test case for dash rule
  wiki.addTiddler({
    title: 'DashTest',
    text: 'This is an en-dash: --\n\nThis is an em-dash: ---',
  });
  it('should serialize dashes correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('DashTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('DashTest').trimEnd());
  });

  // Test case for entity rule
  wiki.addTiddler({
    title: 'EntityTest',
    text: 'This is a copyright symbol: &copy;',
  });
  it('should serialize HTML entities correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('EntityTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('EntityTest').trimEnd());
  });

  // Test case for extlink rule
  wiki.addTiddler({
    title: 'ExtLinkTest',
    text: 'An external link: https://www.tiddlywiki.com/\n\nA suppressed external link: ~http://www.tiddlyspace.com/',
  });
  it('should serialize external links correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ExtLinkTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ExtLinkTest').trimEnd());
  });

  // Test case for filteredtranscludeblock rule
  wiki.addTiddler({
    title: 'FilteredTranscludeBlockTest',
    text: '{{{ [tag[docs]] }}}\n{{{ [tag[docs]] |tooltip}}}\n{{{ [tag[docs]] ||TemplateTitle}}}\n{{{ [tag[docs]] |tooltip||TemplateTitle}}}\n{{{ [tag[docs]] }}width:40;height:50;}.class.class',
  });
  it('should serialize block-level filtered transclusion correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('FilteredTranscludeBlockTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('FilteredTranscludeBlockTest').trimEnd());
  });

  // Test case for filteredtranscludeinline rule
  wiki.addTiddler({
    title: 'FilteredTranscludeInlineTest',
    text: '{{{ [tag[docs]] }}} {{{ [tag[docs]] |tooltip}}} {{{ [tag[docs]] ||TemplateTitle}}} {{{ [tag[docs]] |tooltip||TemplateTitle}}} {{{ [tag[docs]] }}width:40;height:50;}.class.class',
  });
  it('should serialize inline filtered transclusion correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('FilteredTranscludeInlineTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('FilteredTranscludeInlineTest').trimEnd());
  });

  // Test case based on the rule code's comment
  wiki.addTiddler({
    title: 'FunctionDefinition',
    text: '\\function name(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end\n\n\\procedure name(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end\n\n\\widget $mywidget(param:defaultvalue,param2:defaultvalue)\ndefinition text\n\\end',
  });
  it('should serialize function, procedure, and widget definitions correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('FunctionDefinition').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('FunctionDefinition').trimEnd());
  });

  // Test case for hardlinebreaks rule
  wiki.addTiddler({
    title: 'HardLineBreaksTest',
    text: '"""\nThis is some text\nThat is set like\nIt is a Poem\nWhen it is\nClearly\nNot\n"""\n',
  });
  it('should serialize hard line breaks correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('HardLineBreaksTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('HardLineBreaksTest').trimEnd());
  });

  // Test case for heading rule
  wiki.addTiddler({
    title: 'HeadingTest',
    text: '! Heading 1\n!! Heading 2\n!!! Heading 3\n!!!! Heading 4\n!!!!! Heading 5\n!!!!!! Heading 6',
  });
  it('should serialize headings correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('HeadingTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('HeadingTest').trimEnd());
  });

  // Test case for html rule
  wiki.addTiddler({
    title: 'HtmlTest',
    text: '<aside>\nThis is an HTML5 aside element\n</aside>\n\n<$slider target="MyTiddler">\nThis is a widget invocation\n</$slider>',
  });
  it('should serialize HTML elements and widgets correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('HtmlTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('HtmlTest').trimEnd());
  });

  // Test case for image rule
  wiki.addTiddler({
    title: 'ImageTest',
    text: '[img[https://tiddlywiki.com/fractalveg.jpg]]\n[img width=23 height=24 [https://tiddlywiki.com/fractalveg.jpg]]\n[img width={{!!width}} height={{!!height}} [https://tiddlywiki.com/fractalveg.jpg]]\n[img[Description of image|https://tiddlywiki.com/fractalveg.jpg]]\n[img[TiddlerTitle]]\n[img[Description of image|TiddlerTitle]]',
  });
  it('should serialize image tags correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ImageTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ImageTest').trimEnd());
  });

  // Test case for import rule
  wiki.addTiddler({
    title: 'ImportTest',
    text: '\\import [[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]',
  });
  it('should serialize import pragma correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ImportTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ImportTest').trimEnd());
  });

  // Test case for list rule
  wiki.addTiddler({
    title: 'ListTest',
    text: '* This is an unordered list\n* It has two items\n\n# This is a numbered list\n## With a subitem\n# And a third item\n\n; This is a term that is being defined\n: This is the definition of that term\n\n#** One\n#* Two\n#** Three\n#**** Four\n#**# Five\n#**## Six\n## Seven\n### Eight\n## Nine\n\n* List item one\n*.active List item two has the class `active`\n* List item three',
  });
  it('should serialize lists correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ListTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ListTest').trimEnd());
  });

  // Test case for macrocallblock rule
  wiki.addTiddler({
    title: 'MacroCallBlockTest',
    text: '<<name value value2>>',
  });
  it('should serialize block macro calls correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('MacroCallBlockTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('MacroCallBlockTest').trimEnd());
  });

  // Test case for macrocallinline rule
  wiki.addTiddler({
    title: 'MacroCallInlineTest',
    text: 'This is a macro call: <<name value value2>>',
  });
  it('should serialize inline macro calls correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('MacroCallInlineTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('MacroCallInlineTest').trimEnd());
  });

  // Test case for macrodef rule
  wiki.addTiddler({
    title: 'MacroDefTest',
    text: '\\define name(param:defaultvalue,param2:defaultvalue)\ndefinition text, including $param$ markers\n\\end',
  });
  it('should serialize macro definitions correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('MacroDefTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('MacroDefTest').trimEnd());
  });

  // Test case for parameters rule
  wiki.addTiddler({
    title: 'ParametersTest',
    text: '\\parameters(param:defaultvalue,param2:defaultvalue)',
  });
  it('should serialize parameter definitions correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ParametersTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ParametersTest').trimEnd());
  });

  // Test case for parsermode rule
  wiki.addTiddler({
    title: 'ParserModeTest',
    text: '\\parsermode block\n\\parsermode inline',
  });
  it('should serialize parser mode specifications correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('ParserModeTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('ParserModeTest').trimEnd());
  });

  // Test case for prettyextlink rule
  wiki.addTiddler({
    title: 'PrettyExtLinkTest',
    text: '[ext[https://tiddlywiki.com/fractalveg.jpg]]\n[ext[Tooltip|https://tiddlywiki.com/fractalveg.jpg]]',
  });
  it('should serialize pretty external links correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('PrettyExtLinkTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('PrettyExtLinkTest').trimEnd());
  });

  // Test case for prettylink rule
  wiki.addTiddler({
    title: 'PrettyLinkTest',
    text: '[[Introduction]]\n[[Link description|TiddlerTitle]]',
  });
  it('should serialize pretty links correctly', function () {
    var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler('PrettyLinkTest').tree).trimEnd();
    expect(serialized).toBe(wiki.getTiddlerText('PrettyLinkTest').trimEnd());
  });
});
