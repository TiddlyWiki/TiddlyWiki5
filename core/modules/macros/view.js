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
		value,
		children,
		t,
		childrenClone = [],
		parents = this.parents;
	if(tiddler) {
		value = tiddler.fields[field];
	} else {
		switch(field) {
			case "text":
				value = "The tiddler '" + this.tiddlerTitle + "' does not exist";
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
	switch(this.params.format) {
		case "link":
			if(value === undefined) {
				return null;
			} else {
				var link = $tw.Tree.Macro("link",{
											srcParams: {to: value},
											content: [$tw.Tree.Text(value)],
											wiki: this.wiki
										});
				link.execute(parents,this.tiddlerTitle);
				return link;
			}
			break;
		case "wikified":
			if(tiddler && this.params.field === "text") {
				if(parents.indexOf(tiddler.fields.title) !== -1) {
					children = [$tw.Tree.errorNode("Tiddler recursion error in <<view>> macro")];
				} else {
					children = this.wiki.parseTiddler(tiddler.fields.title).tree;
				}
				parents = parents.slice(0);
				parents.push(tiddler.fields.title);
			} else {
				children = this.wiki.parseText("text/x-tiddlywiki",value).tree;
			}
			for(t=0; t<children.length; t++) {
				childrenClone.push(children[t].clone());
			}
			for(t=0; t<childrenClone.length; t++) {
				childrenClone[t].execute(parents,this.tiddlerTitle);
			}
			return $tw.Tree.Element(this.isBlock ? "div" : "span",{},childrenClone);
		case "date":
			var template = this.params.template || "DD MMM YYYY";
			if(value === undefined) {
				return null;
			} else {
				return $tw.Tree.Text($tw.utils.formatDateString(value,template));
			}
			break;
		default: // "text"
			// Get the stringified version of the field value
			if(field !== "text" && tiddler) {
				value = tiddler.getFieldString(field);
			}
			if(value === undefined || value === null) {
				return null;
			} else {
				return $tw.Tree.Text(value);
			}
	}
	return null;
};

})();

