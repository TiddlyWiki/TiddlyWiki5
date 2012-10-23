/*\
title: $:/core/modules/macros/view.js
type: application/javascript
module-type: macro

View macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "view",
	dependentOnContextTiddler: true,
	params: {
		field: {byPos: 0, type: "text"},
		format: {byPos: 1, type: "text"},
		template: {byPos: 2, type: "text"}
	}
};

exports.executeMacro = function() {
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle),
		field = this.hasParameter("field") ? this.params.field : "title",
		value;
	// Get the value to display
	if(tiddler) {
		value = tiddler.fields[field];
	} else { // Use a special value if the tiddler is missing
		switch(field) {
			case "text":
				value = "";
				break;
			case "title":
				value = this.tiddlerTitle;
				break;
			case "modified":
			case "created":
				value = new Date();
				break;
			default:
				value = "Missing tiddler '" + this.tiddlerTitle + "'";
				break;
		}
	}
	// Figure out which viewer to use
	// TODO: Tiddler field modules should be able to specify a field type from which the viewer is derived
	if(tiddler && this.params.format) {
		var viewer = this.wiki.macros.view.fieldviewers[this.params.format];
	}
	if(!viewer) {
		viewer = this.wiki.macros.view.fieldviewers["text"];
	}
	// Call the viewer to generate the content
	return viewer(tiddler,field,value,this);
};

})();
