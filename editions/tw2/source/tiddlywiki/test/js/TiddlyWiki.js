jQuery(document).ready(function(){
	var _numTiddlers;
	var module_tiddlers = [{title: "tvalue1", tags: ["twtesthello"], fields: {xyz:"bar"}},
		{title: "tvalue2", tags: []},
		{title: "tvalue3", tags: ["twtesthello", "goodbye"], fields: {xyz: "bar"}},
		{title: "tvalue4", tags: ["what"], fields:{xyz:"bar"}},
		{title: "tvalue5", tags: [], fields:{xyz:"barz"}}
	];
	module("TiddlyWiki.js", {
		setup: function() {
			for(var i = 0; i < module_tiddlers.length; i++) {
				var tid = module_tiddlers[i];
				store.saveTiddler(tid.title, tid.title, tid.text, null, null, tid.tags, tid.fields);
			}
			_numTiddlers = store.getTiddlers().length;
		},
		teardown: function() {
			_numTiddlers = false;
			for(var i = 0; i < module_tiddlers.length; i++) {
				var tid = module_tiddlers[i];
				store.removeTiddler(tid.title);
			}
		}
	});

	test("saveTiddler() fields", function() {

		var store = new TiddlyWiki();

		var title = "tiddler";
		var text = "text";
		var fields = {a:"aa", b:"bb"};
		config.defaultCustomFields = {};
		var tiddler = store.saveTiddler(title, title, text, null, null, null, fields);
		tiddler.clearChangeCount();
		actual = tiddler.fields;
		expected = {a:"aa", b:"bb"};
		same(actual,expected,'fields should be unchanged when defaultCustomFields empty');

		config.defaultCustomFields = {dcf1:"d1", dcf2:"d2"};
		tiddler = store.saveTiddler(title, title, text, null, null, null, fields);
		tiddler.clearChangeCount();
		actual = tiddler.fields;
		expected = {a:"aa", b:"bb", dcf1:"d1", dcf2:"d2"};
		same(actual,expected,'fields should be merged with defaultCustomFields');

		config.defaultCustomFields = {a:"xx", b:"yy", dcf1:"d1", dcf2:"d2"};
		tiddler = store.saveTiddler(title, title, text, null, null, null, fields);
		tiddler.clearChangeCount();
		actual = tiddler.fields;
		expected = {a:"aa", b:"bb", dcf1:"d1", dcf2:"d2"};
		same(actual,expected,'defaultCustomFields should not overwrite fields');
	});

	test("Slices: calcAllSlices()", function() {

		var store = new TiddlyWiki();

		var actual = typeof store.calcAllSlices();
		var expected = "object";
		same(actual,expected,'should return an object when not passed any arguments');

		actual = typeof store.calcAllSlices("");
		expected = "object";
		same(actual,expected,'should return an object when passed an empty string');

		actual = typeof store.calcAllSlices("MissingTiddler");
		expected = "object";
		same(actual,expected,'should return an object when pointed to a non-existing tiddler');

		var title = "tiddler";
		var text = "foo: bar";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "foo": "bar" };
		same(actual,expected,'should return an existing slice (colon notation) as a label/value pair');

		title = "tiddler";
		text = "foo: bar\nlorem: ipsum";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar", lorem: "ipsum" };
		same(actual,expected,'should return existing slices (colon notation) as label/value pairs');

		title = "tiddler";
		text = "|foo|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should return an existing slice (table notation) as a label/value pair');

		title = "tiddler";
		text = "|foo|bar|\n|lorem|ipsum|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar", lorem: "ipsum" };
		same(actual,expected,'should return existing slices (table notation) as label/value pairs');

		title = "tiddler";
		text = "|''foo''|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should strip bold markup from slice labels');

		title = "tiddler";
		text = "|//foo//|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should strip italic markup from slice labels');

		title = "tiddler";
		text = "|foo|''bar''|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "''bar''" };
		same(actual,expected,'should not strip markup from slice values');

		title = "tiddler";
		text = "|~FooBar|baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { FooBar: "baz" };
		same(actual,expected,'should ignore the escaping character for WikiWords in slice labels');

		title = "tiddler";
		text = "|~foo|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should ignore the escaping character for non-WikiWords in slice labels');

		title = "tiddler";
		text = "|foo|~BarBaz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "~BarBaz" };
		same(actual,expected,'should not ignore the escaping character for WikiWords in slice values');

		title = "tiddler";
		text = "|foo|~bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "~bar" };
		same(actual,expected,'should not ignore the escaping character for non-WikiWords in slice values');

		title = "tiddler";
		text = "|foo bar|baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = {};
		same(actual,expected,'should ignore slices whose label contains spaces');

		title = "tiddler";
		text = "|foo|bar baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar baz" };
		same(actual,expected,'should not ignore slices whose value contains spaces');

		title = "tiddler";
		text = "|foo:|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should strip trailing colons from slice labels (table notation)');

		title = "tiddler";
		text = "''~FooBar:'' baz";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { FooBar: "baz" };
		same(actual,expected,'should strip bold markup from slice labels (colon notation)');

		title = "tiddler";
		text = "//~FooBar:// baz";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { FooBar: "baz" };
		same(actual,expected,'should strip italic markup from slice labels (colon notation)');

		title = "tiddler";
		text = "|''~FooBar:''|baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { FooBar: "baz" };
		same(actual,expected,'should strip bold markup from slice labels (table notation)');

		title = "tiddler";
		text = "|//~FooBar://|baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { FooBar: "baz" };
		same(actual,expected,'should strip italic markup from slice labels (table notation)');

		title = "tiddler";
		text = "foo: bar: baz";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar: baz" };
		same(actual,expected,'should ignore colons in slice values (colon notation)');

		title = "tiddler";
		text = "foo.bar: baz";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "foo.bar": "baz" };
		same(actual,expected,'should allow dots in slice labels');

		title = "tiddler";
		text = "foo: bar|baz";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "foo": "bar|baz" };
		same(actual,expected,'should allow pipes in slice values (colon notation)');

		title = "tiddler";
		text = "|foo|bar|baz|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "foo": "bar|baz" };
//		same(actual,expected,'should allow pipes in slice values (table notation)');

		title = "tiddler";
		text = "foo: lorem [[bar|baz]] ipsum";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "lorem [[bar|baz]] ipsum" };
		same(actual,expected,'should retrieve slices containing PrettyLinks (colon notation)');

		title = "tiddler";
		text = "foo: lorem [img[qux|bar.baz]] ipsum";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "lorem [img[qux|bar.baz]] ipsum" };
		same(actual,expected,'should retrieve slices containing image markup (colon notation)');

	/*
		// FAILURE
		// ticket #522 (http://trac.tiddlywiki.org/ticket/522)
		title = "tiddler";
		text = "//{{{\nfoo: bar;\n//}}}";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = {};
		same(actual,expected,'should disregard apparent slices within code sections');
	*/
		title = "tiddler";
		text = "{\n\tfoo: 'bar'\n}\n";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = {};
		same(actual,expected,'should disregard slices within JSON structures');
	});

	test("Slices: getTiddlerSlice()", function() {
		var store = new TiddlyWiki();

		var actual = store.getTiddlerSlice();
		var expected = undefined;
		same(actual,expected,'should return undefined when not passed any arguments');

		actual = store.getTiddlerSlice("tiddler", "foo");
		expected = undefined;
		same(actual,expected,'should return undefined when pointed to non-existing tiddler');

		title = "tiddler";
		text = "foo bar\nbaz";
		store.saveTiddler(title, title, text);
		actual = store.getTiddlerSlice(title, "foo");
		expected = undefined;
		same(actual,expected,'should return undefined when pointed to non-existing slice');

		title = "tiddler";
		text = "foo: bar";
		store.saveTiddler(title, title, text);
		actual = store.getTiddlerSlice(title, "foo");
		expected = "bar";
		same(actual,expected,'should return slice value when given slice label (colon notation)');

		title = "tiddler";
		text = "|foo|bar|";
		store.saveTiddler(title, title, text);
		actual = store.getTiddlerSlice(title, "foo");
		expected = "bar";
		same(actual,expected,'should return slice value when given slice label (table notation)');

	/*
		// FAILURE
		// ticket #370 (http://trac.tiddlywiki.org/ticket/370)
		title = "tiddler";
		text = "|!foo|bar|";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { foo: "bar" };
		same(actual,expected,'should strip heading markup from slice labels (table notation)');

		// FAILURE
		// ticket #370 (http://trac.tiddlywiki.org/ticket/370)
		title = "tiddler";
		text = "[[foo]]: bar";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "foo": "bar" };
		same(actual,expected,'should strip double brackets (PrettyLinks) from slice labels');

		// FAILURE
		// ticket #370 (http://trac.tiddlywiki.org/ticket/370)
		title = "tiddler";
		text = "[foo]: bar";
		store.saveTiddler(title, title, text);
		actual = store.calcAllSlices(title);
		expected = { "[foo]": "bar" };
		same(actual,expected,'should allow brackets in slice labels');
	*/

	});


	test("getTaggedTiddlers", function() {
		var tiddlers = store.getTaggedTiddlers("twtesthello");
		strictEqual(tiddlers.length, 2, 'No message');
	});

	test("getValueTiddlers", function() {
		var tiddlers = store.getValueTiddlers("xyz", "bar");
		var tiddlers2 = store.getValueTiddlers("tags", "twtesthello");
		strictEqual(tiddlers.length, 3, 'No message');
	});

	test("filterTiddlers", function() {
		var tiddlers = store.filterTiddlers("[tag[twtesthello]]");
		var tiddlers2 = store.filterTiddlers("[xyz[bar]]");
		var tiddlers3 = store.filterTiddlers("[tag[twtesthello]][limit[1]]");
		var tiddlers4 = store.filterTiddlers("[xyz[bar]][limit[2]]");
		strictEqual(tiddlers.length, 2, 'No message');
		strictEqual(tiddlers2.length, 3, 'No message');
		strictEqual(tiddlers3.length, 1, 'No message');
		strictEqual(tiddlers4.length, 2, 'No message');
	});

	test("reverseLookup (custom fields)", function() {
		var lookupField = "server.bag";
		var lookupValue = "foo";
		var sortField = "modified";
		var tiddlers = store.reverseLookup(lookupField,lookupValue,true,sortField);
		var tiddlers2 = store.reverseLookup(lookupField,lookupValue,false,sortField);
		strictEqual(tiddlers.length, 1);
		strictEqual(tiddlers[0].title, "testTiddler3");
		strictEqual(tiddlers2.length, _numTiddlers - 1, "returns all the tiddlers minus the one with this field match");
	});

	test("reverseLookup (tags)", function() {
		var lookupField = "tags";
		var lookupValue = "testTag";
		var sortField = "title";
		var tiddlers = store.reverseLookup(lookupField,lookupValue,true,sortField);
		var tiddlers2 = store.reverseLookup(lookupField,lookupValue,false,sortField);
		strictEqual(tiddlers.length, 3);
		strictEqual(tiddlers[0].title, "testTiddler1");
		strictEqual(tiddlers[1].title, "testTiddler2");
		strictEqual(tiddlers[2].title, "testTiddler3");
		strictEqual(tiddlers2.length, _numTiddlers - 3, "returns all the tiddlers minus the three tiddler with this tag");
	});

	test("reverseLookup (links)", function() {
		var lookupField = "links";
		var lookupValue = "testTiddler2";
		var sortField = "title";
		var tiddlers = store.reverseLookup(lookupField,lookupValue,true,sortField);
		var tiddlers2 = store.reverseLookup(lookupField,lookupValue,false,sortField);
		strictEqual(tiddlers.length, 1);
		strictEqual(tiddlers[0].title, "testTiddler3");
		strictEqual(tiddlers2.length, _numTiddlers - 1, "returns all the tiddlers minus the one tiddler with this link");
	});

	test("reverseLookup (attribute)", function() {
		var lookupField = "creator";
		var lookupValue = "martin";
		var sortField = "title";
		var tiddlers = store.reverseLookup(lookupField,lookupValue,true,sortField);
		var tiddlers2 = store.reverseLookup(lookupField,lookupValue,false,sortField);
		strictEqual(tiddlers.length, 1);
		strictEqual(tiddlers[0].title, "testTiddler3");
		strictEqual(tiddlers2.length, _numTiddlers - 1, "returns all the tiddlers minus the one tiddler created by martin");
	});

	var _loadFromDiv, storeArea;
	module("TiddlyWiki.js - importTiddlyWiki", {
		setup: function() {
			_loadFromDiv = TiddlyWiki.prototype.loadFromDiv;
			TiddlyWiki.prototype.loadFromDiv = function(area) {
				storeArea = area;
			};
		},
		teardown: function() {
			TiddlyWiki.prototype.loadFromDiv = _loadFromDiv;
			storeArea = null;
		}
	});

	test("importTiddlyWiki empty store", function() {
		var html = ['<html><head></head><body>', '<!--POST-SHADOWAREA-->',
			'<div id="storeArea">', '</div>',
			'<!--POST-STOREAREA-->', '</body></html>'].join("\n");
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
	});

	test("importTiddlyWiki empty store (post body start)", function() {
		var html = ['<html><head></head><body>',
			'<!--POST-SHADOWAREA-->',
			'<div id="storeArea">', '</div>',
			,'<!--POST-BODY-START-->','</body></html>'].join("\n");
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
	});

	test("importTiddlyWiki empty store (minified test)", function() {
		var html = ['<html><head></head><body>',
			'<!--POST-SHADOWAREA-->',
			'<div id="storeArea">', '</div>',
			,'<!--POST-BODY-START-->','</body></html>'].join(""); // join without newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
	});

	test("importTiddlyWiki empty store (minified test)", function() {
		var html = ['<html><head></head><body>',
			'<!--POST-SHADOWAREA-->',
			'<div id="storeArea"><div class="tiddler">hello</div>', '</div>',
			,'<!--POST-BODY-START-->','</body></html>'].join(""); // join without newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
		strictEqual($(".tiddler", storeArea).length, 1, "there is one element with class tiddler within the element");
	});

	test("importTiddlyWiki empty store (no comments)", function() {
		var html = ['<html><head></head><body>','<div id="storeArea"><div class="tiddler">hello</div></div>',
			'</body></html>'].join(""); // join without newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
		strictEqual($(".tiddler", storeArea).length, 1, "there is one element with class tiddler within the element");
	});

	test("importTiddlyWiki empty store (upper case tags)", function() {
		var html = ['<HTML><HEAD></HEAD><BODY>','<DIV ID="storeArea"><DIV class="tiddler">hello</DIV></DIV>',
			'</BODY></HTML>'].join("\n"); // join with newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
		strictEqual($(".tiddler", storeArea).length, 1, "there is one element with class tiddler within the element");
	});

	test("importTiddlyWiki empty store (storeArea in single quotes)", function() {
		var html = ["<HTML><HEAD></HEAD><BODY>","<DIV ID='storeArea'>",'<DIV class="tiddler">hello</DIV></DIV>',
			'</BODY></HTML>'].join("\n"); // join with newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
		strictEqual($(".tiddler", storeArea).length, 1, "there is one element with class tiddler within the element");
	});

	test("importTiddlyWiki empty store (storeArea with no quotes)", function() {
		var html = ["<HTML><HEAD></HEAD><BODY>","<DIV id=storeArea>",'<DIV class="tiddler">hello</DIV></DIV>',
			'</BODY></HTML>'].join("\n"); // join with newlines
		store.importTiddlyWiki(html);
		strictEqual($(storeArea).attr("id"), "storeArea", "make sure a storeArea was found");
		strictEqual($(".tiddler", storeArea).length, 1, "there is one element with class tiddler within the element");
	});
});
