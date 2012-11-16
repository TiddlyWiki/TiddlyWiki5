jQuery(document).ready(function(){

	module("TiddlyWiki core");

	test("Shadow tiddler existence", function() {
		expect(2);

		var actual = config.shadowTiddlers["EditTemplate"];
		ok(actual,'EditTemplate shadow tiddler should exist');

		loadShadowTiddlers();
		actual = config.shadowTiddlers["StyleSheetColors"];
		ok(actual,'StyleSheetColors shadow tiddler should exist');

		actual = config.shadowTiddlers["SystemSettings"];
		strictEqual(typeof(actual) !== 'undefined',true,'SystemSettings shadow tiddler should exist');

	});


});
