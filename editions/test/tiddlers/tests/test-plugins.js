/*\
title: test-plugins.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for integrity of the core plugins, languages, themes and editions

\*/
(function(){
"use strict";

if($tw.node) {

	describe("Plugin tests", function() {

		// Get all the plugins as a hashmap by title of a JSON string with the plugin content
		var tiddlers = $tw.utils.getAllPlugins({ignoreEnvironmentVariables: true});
		// console.log(JSON.stringify(Object.keys(tiddlers),null,4));
		describe("every plugin should have the required standard fields", function() {
			var titles = Object.keys(tiddlers);
			$tw.utils.each(titles,function(title) {
				var fields = tiddlers[title];
				it("plugin should have a recognised plugin-type field",function() {
					expect(["plugin","language","theme"].indexOf(fields["plugin-type"]) !== -1).toEqual(true);
				});
				switch(fields["plugin-type"]) {
					case "plugin":
						it("plugin " + title + " should have name, description and list fields",function() {
							expect(!!(fields.name && fields.description && fields.list)).toBe(true);
						});
						it("plugin " + title + " should have a valid stability field",function() {
							expect(["STABILITY_0_DEPRECATED","STABILITY_1_EXPERIMENTAL","STABILITY_2_STABLE","STABILITY_3_LEGACY"].indexOf(fields.stability) !== -1).toBe(true);
						});
						break;
					case "language":
						it("language " + title + " should have name and description fields",function() {
							expect(!!(fields.name && fields.description)).toEqual(true);
						});
						break;
					case "theme":
						it("theme " + title + " should have name and description fields",function() {
							expect(!!(fields.name && fields.description)).toEqual(true);
						});
						break;
				}
			});
		});
	});
}


})();
