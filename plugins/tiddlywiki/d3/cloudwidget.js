/*\
title: $:/plugins/tiddlywiki/d3/cloudwidget.js
type: application/javascript
module-type: new_widget

A widget for displaying word clouds. Derived from https://github.com/jasondavies/d3-cloud

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget,
	d3 = require("$:/plugins/tiddlywiki/d3/d3.js").d3;

if($tw.browser) {
	// Frightful hack to give the cloud plugin the global d3 variable it needs
	window.d3 = d3;
	d3.layout.cloud  = require("$:/plugins/tiddlywiki/d3/d3.layout.cloud.js").cloud;
}

var CloudWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CloudWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CloudWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create the chart
	var chart = this.createChart(parent,nextSibling);
	this.updateChart = chart.updateChart;
	if(this.updateChart) {
		this.updateChart();
	}
	// Insert the chart into the DOM and render any children
	parent.insertBefore(chart.domNode,nextSibling);
	this.domNodes.push(chart.domNode);
};

CloudWidget.prototype.createChart = function(parent,nextSibling) {
	var self = this,
		fill = d3.scale.category20(),
		data = this.wiki.getTiddlerData(this.cloudData);
	// Use dummy data if none provided
	if(!data) {
		data = "This word cloud does not have any data in it".split(" ").map(function(d) {
			return {text: d, size: 10 + Math.random() * 90};
		});
	}
	// Create the svg element
	var svgElement = d3.select(parent).insert("svg",nextSibling)
		.attr("width", 600)
		.attr("height", 400);
	// Create the main group
	var mainGroup = svgElement
		.append("g")
		.attr("transform", "translate(300,200)");
	// Create the layout
	var layout = d3.layout.cloud().size([600, 400])
		.words(data)
		.padding(5)
		.rotate(function() { return ~~(Math.random() * 5) * 30 - 60; })
		.font("Impact")
		.fontSize(function(d) { return d.size*2; })
		.on("end", draw)
		.start();
	// Function to draw all the words
	function draw(words) {
		mainGroup.selectAll("text")
			.data(words)
			.enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("font-family", "Impact")
			.style("fill", function(d, i) { return fill(i); })
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
	}
	function updateChart() {
		layout.spiral(self.spiral);
	}
	return {
		domNode: svgElement[0][0],
		updateChart: updateChart
	};
};

/*
Compute the internal state of the widget
*/
CloudWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.cloudData = this.getAttribute("data");
	this.cloudSpiral = this.getAttribute("spiral","archimedean");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CloudWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.data || changedTiddlers[this.cloudData]) {
		this.refreshSelf();
		return true;
	} else if(changedAttributes.spiral) {
		this.execute();
		if(this.updateChart) {
			this.updateChart();
		}
		return true;
	}
	return false;
};

/*
Remove any DOM nodes created by this widget or its children
*/
CloudWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.d3cloud = CloudWidget;

})();
