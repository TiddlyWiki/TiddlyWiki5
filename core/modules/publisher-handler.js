/*\
title: $:/core/modules/publisherhandler.js
type: application/javascript
module-type: global

The publisher manages publishing extracts of wikis as external files

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Instantiate the publisher manager with the following options
widget: optional widget for attaching event handlers
*/
function PublisherHandler(options) {
	this.widget = options.widget;
	this.wiki = options.wiki;
	this.reset();
	if(this.widget) {
		this.widget.addEventListener("tm-publish-start",this.onPublishStart.bind(this));
		this.widget.addEventListener("tm-publish-route",this.onPublishRoute.bind(this));
		this.widget.addEventListener("tm-publish-end",this.onPublishEnd.bind(this));		
	}
}

PublisherHandler.prototype.onPublishStart = function(event) {
	var publisherName = event.paramObject["publisher-name"],
		publisherParamsTitle = event.paramObject["publish-params-title"],
		publisherParamsTiddler = publisherParamsTitle && this.wiki.getTiddler(publisherParamsTitle);
	if(publisherName && publisherParamsTiddler) {
		this.publisherName = publisherName;
		this.publisherParamsTitle = publisherParamsTitle;
		this.publisherParams = publisherParamsTiddler.fields;
		this.routes = [];
	}
};

PublisherHandler.prototype.onPublishEnd = function(event) {
	if(this.publisherName && this.publisherParams && this.routes) {
		this.publish();
	}
};

PublisherHandler.prototype.onPublishRoute = function(event) {
	if(this.publisherName && this.publisherParams && this.routes) {
		this.routes.push(event.paramObject);
	}
};

/*
Instantiate the required publisher object
*/
PublisherHandler.prototype.getPublisher = function() {
	var self = this,
		publisher;
	$tw.modules.forEachModuleOfType("publisher",function(title,module) {
		if(module.name === self.publisherName) {
			publisher = module;
		}
	});
	return publisher && publisher.create(this.publisherParams);
};

/*
Expand publish routes to separate commands
*/
PublisherHandler.prototype.expandRoutes = function(routes) {
	var self = this,
		commands = [];
	$tw.utils.each(routes,function(route) {
		var filter = route.filter || "DUMMY_RESULT"; // If no filter is provided, use a dummy filter that returns a single result
		switch(route["route-type"]) {
			case "save":
				if(filter && route.path) {
					$tw.utils.each(self.wiki.filterTiddlers(filter),function(title) {
						commands.push({
							"route-type": "save",
							path: self.resolveParameterisedPath(route.path,title),
							title: title
						});
					});
				}
				break;
			case "render":
				if(filter && route.path && route.template) {
					$tw.utils.each(self.wiki.filterTiddlers(filter),function(title) {
						commands.push({
							"route-type": "render",
							path: self.resolveParameterisedPath(route.path,title),
							title: title,
							template: route.template
						});
					});
				}
				break;
		}
	});
	return commands;
};

/*
Apply a tiddler to a parameterised path to create a usable path
*/
PublisherHandler.prototype.resolveParameterisedPath = function(route,title) {
	var self = this;
	// Split the route on $$ markers
	var tiddler = this.wiki.getTiddler(title),
		output = [];
	$tw.utils.each(route.split(/(\$[a-z_]+\$)/),function(part) {
		var match = part.match(/\$([a-z]+)_([a-z]+)\$/);
		if(match) {
			var value;
			// Get the base value
			switch(match[1]) {
				case "uri":
				case "title":
					value = title;
					break;
				case "type":
					value = tiddler.fields.type || "text/vnd.tiddlywiki";
					break;
			}
			// Apply the encoding function
			switch(match[2]) {
				case "encoded":
					value = encodeURIComponent(value);
					break;
				case "doubleencoded":
					value = encodeURIComponent(encodeURIComponent(value));
					break;
				case "slugify":
					value = self.wiki.slugify(value);
					break;
				case "extension":
					value = ($tw.config.contentTypeInfo[value] || {extension: "."}).extension.slice(1);
					break;
			}
			output.push(value);
		} else {
			output.push(part);
		}
	});
	return output.join("");
};

/*
Publish the routes in this.routes[]
*/
PublisherHandler.prototype.publish = function(callback) {
	var self = this,
		report = {overwrites: []},
		commands = this.expandRoutes(this.routes),
		nextCommand = 0,
		publisher = this.getPublisher(),
		performNextCommand = function() {
			// Set progress
			self.setProgress(nextCommand,commands.length);
			// Check for having finished
			if(nextCommand >= commands.length) {
				publisher.publishEnd(function() {
					self.saveReport(report);
					self.reset();
					self.hideProgress();
					if(callback) {
						$tw.utils.nextTick(callback);
					}
				});
			} else {
				// Execute this command
				var fileDetails = self.prepareCommand(commands[nextCommand]);
				nextCommand += 1;
				publisher.publishFile(fileDetails,function() {
					$tw.utils.nextTick(performNextCommand);
				});
			}
		};
	// Fail if we didn't get a publisher
	if(!publisher) {
		alert("Publisher " + this.publisherName + " not found");
		return;
	}
	this.displayProgress("Publishing");
	// Tell the publisher to start, and get back an array of the existing paths
	publisher.publishStart(function(existingPaths) {
		var paths = {};
		$tw.utils.each(commands,function(command) {
			if(command.path in paths) {
				report.overwrites.push(command.path);
			}
			paths[command.path] = true;
		});
		// Run the commands
		$tw.utils.nextTick(performNextCommand);
	});
};

/*
Construct a file details object from a command object
*/
PublisherHandler.prototype.prepareCommand = function(command) {
	var tiddler = this.wiki.getTiddler(command.title),
		fileDetails = {
		path: command.path
	};
	switch(command["route-type"]) {
		case "save":
			fileDetails.text = tiddler.fields.text || "";
			fileDetails.type = tiddler.fields.type || "";
			break;
		case "render":
			fileDetails.text = this.wiki.renderTiddler("text/plain",command.template,{variables: {currentTiddler: command.title}});
			fileDetails.type = "text/html";
			break;
	}
	return fileDetails;
};

/*
*/
PublisherHandler.prototype.reset = function() {
	this.publisherName = null;
	this.publisherParams = null;
	this.routes = null;
};


PublisherHandler.prototype.saveReport = function(report) {
	// Create the report tiddler
	var reportTitle = this.wiki.generateNewTitle("$:/temp/publish-report");
	$tw.wiki.addTiddler({
		title: reportTitle,
		text: "* " + report.overwrites.join("\n* ")
	});
	// Add the report tiddler title to the list field of the publisher parameters tiddler
	var paramsTiddler = $tw.wiki.getTiddler(this.publisherParamsTitle),
		list = (paramsTiddler.fields.list || []).slice(0);
	list.unshift(reportTitle);
	$tw.wiki.addTiddler(new $tw.Tiddler(paramsTiddler,{list: list}));
};

PublisherHandler.prototype.displayProgress = function(message) {
	if($tw.browser) {
		this.progressWrapper = document.createElement("div");
		this.progressWrapper.className = "tc-progress-bar-wrapper";
		this.progressText = document.createElement("div");
		this.progressText.className = "tc-progress-bar-text";
		this.progressText.appendChild(document.createTextNode(message));
		this.progressWrapper.appendChild(this.progressText);
		this.progressBar = document.createElement("div");
		this.progressBar.className = "tc-progress-bar";
		this.progressWrapper.appendChild(this.progressBar);
		this.progressPercent = document.createElement("div");
		this.progressPercent.className = "tc-progress-bar-percent";
		this.progressWrapper.appendChild(this.progressPercent);
		document.body.appendChild(this.progressWrapper);
	}
};

PublisherHandler.prototype.hideProgress = function() {
	if($tw.browser && this.progressWrapper) {
		this.progressWrapper.parentNode.removeChild(this.progressWrapper);
		this.progressWrapper = null;
	}
};

PublisherHandler.prototype.setProgress = function(numerator,denominator) {
	if($tw.browser && this.progressWrapper) {
		// Remove old progress
		while(this.progressPercent.hasChildNodes()) {
			this.progressPercent.removeChild(this.progressPercent.firstChild);
		}
		// Set new text
		var percent = (numerator * 100 /denominator).toFixed(2) + "%";
		this.progressPercent.appendChild(document.createTextNode(percent));
		// Set bar width
		this.progressBar.style.width = percent;
	}
};

exports.PublisherHandler = PublisherHandler;

})();
