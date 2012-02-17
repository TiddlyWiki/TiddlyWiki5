/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var Tiddler = require("../Tiddler.js").Tiddler,
	Renderer = require("../Renderer.js").Renderer,
	utils = require("../Utils.js");

// Parse the text of a story tiddler into an array of tiddler titles
var parseStory = function(storyText) {
	var storyLines = storyText.split("\n"),
		tiddlers = [];
	for(var t=0; t<storyLines.length; t++) {
		var title = storyLines[t].trim();
		if(title !== "") {
			tiddlers.push(title);
		}
	}
	return tiddlers;
};

exports.macro = {
	name: "story",
	types: ["text/html","text/plain"],
	params: {
		story: {byName: "default", type: "tiddler", optional: false},
		template: {byName: true, type: "tiddler", optional: true}
	},
	events: {
		"tw-navigate": function(event,macroNode) {
			var storyTiddler = macroNode.store.getTiddler(macroNode.params.story);
			macroNode.store.addTiddler(new Tiddler(storyTiddler,{text: event.navigateTo + "\n" + storyTiddler.text}));
			$("html,body").animate({
				scrollTop: 0
			}, 400);
			event.preventDefault();
			return false;
		}
	},
	execute: function(macroNode,tiddler,store) {
		var tiddlers = parseStory(store.getTiddlerText(macroNode.params.story)),
			content = [];
		for(var t=0; t<tiddlers.length; t++) {
			var paramFn = {target: tiddlers[t],template: macroNode.params.template},
				dependencies = {include: {}};
			dependencies.include[tiddlers[t]] = 1;
			if(macroNode.params.template) {
				dependencies.include[macroNode.params.template] = 1;
			}
			var m = Renderer.MacroNode("tiddler",paramFn,null,dependencies,store);
			m.execute(tiddler);
			content.push(m);
		}
		return content;
	},
	refresh: function(changes,macroNode,tiddler,store) {
		/*jslint browser: true */
		// Get the tiddlers we're supposed to be displaying
		var targetTiddlers = parseStory(store.getTiddlerText(macroNode.params.story)),
			template = macroNode.params.template,
			t,n,domNode,
			findTiddler = function (childIndex,tiddlerTitle,templateTitle) {
				while(childIndex < macroNode.content.length) {
					var params = macroNode.content[childIndex].params;
					if(params.target === tiddlerTitle) {
						if(!templateTitle || params.template === templateTitle) {
							return childIndex;
						}
					}
					childIndex++;
				}
				return null;
			};
		for(t=0; t<targetTiddlers.length; t++) {
			// See if the node we want is already there
			var tiddlerNode = findTiddler(t,targetTiddlers[t],template);
			if(tiddlerNode === null) {
				// If not, render the tiddler
				var paramFn = {target: targetTiddlers[t],template: template},
					dependencies = {include: {}};
				dependencies.include[targetTiddlers[t]] = 1;
				if(template) {
					dependencies.include[template] = 1;
				}
				var m = Renderer.MacroNode("tiddler",paramFn,null,dependencies,store);
				m.execute(store.getTiddler(targetTiddlers[t]));
				m.renderInDom(macroNode.domNode,macroNode.domNode.childNodes[t]);
				macroNode.content.splice(t,0,m);
			} else {
				// Delete any nodes preceding the one we want
				if(tiddlerNode > t) {
					// First delete the DOM nodes
					for(n=t; n<tiddlerNode; n++) {
						domNode = macroNode.content[n].domNode;
						domNode.parentNode.removeChild(domNode);
					}
					// Then delete the actual renderer nodes
					macroNode.content.splice(t,tiddlerNode-t);
				}
				// Refresh the DOM node we're reusing
				macroNode.content[t].refreshInDom(changes);
			}
		}
		// Remove any left over nodes
		if(macroNode.content.length > targetTiddlers.length) {
			for(t=targetTiddlers.length; t<macroNode.content.length; t++) {
				domNode = macroNode.content[t].domNode;
				domNode.parentNode.removeChild(domNode);
			}
			macroNode.content.splice(targetTiddlers.length,macroNode.content.length-targetTiddlers.length);
		}
	}
};

})();
