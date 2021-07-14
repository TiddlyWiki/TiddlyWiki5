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
		// Get publisher
		this.publisher = this.getPublisher(this.jobTiddler.fields.publisher);
		if(this.publisher) {
			// Get the sitemap
			this.sitemap = new $tw.Sitemap(this.jobTiddler.fields.sitemap,{
				wiki: this.publisherHandler.wiki,
				variables: this.publishVariables
			});
			this.sitemap.load();
			// Get the output operations
			this.operations = this.sitemap.getAllFileDetails(this.exportList);
			// Display the progress modal
			if($tw.modal) {
				this.progressModal = $tw.modal.display(PUBLISHING_MODAL_TITLE,{
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
				var fileDetails = self.operations[nextOperation]();
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
