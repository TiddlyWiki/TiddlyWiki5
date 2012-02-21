/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var Tiddler = require("../Tiddler.js").Tiddler,
	Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
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
		story: {byName: "default", type: "tiddler"},
		template: {byName: true, type: "tiddler"}
	},
	events: {
		"tw-navigate": function(event) {
			var storyTiddler = this.store.getTiddler(this.params.story);
			this.store.addTiddler(new Tiddler(storyTiddler,{text: event.navigateTo + "\n" + storyTiddler.text}));
			$("html,body").animate({
				scrollTop: 0
			}, 400);
			event.preventDefault();
			return false;
		}
	},
	execute: function() {
		var tiddlers = parseStory(this.store.getTiddlerText(this.params.story)),
			content = [];
		for(var t=0; t<tiddlers.length; t++) {
			var m = Renderer.MacroNode("tiddler",
										{target: tiddlers[t],template: this.params.template},
										null,
										this.store);
			m.execute(this.parents,this.store.getTiddler(this.tiddlerTitle));
			content.push(m);
		}
		return content;
	},
	refresh: function(changes) {
		/*jslint browser: true */
		// Get the tiddlers we're supposed to be displaying
		var self = this,
			targetTiddlers = parseStory(this.store.getTiddlerText(this.params.story)),
			template = this.params.template,
			t,n,domNode,
			findTiddler = function (childIndex,tiddlerTitle,templateTitle) {
				while(childIndex < self.content.length) {
					var params = self.content[childIndex].params;
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
				var m = Renderer.MacroNode("tiddler",
											{target: targetTiddlers[t],template: template},
											null,
											this.store);
				m.execute(this.parents,this.store.getTiddler(targetTiddlers[t]));
				m.renderInDom(this.domNode,this.domNode.childNodes[t]);
				this.content.splice(t,0,m);
			} else {
				// Delete any nodes preceding the one we want
				if(tiddlerNode > t) {
					// First delete the DOM nodes
					for(n=t; n<tiddlerNode; n++) {
						domNode = this.content[n].domNode;
						domNode.parentNode.removeChild(domNode);
					}
					// Then delete the actual renderer nodes
					this.content.splice(t,tiddlerNode-t);
				}
				// Refresh the DOM node we're reusing
				this.content[t].refreshInDom(changes);
			}
		}
		// Remove any left over nodes
		if(this.content.length > targetTiddlers.length) {
			for(t=targetTiddlers.length; t<this.content.length; t++) {
				domNode = this.content[t].domNode;
				domNode.parentNode.removeChild(domNode);
			}
			this.content.splice(targetTiddlers.length,this.content.length-targetTiddlers.length);
		}
	}
};

})();
