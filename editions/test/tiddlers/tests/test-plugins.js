/*\
title: test-plugins.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for integrity of the core plugins, languages, themes and editions

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.node) {

	describe("Plugin tests", function() {

		// Get all the plugins as a hashmap by title of a JSON string with the plugin content
		var tiddlers = $tw.utils.getAllPlugins({ignoreEnvironmentVariables: true});
		// console.log(JSON.stringify(Object.keys(tiddlers),null,4));
		describe("every plugin should have the required standard fields", function() {
			var titles = Object.keys(tiddlers);
			$tw.utils.each(titles,function(title) {
				it("plugin " + title + " should have the required standard fields",function() {
					var fields = tiddlers[title];
					expect(fields["plugin-type"]).toMatch(/^(?:plugin|language|theme)$/);
					switch(fields["plugin-type"]) {
						case "plugin":
							expect(!!(fields.name && fields.description && fields.list)).toEqual(true);
							expect(fields.stability).toMatch(/^(?:STABILITY_0_DEPRECATED|STABILITY_1_EXPERIMENTAL|STABILITY_2_STABLE|STABILITY_3_LEGACY)$/);
							break;
						case "language":
							expect(!!(fields.name && fields.description)).toEqual(true);
							break;
						case "theme":
							expect(!!(fields.name && fields.description)).toEqual(true);
							break;
						}
				});
			});
		});
	});
}


})();
