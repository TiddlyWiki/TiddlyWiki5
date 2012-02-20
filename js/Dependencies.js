/*\
title: js/Dependencies.js

Represents the dependencies of a tiddler or a parser node as two fields:

	tiddlers: A hashmap of explicitly tiddler titles, with the value `false` if the dependency is skinny, and `true` if it is fat
	dependentAll: True if there is an implicit skinny dependency on all available tiddlers

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

var Dependencies = function(skinnyTiddlers,fatTiddlers,dependentAll) {
	var t,tiddlerTitle;
	this.tiddlers = {};
	this.dependentAll = dependentAll;
	if(skinnyTiddlers) {
		for(t=0; t<skinnyTiddlers.length; t++) {
			tiddlerTitle = skinnyTiddlers[t];
			if(typeof tiddlerTitle === "string" && tiddlerTitle !== "") {
				this.tiddlers[tiddlerTitle] = false;
			}
		}
	}
	if(fatTiddlers) {
		for(t=0; t<fatTiddlers.length; t++) {
			tiddlerTitle = fatTiddlers[t];
			if(typeof tiddlerTitle === "string" && tiddlerTitle !== "") {
				this.tiddlers[tiddlerTitle] = true;
			}
		}
	}
};

/*
Adds a dependency to a given tiddler. Note how setting a dependency of fat=false on a tiddler that already has 
a dependency of fat=true will leave the fat setting as true
*/
Dependencies.prototype.addDependency = function(tiddlerTitle,fat) {
	if(!this.tiddlers[tiddlerTitle]) {
		this.tiddlers[tiddlerTitle] = fat;
	}
};

Dependencies.prototype.mergeDependencies = function(dep) {
	this.dependentAll = dep.dependentAll || this.dependentAll;
	for(var t in dep.tiddlers) {
		this.addDependency(t,dep.tiddlers[t]);
	}
};

/*
Determine if these dependencies are impacted by the specified array of changes
	changes: Hashmap of {title: "created|modified|deleted"}
*/
Dependencies.prototype.hasChanged = function(changes) {
	if(this.dependentAll) {
		return true;
	}
	for(var c in changes) {
		if(this.tiddlers.hasOwnProperty(c)) {
			return true;
		}
	}
	return false;
};

exports.Dependencies = Dependencies;

})();
