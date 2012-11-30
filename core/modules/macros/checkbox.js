/*\
title: $:/core/modules/macros/checkbox.js
type: application/javascript
module-type: macro

Checkbox macro

{{{
<<checkbox tag:done>>

<<checkbox tiddler:HelloThere tag:red>>

<<checkbox tag:done><
<<view title>>
>>
}}}


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "checkbox",
	params: {
		tiddler: {byName: true, type: "tiddler"},
		tag: {byPos: 0, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.targetTitle);
	return tiddler ? tiddler.hasTag(this.params.tag) : false;
};

exports.executeMacro = function() {
	// Get the title of the target tiddler
	if(this.hasParameter("tiddler")) {
		this.targetTitle = this.params.tiddler;
	} else {
		this.targetTitle = this.tiddlerTitle;
	}
	// Checkbox attributes
	var checkboxAttributes = {
		type: "checkbox"
	};
	if(this.getValue()) {
		checkboxAttributes.checked = "true";
	}
	// Label attributes
	var labelAttributes = {
		"class": []
	};
	if(this.hasParameter("class")) {
		$tw.utils.pushTop(labelAttributes["class"],this.params["class"].split(" "));
	}
	if(this.classes) {
		$tw.utils.pushTop(labelAttributes["class"],this.classes);
	}
	// Execute content
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	// Create elements
	return $tw.Tree.Element("label",labelAttributes,[
			$tw.Tree.Element("input",checkboxAttributes,[],{
				events: ["change"],
				eventHandler: this
			}),
			$tw.Tree.Element("span",{},this.content)
		],{});
	return ;
};

exports.handleEvent  = function(event) {
	if(event.type === "change") {
		var checked = this.child.children[0].domNode.checked,
			tiddler = this.wiki.getTiddler(this.targetTitle);
		if(tiddler && tiddler.hasTag(this.params.tag) !== checked) {
			var newTags = tiddler.fields.tags.slice(0),
				pos = newTags.indexOf(this.params.tag);
			if(pos !== -1) {
				newTags.splice(pos,1);
			}
			if(checked) {
				newTags.push(this.params.tag);
			}
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,{tags: newTags}));
		}
	}
};

exports.refreshInDom = function(changes) {
	// Only change the checkbox if the tiddler has changed
	if(this.dependencies.hasChanged(changes,this.targetTitle)) {
		this.child.children[0].domNode.checked = this.getValue();
	}
	// Refresh any children
	this.child.refreshInDom(changes);
};

})();
