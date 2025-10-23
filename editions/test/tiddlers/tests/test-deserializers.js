/*\
title: test-deserializers.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests various core deserializers

\*/

	/* jslint node: true, browser: true */
	/* eslint-env node, browser, jasmine */
	/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
	/* global $tw, require */
	"use strict";
	
	describe("deserializer tests", function() {

		function executeTestCase(title,expectedOutput) {
			it("test case " + title, function() {
				var tiddler = $tw.wiki.getTiddler(title);
				expect($tw.wiki.deserializeTiddlers(tiddler.fields.type,tiddler.fields.text)).toEqual(expectedOutput);
			});
		}
	
		executeTestCase("dezerializer test data case 1",[ { text: "<!doctype html>\n", type: "text/html" } ]);

		executeTestCase("dezerializer test data case 2",[ { text: '<!doctype html>\n<html lang="en">\n<head>\n\t<meta charset="utf-8">\n\t<title>Test Data</title>\n</head>\n<body>\n</body>\n</html>\n', type: "text/html" } ]);

		executeTestCase("dezerializer test data case 3",[ { title: 'Hello "There"', text: "Abacus", type: "text/vnd.tiddlywiki" } ]);

		executeTestCase("dezerializer test data case 4",[ { title: 'Hello "There"', text: "Abacus", type: "text/vnd.tiddlywiki" }, { title: 'Hello "There"', text: "Calculator"}  ]);

		executeTestCase("dezerializer test data case 5",[ { title: 'Hello "There"', text: "Abacus", type: "text/vnd.tiddlywiki" }, { title: 'Hello "There"', text: "Calculator"} , { title: 'Hello "There"', text: "Protractor"}  ]);
		
	});
