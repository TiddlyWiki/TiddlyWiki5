/*\
title: $:/core/modules/dependencies.js
type: application/javascript
module-type: global

Represents the dependencies of a tiddler or a parser node as these fields:

	tiddlers: A hashmap of explicitly tiddler titles, with the value `false` if the dependency is skinny, and `true` if it is fat
	dependentAll: True if there is an implicit skinny dependency on all available tiddlers
	dependentOnContextTiddler: True if the node has a fat dependency on the current context tiddler

\*/
(function(){

/*jslint node: true */
"use strict";

var Dependencies = function(skinnyTiddlers,fatTiddlers,dependentAll) {
	var t,title;
	this.tiddlers = {};
	this.dependentAll = dependentAll;
	if(skinnyTiddlers) {
		for(t=0; t<skinnyTiddlers.length; t++) {
			title = skinnyTiddlers[t];
			if(typeof title === "string" && title !== "") {
				this.tiddlers[title] = false;
			}
		}
	}
	if(fatTiddlers) {
		for(t=0; t<fatTiddlers.length; t++) {
			title = fatTiddlers[t];
			if(typeof title === "string" && title !== "") {
				this.tiddlers[title] = true;
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
	changes: Hashmap of {modified: bool, deleted: bool}
	contextTiddlerTitle: The title of the current context tiddler
*/
Dependencies.prototype.hasChanged = function(changes,contextTiddlerTitle) {
	if(this.dependentAll) {
		return true;
	}
	if(!!this.dependentOnContextTiddler && contextTiddlerTitle && changes.hasOwnProperty(contextTiddlerTitle)) {
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
