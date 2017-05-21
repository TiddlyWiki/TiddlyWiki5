/*\
title: test-field-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the html output of the fields widget. Was needed because of https://github.com/Jermolene/TiddlyWiki5/issues/2517
Field values containing 2 or more $-signs didn't survive a "save - reload" round trip.

Additional tests needed:
 - $$, $&, $`, $', $1

see fields:
 - a, g, h, i, j,

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("fields-widget tests for save-reload roundtrip", function() {

	var fields = {
					a: "asdf",
					b: "$",
					c: "$$",
					cc: "$$$",
					ccc: "$$$$",
					d: "$param$",
					e: "$$param$$",
					f: "$$param$$$",
					g: "$&",
					h: "$`",
					i: "$'",
					j: "$1"
	};

	// Prepare the ontent tiddler
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "TiddlerOne", text: '--'}, fields));

	// Use different templates
	$tw.wiki.addTiddler({title: "output-a", text: '<$list filter=TiddlerOne template="$:/core/templates/html-div-tiddler"/>'});
	$tw.wiki.addTiddler({title: "output-b", text: '<$list filter=TiddlerOne template="$:/core/templates/css-tiddler"/>'});
	$tw.wiki.addTiddler({title: "output-c", text: '<$list filter=TiddlerOne template="$:/core/templates/javascript-tiddler"/>'});
	$tw.wiki.addTiddler({title: "output-d", text: '<$list filter=TiddlerOne template="$:/core/templates/module-tiddler"/>'});
	$tw.wiki.addTiddler({title: "output-e", text: '<$list filter=TiddlerOne template="$:/core/templates/tid-tiddler"/>'});
	$tw.wiki.addTiddler({title: "output-f", text: '<$list filter=TiddlerOne template="$:/core/templates/tiddler-metadata"/>'});


	it("should render field values using: $:/core/templates/html-div-tiddler", function() {
		expect($tw.wiki.renderTiddler("text/plain-formatted","output-a")).toBe('\n\n<div a="asdf" b="$" c="$$" cc="$$$" ccc="$$$$" d="$param$" e="$$param$$" f="$$param$$$" g="$&amp;" h="$`" i="$\'" j="$1" title="TiddlerOne"><pre>--</pre></div>\n\n');
	});

	it("should render field values using: $:/core/templates/css-tiddler", function() {
		expect($tw.wiki.renderTiddler("text/plain-formatted","output-b")).toBe('\n\n<style data-tiddler-a="asdf" data-tiddler-b="$" data-tiddler-c="$$" data-tiddler-cc="$$$" data-tiddler-ccc="$$$$" data-tiddler-d="$param$" data-tiddler-e="$$param$$" data-tiddler-f="$$param$$$" data-tiddler-g="$&amp;" data-tiddler-h="$`" data-tiddler-i="$\'" data-tiddler-j="$1" data-tiddler-title="TiddlerOne" type="text/css">--</style>\n\n');
	});

	it("should render field values using: $:/core/templates/javascript-tiddler", function() {
		expect($tw.wiki.renderTiddler("text/plain-formatted","output-c")).toBe('\n\n<script data-tiddler-a="asdf" data-tiddler-b="$" data-tiddler-c="$$" data-tiddler-cc="$$$" data-tiddler-ccc="$$$$" data-tiddler-d="$param$" data-tiddler-e="$$param$$" data-tiddler-f="$$param$$$" data-tiddler-g="$&amp;" data-tiddler-h="$`" data-tiddler-i="$\'" data-tiddler-j="$1" data-tiddler-title="TiddlerOne" type="text/javascript">--</script>\n\n');
	});

	it("should render field values using: $:/core/templates/module-tiddler", function() {
		expect($tw.wiki.renderTiddler("text/plain-formatted","output-d")).toBe('\n\n<script data-tiddler-a="asdf" data-tiddler-b="$" data-tiddler-c="$$" data-tiddler-cc="$$$" data-tiddler-ccc="$$$$" data-tiddler-d="$param$" data-tiddler-e="$$param$$" data-tiddler-f="$$param$$$" data-tiddler-g="$&amp;" data-tiddler-h="$`" data-tiddler-i="$\'" data-tiddler-j="$1" data-tiddler-title="TiddlerOne" type="text/javascript" data-module="yes">$tw.modules.define("TiddlerOne","",function(module,exports,require) {--});</script>\n\n');
	});

	// render as text/plain
	it("should render field values using: $:/core/templates/tid-tiddler", function() {
		expect($tw.wiki.renderTiddler("text/plain","output-e")).toBe('a: asdf\nb: $\nc: $$\ncc: $$$\nccc: $$$$\nd: $param$\ne: $$param$$\nf: $$param$$$\ng: $&\nh: $`\ni: $\'\nj: $1\ntitle: TiddlerOne\n\n--');
	});


	it("should render field values using: $:/core/templates/tiddler-metadata", function() {
		expect($tw.wiki.renderTiddler("text/plain","output-f")).toBe('a: asdf\nb: $\nc: $$\ncc: $$$\nccc: $$$$\nd: $param$\ne: $$param$$\nf: $$param$$$\ng: $&\nh: $`\ni: $\'\nj: $1\ntitle: TiddlerOne\n');
	});



	//TODO I don't know, how to use this template !!!
	//pending() function doesn't work. -> update jasmine!!! 1.3.1 ... new is 2.4.1

	$tw.wiki.addTiddler({title: "output-g", text: '<$list filter=TiddlerOne template="$:/core/templates/html-div-tiddler-remove-prefix"/>'});

	it("should render field values using: $:/core/templates/html-div-tiddler-remove-prefix", function() {
		expect($tw.wiki.renderTiddler("text/html","output-g")).toBe('');
		// pending(); <--- jasmine outdated???
	});

});

})();
