/*global story, jQuery, document, module, test, same strictEqual store */
(function ($) {
	$(document).ready(function () {
		module("Macros.js", {});
	/*
	 * list
	 */
	test("list all", function () {
		var place = $("<div />")[0];
		var params = ["all"];
		var paramString = "all";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 4,
			"there are 3 tiddlers defined in testdata at time of writing these should all be listed. also a prompt");
		strictEqual($($("li", place)[0]).text(), config.macros.list.all.prompt, "make sure prompt in place.")
		strictEqual($("li .tiddlyLink", place).length, 3, "3 tiddly links should have been created");
	});

	test("list missing - nothing missing", function () {
		var place = $("<div />")[0];
		var params = ["missing"];
		var paramString = "missing";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 1,"no missing tiddlers only header");
		strictEqual($($("li", place)[0]).text(), config.macros.list.missing.prompt, "make sure prompt in place.")
		strictEqual($("li .tiddlyLink", place).length, 0, "no tiddly links should have been created");
	});

	test("NEW: list missing - test emptyMessage", function () {
		var place = $("<div />")[0];
		var params = ["missing"];
		var paramString = "missing emptyMessage:nothing";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 2,"no missing tiddlers only header and empty message");
		strictEqual($($("li", place)[1]).text(), "nothing", "check the empty message was printed");
	});

	test("list shadows", function () {
		var place = $("<div />")[0];
		var params = ["shadowed"];
		var paramString = "shadowed";
		var numShadows = 0;
		for(var i in config.shadowTiddlers) {
			numShadows += 1;
		}
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, numShadows + 1,"all shadows and the header");
		var items = $("li", place);
		strictEqual($("li .tiddlyLink", place).length, items.length - 1,
			"everything but header should be tiddlylink")
		strictEqual($(items[1]).text(), "AdvancedOptions",
			"the first in the list should be the shadow AdvancedOptions");
		strictEqual($(items[items.length - 1]).text(), "WindowTitle",
			"the first in the list should be the shadow WindowTitle");
	});
	
	test("list orphans", function () {
		var place = $("<div />")[0];
		var params = ["orphans"];
		var paramString = "orphans";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 3,"header plus 2 dummy tiddlers");
		var items = $("li", place);
		strictEqual($(items[1]).text(), "testTiddler1",
			"check alphabetical order");
		strictEqual($(items[2]).text(), "testTiddler3",
			"check alphabetical order");
	});

	test("list touched", function () {
		var place = $("<div />")[0];
		var params = ["touched"];
		var paramString = "touched";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 1,"just header");
	});

	test("list filter", function () {
		var place = $("<div />")[0];
		var params = ["filter", "[tag[twoTag]]"];
		var paramString = "filter [tag[twoTag]]";
		config.macros.list.handler(place,"list",params,null,paramString);
		var item = $("li .tiddlyLink", place);
		strictEqual(item.length, 1,"just the tiddler matched");
		strictEqual(item.text(), "testTiddler2")
	});
	
	test("NEW: list filter emptyMessage", function () {
		var place = $("<div />")[0];
		var params = ["filter", "[tag[badtag]]"];
		var paramString = "filter [tag[badtag]] emptyMessage:what";
		config.macros.list.handler(place,"list",params,null,paramString);
		var item = $("li", place);
		strictEqual(item.length, 1,"just the empty message");
		strictEqual(item.text(), "what")
	});
	
	test("dateFormat default", function() {
		strictEqual(config.macros.timeline.dateFormat, "DD MMM YYYY");
	});

	test("&lt;&lt;timeline&gt;&gt;", function () {
		var place = $("<div />")[0];
		var params = [];
		var paramString = "";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		var lists = $("ul", place);
		var items = $("li", place);
		strictEqual($(lists[0]).hasClass("timeline"), true, "timeline class set");
		strictEqual(lists.length, 2, "01/12/2010 (1&3), 01/12/1995 (2)");
		strictEqual(items.length, 5, "headings plus three tiddlers");
		var list1 = $("li", lists[0]);
		var heading1 = $(list1[0]);
		strictEqual(heading1.text(), "1 December 2010", "the most recent");
		strictEqual(heading1.hasClass("listTitle"), true, "has listTitle class set");
		var item1 = $("a", list1[1]);
		strictEqual(item1.hasClass("tiddlyLink tiddlyLinkExisting"), true, "a tiddly link created");
		strictEqual(item1.text(), "testTiddler3", "the timestamp is more recent so this appears at the top");
		strictEqual($("a", list1[2]).text(), "testTiddler1");
		
		strictEqual($("li:first", lists[1]).text(), "1 December 1995", "2nd heading");
	});

	test("&lt;&lt;timeline created&gt;&gt;", function () {
		var place = $("<div />")[0];
		var params = ["created"];
		var paramString = "created";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		var lists = $("ul", place);
		var items = $("li", place);
		strictEqual($(lists[0]).hasClass("timeline"), true, "timeline class set");
		strictEqual(lists.length, 3, "21/10/2009, 22/07/1994 and 19/10/2009");
		strictEqual(items.length, 6, "headings plus three tiddlers");
		var list1 = $("li", lists[0]);
		var heading1 = $(list1[0]);
		strictEqual(heading1.text(), "21 October 2009", "the most recent");
		strictEqual(heading1.hasClass("listTitle"), true, "has listTitle class set");
		var item1 = $("a", list1[1]);
		strictEqual(item1.hasClass("tiddlyLink tiddlyLinkExisting"), true, "a tiddly link created");
		strictEqual(item1.text(), "testTiddler1");
		strictEqual($("li:first", lists[1]).text(), "19 October 2009", "2nd heading");
		strictEqual($("li:first", lists[2]).text(), "22 July 1994", "3rd heading");
	});

	test("&lt;&lt;timeline '' 1&gt;&gt;", function () {
		var place = $("<div />")[0];
		var params = ["", "1"];
		var paramString = "'' 1";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		var lists = $("ul", place);
		var items = $("li", place);
		strictEqual($(lists[0]).hasClass("timeline"), true, "timeline class set");
		strictEqual(lists.length, 1, "the 2nd parameter defines a cutoff limitting the results to 1");
		strictEqual(items.length, 2, "heading plus the latest tiddler");
		var list1 = $("li", lists[0]);
		var heading1 = $(list1[0]);
		strictEqual(heading1.text(), "1 December 2010", "the most recent");
		strictEqual($("a", list1[1]).text(), "testTiddler3", "the timestamp is more recent so this appears at the top");
	});

	test("test date format &lt;&lt;timeline '' 1 '0hh:0mm' &gt;&gt;", function () {
		var place = $("<div />")[0];
		var params = [null, "1", "0hh:0mm"];
		var paramString = "'' 1 '0hh:0mm'";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		strictEqual($("ul .listTitle", place).text(), "09:40", "check dateFormat parameter has propagated");
		strictEqual($("ul .listLink", place).text(), "testTiddler3", "the timestamp is more recent so this appears at the top");
	});

	test("tagging macro (tagging nothing)", function() {
		var place = $("<div />")[0];
		var paramString = "";
		var tiddler = store.getTiddler("I tag nothing");
		config.macros.tagging.handler(place, null, [], null, paramString, tiddler);

		strictEqual($("ul", place).length, 1, "a list was created in the container");
		strictEqual($("ul li.listTitle", place).length, 1, "a list title was created");
		strictEqual($("ul li.listTitle", place).text(), config.macros.tagging.labelNotTag,
			"the text says this tiddler is tagging nothing");
	});

	test("tagging macro (tagging something)", function() {
		var place = $("<div />")[0];
		var paramString = "";
		var tiddler = new Tiddler("testTag");
		config.macros.tagging.handler(place, null, [], null, paramString, tiddler);

		strictEqual($("ul", place).length, 1, "a list was created in the container");
		strictEqual($("ul li.listTitle", place).length, 1, "a list title was created");
		strictEqual($("ul li.listTitle", place).text(), config.macros.tagging.label,
			"the text says this tiddler is tagging things");
		strictEqual($("ul li", place).length, 4,
			"3 tiddlers are tagged with testTag and the list title makes 4 items");
		strictEqual($("ul li a.tiddlyLink", place).length, 3,
			"3 tiddlers link to testTag");
	});

	//<<tagging sortBy:title>>;
	test("tagging macro (sortby parameter)", function() {
		var place = $("<div />")[0];
		var paramString = "sortBy:-title"
		var tiddler = new Tiddler("testTag");
		config.macros.tagging.handler(place, null, [], null, paramString, tiddler);

		strictEqual($("ul", place).length, 1, "a list was created in the container");
		strictEqual($("ul li a.tiddlyLink", place).length, 3,
			"3 tiddlers link to testTag");
		strictEqual($($("li a", place)[0]).attr("tiddlyLink"), "testTiddler3",
			"testing testTiddler3 is at the top of the list");
		strictEqual($($("li a", place)[2]).attr("tiddlyLink"), "testTiddler1",
			"testing testTiddler1 is at the bottom of the list");
	});

	test("tagging macro (tagging something title parameter passed)", function() {
		// note this test is identical to above but uses a parameter rather than the current tiddler.
		var place = $("<div />")[0];
		var paramString = "testTag";
		config.macros.tagging.handler(place, null, [], null, paramString, null);

		strictEqual($("ul", place).length, 1, "a list was created in the container");
		strictEqual($("ul li.listTitle", place).length, 1, "a list title was created");
		strictEqual($("ul li.listTitle", place).text(), config.macros.tagging.label,
			"the text says this tiddler is tagging things");
		strictEqual($("ul li", place).length, 4,
			"3 tiddlers are tagged with testTag and the list title makes 4 items");
		strictEqual($("ul li a.tiddlyLink", place).length, 3,
			"3 tiddlers link to testTag");
	});

	test("tagging macro (sep parameter)", function() {
		// note this test is identical to above but uses a parameter rather than the current tiddler.
		var place = $("<div />")[0];
		var paramString = "testTag sep:','";
		config.macros.tagging.handler(place, null, [], null, paramString, null);

		var text = $("ul", place).text();
		strictEqual(text, config.macros.tagging.label + "testTiddler1,testTiddler2,testTiddler3",
			"The sep parameter adds separators between each item");
	});

	module("Macros.js - additional scenarios", {
		setup: function() {
			var text = "[[Foo is a missing tiddler]] test";
			store.saveTiddler("MissingExample", "MissingExample", text);
			var templateText = "<<view title link>> hello world";
			store.saveTiddler("MyTemplate", "MyTemplate", templateText);
		},
		teardown: function() {
			store.removeTiddler("MissingExample");
			store.removeTiddler("MyTemplate");
		}
	});

	test("list missing - where something missing", function () {
		var place = $("<div />")[0];
		var params = ["missing"];
		var paramString = "missing";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 2, "prompt and one match");
		strictEqual($("li .tiddlyLink", place).text(), "Foo is a missing tiddler","check missing tiddler link created.");
	});

	test("NEW: missing with template parameter", function () {
		var place = $("<div />")[0];
		var params = ["missing"];
		var paramString = "missing template:MyTemplate";
		config.macros.list.handler(place,"list",params,null,paramString);
		var items = $("li", place);
		strictEqual(items.length, 2, "prompt and one match");
		strictEqual($(items[0]).text(), config.macros.list.missing.prompt, "prompt in place and immune from templating");
		strictEqual($(items[1]).text(),
			"Foo is a missing tiddler hello world","check missing tiddler link created.");
	});

	test("list touched", function () {
		var place = $("<div />")[0];
		var params = ["touched"];
		var paramString = "touched";
		config.macros.list.handler(place,"list",params,null,paramString);
		strictEqual($("li", place).length, 3, "just header and MissingExample and MyTemplate");
		var links = $("li .tiddlyLink", place);
		strictEqual($(links[0]).text(), "MissingExample", "should have noticed it was touched");
	});

	test("NEW: list filter with new template", function () {
		var place = $("<div />")[0];
		var params = ["filter", "[tag[testTag]][sort[-title]]"];
		var paramString = "filter [tag[testTag]][sort[-title]] template:MyTemplate";
		config.macros.list.handler(place,"list",params,null,paramString);
		var items = $("li", place);
		strictEqual(items.length, 3, "should match 3 tiddlers");
		strictEqual($(items[0]).text(), "testTiddler3 hello world", "the template has hello world in it.");
		strictEqual($(".tiddlyLink", items[0]).text(), "testTiddler3", "filter sorts by descending title");
	});

	module("Macros.js - timeline templating", {
		setup: function() {
			config.shadowTiddlers["TestTemplates"] = ["!Group",
				"Modified at <<view modified date '0hh'>>hrs on <<view modified date '0DD/0MM/YYYY'>>",
				"!Item", "hello world <<view title text>>!"].join("\n");
		},
		teardown: function() {
			delete config.shadowTiddlers["TestTemplates"];
		}
	});

	test("&lt;&lt;timeline created groupTemplate:TestTemplates##Group template:TestTemplates##Item&gt;&gt;", function () {
		var place = $("<div />")[0];
		var params = ["created", "groupTemplate:TestTemplates##Group", "template:TestTemplates##Item"];
		var paramString = "created groupTemplate:TestTemplates##Group template:TestTemplates##Item";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		var lists = $("ul", place);
		var items = $("li", place);
		strictEqual($(lists[0]).hasClass("timeline"), true, "timeline class set");
		strictEqual(lists.length, 3, "21/10/2009, 22/07/1994 and 19/10/2009");
		strictEqual(items.length, 6, "headings plus three tiddlers");
	});
	
	test("NEW: test templating &lt;&lt;timeline '' 1 groupTemplate:TestTemplates##Group template:TestTemplates##Item&gt;&gt; ",
		function () {
		var place = $("<div />")[0];
		var params = ["", "1", "groupTemplate:TestTemplates##Group", "template:TestTemplates##Item"];
		var paramString = "'' 1 groupTemplate:TestTemplates##Group template:TestTemplates##Item";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place, "timeline", params, null, paramString, tiddler);
		strictEqual($("ul .listTitle", place).text(), "Modified at 09hrs on 01/12/2010",
			"check group template was applied");
		strictEqual($("ul .listLink", place).text(), "hello world testTiddler3!", "the item template was applied");
		strictEqual($("ul .listLink a", place).length, 0, "no link created");
	});

	test("NEW: test group templating vs timestamp &lt;&lt;timeline '' 1 0hh:0mm groupTemplate:TestTemplates##Group&gt;&gt; ",
		function () {
		var place = $("<div />")[0];
		var params = ["", "1", "0hh:0mm", "groupTemplate:TestTemplates##Group"];
		var paramString = "'' 1 0hh:0mm groupTemplate:TestTemplates##Group template:TestTemplates##Item";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place, "timeline", params, null, paramString, tiddler);
		strictEqual($("ul .listTitle", place).text(), "Modified at 09hrs on 01/12/2010", "check group template was applied and timestamp ignored");
	});

	test("NEW: test filtering &lt;&lt;timeline filter:[tag[twoTag]]&gt;&gt; ",
		function () {
		var place = $("<div />")[0];
		var params = ["filter:[tag[twoTag]]"];
		var paramString = "filter:[tag[twoTag]]";
		var tiddler = store.getTiddler("testTiddler1");
		config.macros.timeline.handler(place,"timeline",params, null, paramString, tiddler);
		strictEqual($("ul", place).length, 1, "1 timeline created");
		strictEqual($("ul li", place).length, 2, "heading and tiddler");
		strictEqual($("ul .listLink a", place).text(), "testTiddler2", "only testTiddler2 has the tag twoTag");
	});
});
}(jQuery));
