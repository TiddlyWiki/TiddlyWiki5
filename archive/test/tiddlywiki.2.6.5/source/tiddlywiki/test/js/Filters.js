/*global story, jQuery, document, module, test, same strictEqual store */
(function ($) {
    jQuery(document).ready(function () {
        module("Filters.js");

		/*
		 *	tiddler
		 */
		test("filterTiddlers: 'tiddler' should be one tiddlers named foo", function () {
			var tiddlers = store.filterTiddlers("foo");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "foo");
		});

		/*
		 *	[[tiddler]]
		 */
		test("filterTiddlers: '[[foo]]' should be one tiddlers named foo", function () {
			var tiddlers = store.filterTiddlers("[[foo]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "foo");
		});

		/*
		 *	[[tiddler]][[tiddler]]
		 */
		test("filterTiddlers: '[[foo]][[foo]]' should be two tiddlers named foo", function () {
			var tiddlers = store.filterTiddlers("[[foo]][[foo]]");
			strictEqual(tiddlers.length, 2, 'two tiddlers');
			strictEqual(tiddlers[0].title, "foo");
			strictEqual(tiddlers[1].title, "foo");
		});

		/*
		 *	[tag[value]]
		 */
		test("filterTiddlers: '[tag[testTag]]' should be three tiddlers tagged testTag", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[2].title, "testTiddler3");
		});

		test("filterTiddlers: '[tag[oneTag]]' should be one tiddlers tagged oneTag", function () {
			var tiddlers = store.filterTiddlers("[tag[oneTag]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
		});

		/*
		 *	combined tags
		 */
		test("filterTiddlers: '[tag[testTag]][tag[twoTag]]' should be three tiddlers tagged testTag and twoTag", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][tag[twoTag]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[2].title, "testTiddler3");
		});

		/*
		 *	[limit[n]]
		 */
		test("filterTiddlers: '[tag[testTag]][limit[1]]' should be one tiddlers tagged testTag limited with 1", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][limit[1]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
		});

		test("filterTiddlers: '[tag[testTag]][limit[2]]' should be two tiddlers tagged testTag limited with 2", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][limit[2]]");
			strictEqual(tiddlers.length, 2, 'two tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
		});

		test("filterTiddlers: '[tag[testTag]][limit[3]]' should be three tiddlers tagged testTag limited with 3", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][limit[3]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[2].title, "testTiddler3");
		});

		test("filterTiddlers: '[tag[testTag]][limit[50]]' should be three tiddlers tagged testTag limited with 50", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][limit[50]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[2].title, "testTiddler3");
		});

		/*
		 *	[field[value]]
		 */
		test("filterTiddlers: '[fieldvalue[two]]' should return the tiddler with a fieldvalue 'two'", function () {
			var tiddlers = store.filterTiddlers("[fieldvalue[two]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler2");
		});

		test("filterTiddlers: '[fieldvalue[three]]' should return the tiddler with a fieldvalue 'three'", function () {
			var tiddlers = store.filterTiddlers("[fieldvalue[three]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler3");
		});

		test("filterTiddlers: '[server.bag[foo]]' should return the tiddler with a fieldvalue 'three'", function () {
			var tiddlers = store.filterTiddlers("[server.bag[foo]]");
			strictEqual(tiddlers.length, 1, 'one tiddler');
			strictEqual(tiddlers[0].title, "testTiddler3");
		});

		test("filterTiddlers: '[field-thing[bar]]' should return the tiddler with a fieldvalue 'three'", function () {
			var tiddlers = store.filterTiddlers("[field-thing[bar]]");
			strictEqual(tiddlers.length, 1, 'one tiddler');
			strictEqual(tiddlers[0].title, "testTiddler3");
		});

		/*
		 *	[tag[value]][sort[+title]]
		 */
		test("filterTiddlers: '[tag[testTag]][sort[+title]]' should return three tiddlers tagged testTag, sorted", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][sort[+title]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[0].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[2].title, "testTiddler3");
		});

		/*
		 *	[tag[value]][sort[-title]]
		 */
		test("filterTiddlers: '[tag[testTag]][sort[-title]]' should return three tiddlers tagged testTag, reverse sorted", function () {
			var tiddlers = store.filterTiddlers("[tag[testTag]][sort[-title]]");
			strictEqual(tiddlers.length, 3, 'three tiddlers');
			strictEqual(tiddlers[2].title, "testTiddler1");
			strictEqual(tiddlers[1].title, "testTiddler2");
			strictEqual(tiddlers[0].title, "testTiddler3");
		});

		/*
		 *	errors ..
		 */
		test("filterTiddlers: '[[]]' should return no tiddlers", function () {
			var tiddlers = store.filterTiddlers("[[]]");
			strictEqual(tiddlers.length, 0, 'no tiddlers');
		});

		test("filterTiddlers: '[tag[]]' seems to return a tiddler called tag", function () {
			var tiddlers = store.filterTiddlers("[tag[]]");
			strictEqual(tiddlers.length, 1, 'one tiddlers');
			strictEqual(tiddlers[0].title, "tag");
		});

	});
}(jQuery));
