/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/

describe("WikiAST serialization unit tests", function () {
  var wiki = new $tw.Wiki();

  var cases = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/wikitext-serialize-test-spec]]");
  $tw.utils.each(cases, function (title) {
    wiki.addTiddler({
      title: title,
      text: wiki.getTiddlerText(title),
    });
    it("should serialize correctly for" + title, function () {
      var serialized = $tw.utils.serializeParseTree(wiki.parseTiddler(title).tree).trimEnd();
      expect(serialized).toBe(wiki.getTiddlerText(title).trimEnd());
    });
  });
});
