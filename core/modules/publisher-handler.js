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

var PUBLISHING_MODAL_TITLE = "$:/language/Publishing/Modal";

/*
Instantiate the publisher manager with the following options
wiki: wiki object to be used
commander: commander object to be used for output
*/
function PublisherHandler(options) {
	this.wiki = options.wiki;
	this.commander = options.commander;
}

/*
Publish a job

jobTitle: title of tiddler containing details of the job
callback: completion callback invoked callback(err)
options: Include:

commander: commander object associated with publishing under Node.js
variables: hashmap of variables to be passed to renderings
*/
PublisherHandler.prototype.publish = function(jobTitle,callback,options) {
	if(jobTitle) {
		var job = new PublishingJob(jobTitle,this,options);
		job.publish(callback);
	}
};

function PublishingJob(jobTitle,publisherHandler,options) {
	options = options || {};
	// Save params
	this.jobTitle = jobTitle;
	this.publisherHandler = publisherHandler;
	this.commander = options.commander;
	this.publishVariables = options.variables || Object.create(null);
}

/*
Start publishing
*/
PublishingJob.prototype.publish = function(callback) {
	var self = this;
	// Get the job tiddler and check it is enabled
	this.jobTiddler = this.publisherHandler.wiki.getTiddler(this.jobTitle);
	if(this.jobTiddler && this.jobTiddler.fields.enabled === "yes") {
		// Get the list of tiddlers to be exported, defaulting to all non-system tiddlers
		this.exportList = this.publisherHandler.wiki.filterTiddlers(this.jobTiddler.fields["export-filter"] || "[!is[system]]");
		// Get the job variables
		this.jobVariables = this.extractVariables(this.jobTiddler);
		// Get publisher
		this.publisher = this.getPublisher(this.jobTiddler.fields.publisher);
		if(this.publisher) {
			// Get the sitemap
			this.sitemap = this.publisherHandler.wiki.getTiddler(this.jobTiddler.fields.sitemap);
			if(this.sitemap) {
				// Get the sitemap variables
				this.sitemapVariables = this.extractVariables(this.sitemap);
				// Collect the operations from each route
				this.operations = [];
				$tw.utils.each(this.sitemap.fields.list,function(routeTitle) {
					var routeTiddler = self.publisherHandler.wiki.getTiddler(routeTitle);
					if(routeTiddler) {
						Array.prototype.push.apply(self.operations,self.getOperationsForRoute(routeTiddler));
					}
				});
				// Display the progress modal
				if($tw.modal) {
					self.progressModal = $tw.modal.display(PUBLISHING_MODAL_TITLE,{
						progress: true,
						variables: {
							currentTiddler: this.jobTitle,
							totalFiles: this.operations.length + ""
						},
						onclose: function(event) {
							if(event !== self) {
								// The modal was closed other than by us programmatically
								self.isCancelled = true;
							}
						}
					});
				}
				// Send the operations to the publisher
				this.executeOperations(function(err) {
					if(self.progressModal) {
						self.progressModal.closeHandler(self);
					}
					callback(err);
				});
			} else {
				return callback("Missing sitemap");
			}
		} else {
			return callback("Unrecognised publisher");
		}
	} else {
		return callback("Missing or disabled job tiddler");
	}
};

/*
Instantiate the required publisher object
*/
PublishingJob.prototype.getPublisher = function(publisherName) {
	var publisher;
	$tw.modules.forEachModuleOfType("publisher",function(title,module) {
		if(module.name === publisherName) {
			publisher = module;
		}
	});
	return publisher && publisher.create(this.jobTiddler.fields,this.publisherHandler,this);
};

/*
Extract the variables from tiddler fields prefixed "var-"
*/
PublishingJob.prototype.extractVariables = function(tiddler) {
	var variables = {};
	$tw.utils.each(tiddler.getFieldStrings(),function(value,name) {
		if(name.substring(0,4) === "var-") {
			variables[name.substring(4)] = value;
		}
	});
	return variables;
};

/*
Expand publish routes to separate operations
*/
PublishingJob.prototype.getOperationsForRoute = function(routeTiddler) {
	var self = this,
		operations = [],
		routeFilter = routeTiddler.fields["route-tiddler-filter"] || "DUMMY_RESULT", // If no filter is provided, use a dummy filter that returns a single result
		tiddlers = self.publisherHandler.wiki.filterTiddlers(routeFilter,null,self.publisherHandler.wiki.makeTiddlerIterator(this.exportList));
	if(routeFilter) {
		switch(routeTiddler.fields["route-type"]) {
			case "save":
				if(routeTiddler.fields["route-path-filter"]) {
					$tw.utils.each(tiddlers,function(title) {
						operations.push({
							"route-type": "save",
							path: self.resolvePathFilter(routeTiddler.fields["route-path-filter"],title),
							title: title
						});
					});
				}
				break;
			case "render":
				if(routeTiddler.fields["route-path-filter"] && routeTiddler.fields["route-template"]) {
					var routeVariables = $tw.utils.extend({},this.publishVariables,this.jobVariables,this.sitemapVariables,this.extractVariables(routeTiddler));
					$tw.utils.each(tiddlers,function(title) {
						operations.push({
							"route-type": "render",
							path: self.resolvePathFilter(routeTiddler.fields["route-path-filter"],title),
							title: title,
							template: routeTiddler.fields["route-template"],
							variables: routeVariables
						});
					});
				}
				break;
		}
	}
	return operations;
};

/*
Apply a tiddler to a filter to create a usable path
*/
PublishingJob.prototype.resolvePathFilter = function(pathFilter,title) {
	var tiddler = this.publisherHandler.wiki.getTiddler(title);
	return this.publisherHandler.wiki.filterTiddlers(pathFilter,{
		getVariable: function(name) {
			switch(name) {
				case "currentTiddler":
					return "" + this.imageSource;
				case "extension":
					return "" + ($tw.config.contentTypeInfo[tiddler.fields.type || "text/vnd.tiddlywiki"] || {extension: ""}).extension;
				default:
					return $tw.rootWidget.getVariable(name);
			}
		}
	},this.publisherHandler.wiki.makeTiddlerIterator([title]))[0];
};

/*
Execute the operations for this job
*/
PublishingJob.prototype.executeOperations = function(callback) {
	var self = this,
		report = {overwrites: []},
		nextOperation = 0,
		performNextOperation = function() {
			// Check for having been cancelled
			if(self.isCancelled) {
				if(self.publisher.publishCancel) {
					self.publisher.publishCancel();
				}
				return callback("CANCELLED");
			}
			// Update progress
			if(self.progressModal) {
				self.progressModal.setProgress(nextOperation,self.operations.length);
			}
			// Check for having finished
			if(nextOperation >= self.operations.length) {
				$tw.utils.nextTick(function() {
					self.publisher.publishEnd(callback);					
				});
			} else {
				// Execute this operation
				var fileDetails = self.prepareOperation(self.operations[nextOperation]);
				nextOperation += 1;
				self.publisher.publishFile(fileDetails,function() {
					$tw.utils.nextTick(performNextOperation);
				});
			}
		};
	// Tell the publisher to start, and get back an array of the existing paths
	self.publisher.publishStart(function(existingPaths) {
		var paths = {};
		$tw.utils.each(self.operations,function(operation) {
			if(operation.path in paths) {
				report.overwrites.push(operation.path);
			}
			paths[operation.path] = true;
		});
		// Run the operations
		performNextOperation();
	});
};

/*
Construct a file details object from an operation object
*/
PublishingJob.prototype.prepareOperation = function(operation) {
	var tiddler = this.publisherHandler.wiki.getTiddler(operation.title),
		fileDetails = {
			path: operation.path
		};
	switch(operation["route-type"]) {
		case "save":
			fileDetails.text = tiddler.fields.text || "";
			fileDetails.type = tiddler.fields.type || "";
			fileDetails.isBase64 = ($tw.config.contentTypeInfo[tiddler.fields.type] || {}).encoding  === "base64";
			break;
		case "render":
			fileDetails.text = this.publisherHandler.wiki.renderTiddler("text/plain",operation.template,{
				variables: $tw.utils.extend(
					{currentTiddler: operation.title},
					operation.variables
				)
			});
			fileDetails.type = "text/html";
			break;
	}
	return fileDetails;
};

PublishingJob.prototype.saveReport = function(report) {
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

exports.PublisherHandler = PublisherHandler;

})();
