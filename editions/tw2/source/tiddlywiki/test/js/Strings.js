jQuery(document).ready(function(){

	module("TiddlyWiki core");

	test("String functions", function() {
		expect(4);

		var actual = "abcdef".right(3);
		var expected = "def";
		ok(actual==expected,'String right');

		actual = " abcdef ".trim();
		expected = "abcdef";
		ok(actual==expected,'String trim');

		actual = " abc def ".trim();
		expected = "abc def";
		ok(actual==expected,'String trim');

		actual = "background-color".unDash();
		expected = "backgroundColor";
		ok(actual==expected,'String undash');

	});

	test("readMacroParams", function() {
		var params = "foo bar dum".readMacroParams(false);
		var params2 = "foo bar 'tweedle de' dum".readMacroParams(false);
		var params3 = "foo bar 'tweedle dum' dum test:foo test: 'bar' [[check brackets]]".readMacroParams(false);

		strictEqual(params.length, 3, "There are 3 parameters");
		strictEqual(params2.length, 4, "There are 4 parameters");
		strictEqual(params2[2], "tweedle de", "Check parameter in brackets");
		strictEqual(params3[4], "test:foo");
		strictEqual(params3[5], "test:");
		strictEqual(params3[6], "bar");
		strictEqual(params3[7], "check brackets");
	});

	test("parseParams", function() {
		var args = "foo [[bar dum]] test:foo test: bar hello:[[goodbye]] x: [[bar dum]] what:[['fun']] why:'[[test]]'".
			parseParams();
		var args2 = "foo [[bar dum]] test:foo test: bar hello:[[goodbye]] x: [[bar dum]] what:[['fun']] why:'[[test]]'".
			parseParams("anon");
		var map = args[0];
		var map2 = args2[0];

		strictEqual(map.anon, undefined, "no unnamed parameters matched");
		strictEqual(map.what.length, 1, "what only matched once");
		strictEqual(map.test.length, 2, "test is a named parameter twice");
		strictEqual(args[2].name, "bar dum", "unnamed parameters are collected in resulting array");
		strictEqual(args[2].value, undefined, "no value for unnamed parameters");
		strictEqual(args[3].value, "foo", "test matches foo");
		strictEqual(args[4].value, "bar", "test matches bar the leading whitespace ignored");
		strictEqual(args[5].value, "goodbye", "checking [[ ]]");
		strictEqual(args[6].value, "bar dum", "checking [[ ]] and ignored leading space");
		strictEqual(args[7].value, "'fun'", "checking the quotes are kept");
		strictEqual(args[8].value, "[[test]]", "checking the brackets are kept in this special case");

		strictEqual(map2.anon.length, 2, "foo and bar dum matched");
		strictEqual(args2[1].name, "anon",
			"unnamed parameters collect as anonymous");
		strictEqual(args2[1].value, "foo",
			"unnamed parameters collect as anonymous");
		strictEqual(args2[2].name, "anon",
			"unnamed parameters collect as anonymous");
		strictEqual(args2[2].value, "bar dum", "unnamed parameters collect as anonymous");
		strictEqual(args2[3].name, "test", "named parameters collected as normal");
	});
});
