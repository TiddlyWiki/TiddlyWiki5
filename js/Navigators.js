/*\
title: js/Navigators.js

This browser component manages the available navigators that handle clicking on links to tiddlers.

\*/
(function(){

/*jslint node: true */
"use strict";

var util = require("util");

/*
Options hashmap has mandatory members:
	document: the DOM document to use
	store: the wiki store to use
*/
var Navigators = function(options) {
	this.document = options.document;
	this.store = options.store;
	this.navigators = {};
};

Navigators.prototype.registerNavigator = function(name,nav) {
	this.navigators[name] = nav;
};

Navigators.prototype.install = function(selector,navname) {
	var nav = this.navigators[navname];
	this.document.addEventListener("click",function(e) {
		var el = e.target,
			matchesSelector = el.matchesSelector || el.mozMatchesSelector ||
				el.webkitMatchesSelector || el.oMatchesSelector || el.msMatchesSelector;
		if(matchesSelector && matchesSelector.call(el,selector)) {
			var r = nav.navigateTo(el.getAttribute("href"));
			if(!r) {
				e.preventDefault();
			} else {
				el.setAttribute("target","_blank");
			}
			return r;
		}
	},false);
};

Navigators.prototype.navigateTo = function(title,navname) {
	var nav = this.navigators[navname];
	if(nav) {
		nav.navigateTo(title);
	}
};

exports.Navigators = Navigators;

})();
