/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var Tiddler = require("../Tiddler.js").Tiddler,
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

// Search the children of a node looking for the required tiddler rendering
var searchTiddlerNode = function(node,renderTiddler,renderTemplate) {
	while(node !== null) {
		if(node.getAttribute && node.getAttribute("data-tw-render-tiddler") === renderTiddler) {
			if(!renderTemplate || (renderTemplate && node.getAttribute("data-tw-render-template") == renderTemplate)) {
				return node;
			}
		}
		node = node.nextSibling;
	}
	return null;
};

exports.macro = {
	name: "story",
	types: ["text/html","text/plain"],
	params: {
		story: {byName: "default", type: "tiddler", optional: false},
		template: {byName: true, type: "tiddler", optional: true}
	},
	events: {
		"tw-navigate": function(event,node,tiddler,store,params) {
			var storyTiddler = store.getTiddler(params.story);
			store.addTiddler(new Tiddler(storyTiddler,{text: event.navigateTo + "\n" + storyTiddler.text}));
			$("html,body").animate({
				scrollTop: 0
			}, 400);
			event.preventDefault();
			return false;
		}
	},
	render: function(type,tiddler,store,params) {
		var tiddlers = parseStory(store.getTiddlerText(params.story)),
			output = [];
		for(var t=0; t<tiddlers.length; t++) {
			if(params.template) {
				output.push(store.renderTiddler(type,tiddlers[t],params.template));
			} else {
				output.push(store.renderTiddler(type,tiddlers[t]));
			}
		}
		return output.join("\n");
	},
	rerender: function(node,changes,type,tiddler,store,params) {
		/*jslint browser: true */
		// Get the tiddlers we're supposed to be displaying
		var targetTiddlers = parseStory(store.getTiddlerText(params.story)),
			currNode = node.firstChild,
			nextNode;
		for(var t=0; t<targetTiddlers.length; t++) {
			// See if the node we want is already there
			var tiddlerNode = searchTiddlerNode(currNode,targetTiddlers[t],params.template);
			if(tiddlerNode === null) {
				// If not, render the tiddler
				var tmpNode = document.createElement("div");
				store.renderTiddlerInNode(tmpNode,targetTiddlers[t],params.template);
				tiddlerNode = tmpNode.firstChild;
				node.insertBefore(tiddlerNode,currNode);
			} else {
				// Delete any nodes preceding the one we want
				while(currNode !== tiddlerNode) {
					nextNode = currNode.nextSibling;
					node.removeChild(currNode);
					currNode = nextNode;
				}
				// Refresh it
				store.refreshDomNode(tiddlerNode,changes);
				currNode = currNode.nextSibling;
			}
		}
		// Remove any unused nodes
		while(currNode !== null) {
			nextNode = currNode.nextSibling;
			node.removeChild(currNode);
			currNode = nextNode;
		}
	}
};

})();

