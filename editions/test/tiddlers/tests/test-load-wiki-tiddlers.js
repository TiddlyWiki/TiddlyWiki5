/*\
title: test-load-wiki-tiddlers.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for loading wiki configuration supplied by an embedding application.

\*/
"use strict";

if($tw.node) {
	var fs = require("fs"),
		os = require("os"),
		path = require("path");

	describe("$tw.loadWikiTiddlers in-memory configuration",function() {
		it("loads a flat wiki using in-memory wikiInfo and filesInfo",function() {
			var wikiPath = fs.mkdtempSync(path.join(os.tmpdir(),"tw-memory-wiki-")),
				title = "InjectedFlatWikiNote",
				filepath = path.join(wikiPath,title + ".md"),
				oldTiddler = $tw.wiki.getTiddler(title),
				oldWikiPath = $tw.boot.wikiPath,
				oldWikiTiddlersPath = $tw.boot.wikiTiddlersPath,
				oldFiles = $tw.boot.files,
				oldOriginalPaths = $tw.wiki.getTiddler("$:/config/OriginalTiddlerPaths");
			fs.writeFileSync(filepath,"# In-memory configuration\n","utf8");
			try {
				$tw.boot.wikiPath = wikiPath;
				$tw.boot.files = Object.create(null);
				var wikiInfo = $tw.loadWikiTiddlers(wikiPath,{
					wikiInfo: {
						plugins: [],
						themes: [],
						languages: [],
						config: {
							"default-tiddler-location": "."
						}
					},
					filesInfo: {
						directories: [{
							path: ".",
							filesRegExp: "^.*\\.md$",
							isTiddlerFile: false,
							isEditableFile: true,
							fields: {
								title: {source: "basename"},
								type: "text/markdown"
							}
						}]
					}
				});
				expect(wikiInfo).toBeTruthy();
				expect($tw.boot.wikiTiddlersPath).toBe(wikiPath);
				expect($tw.wiki.getTiddlerText(title)).toBe("# In-memory configuration\n");
				expect($tw.wiki.getTiddler(title).fields.type).toBe("text/markdown");
				expect($tw.boot.files[title].filepath).toBe(filepath);
				expect(fs.existsSync(path.join(wikiPath,"tiddlywiki.info"))).toBe(false);
				expect(fs.existsSync(path.join(wikiPath,"tiddlywiki.files"))).toBe(false);
			} finally{
				if(oldTiddler) {
					$tw.wiki.addTiddler(oldTiddler);
				} else {
					$tw.wiki.deleteTiddler(title);
				}
				if(oldOriginalPaths) {
					$tw.wiki.addTiddler(oldOriginalPaths);
				} else {
					$tw.wiki.deleteTiddler("$:/config/OriginalTiddlerPaths");
				}
				$tw.boot.files = oldFiles;
				$tw.boot.wikiPath = oldWikiPath;
				$tw.boot.wikiTiddlersPath = oldWikiTiddlersPath;
				fs.rmSync(wikiPath,{recursive: true,force: true});
			}
		});
	});
}
