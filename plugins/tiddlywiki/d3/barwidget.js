/*\
title: $:/plugins/tiddlywiki/d3/barwidget.js
type: application/javascript
module-type: widget

A widget for displaying stacked or grouped bar charts. Derived from http://bl.ocks.org/mbostock/3943967

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	d3 = require("$:/plugins/tiddlywiki/d3/d3.js").d3;

var BarWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
BarWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BarWidget.prototype.render = function(parent,nextSibling) {
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

BarWidget.prototype.createChart = function(parent,nextSibling) {
	// Get the data we're plotting
	var data = this.wiki.getTiddlerData(this.barData),
		n,m,stack,layers;
	if(data) {
		n = data.layers;
		m = data.samples;
		layers = data.data;
	} else { // Use randomly generated data if we don't have any
		n = 4; // number of layers
		m = 58; // number of samples per layer
		stack = d3.layout.stack();
		layers = stack(d3.range(n).map(function() { return bumpLayer(m, 0.1); }));
	}
	// Calculate the maximum data values
	var yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
		yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });
	// Calculate margins and width and height
	var margin = {top: 40, right: 10, bottom: 20, left: 10},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;
	// x-scale
	var x = d3.scale.ordinal()
		.domain(d3.range(m))
		.rangeRoundBands([0, width], 0.08);
	// y-scale
	var y = d3.scale.linear()
		.domain([0, yStackMax])
		.range([height, 0]);
	// Array of colour values
	var color = d3.scale.linear()
		.domain([0, n - 1])
		.range(["#aad", "#556"]);
	// x-axis
	var xAxis = d3.svg.axis()
		.scale(x)
		.tickSize(0)
		.tickPadding(6)
		.orient("bottom");
	// Create SVG element
	var svgElement = d3.select(parent).insert("svg",function() {return nextSibling;})
		.attr("viewBox", "0 0 960 500")
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);
	// Create main group
	var mainGroup = svgElement.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	// Create the layers
	var layer = mainGroup.selectAll(".layer")
		.data(layers)
	.enter().append("g")
		.attr("class", "layer")
		.style("fill", function(d, i) { return color(i); });
	// Create the rectangles in each layer
	var rect = layer.selectAll("rect")
		.data(function(d) { return d; })
	.enter().append("rect")
		.attr("x", function(d) { return x(d.x); })
		.attr("y", height)
		.attr("width", x.rangeBand())
		.attr("height", 0);
	// Transition the rectangles to their final height
	rect.transition()
		.delay(function(d, i) { return i * 10; })
		.attr("y", function(d) { return y(d.y0 + d.y); })
		.attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });
	// Add to the DOM
	mainGroup.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	var self = this;
	// Return the svg node
	return {
		domNode: svgElement[0][0],
		updateChart: function() {
			if(self.barGrouped !== "no") {
				transitionGrouped();
			} else {
				transitionStacked();
			}
		}
	};

	function transitionGrouped() {
		y.domain([0, yGroupMax]);
		rect.transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
			.attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
			.attr("width", x.rangeBand() / n)
			.transition()
			.attr("y", function(d) { return y(d.y); })
			.attr("height", function(d) { return height - y(d.y); });
	}

	function transitionStacked() {
		y.domain([0, yStackMax]);
		rect.transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
			.attr("y", function(d) { return y(d.y0 + d.y); })
			.attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
			.transition()
			.attr("x", function(d) { return x(d.x); })
			.attr("width", x.rangeBand());
	}

	// Inspired by Lee Byron's test data generator.
	function bumpLayer(n, o) {
		function bump(a) {
			var x = 1 / (0.1 + Math.random()),
				y = 2 * Math.random() - 0.5,
				z = 10 / (0.1 + Math.random());
			for(var i = 0; i < n; i++) {
			var w = (i / n - y) * z;
			a[i] += x * Math.exp(-w * w);
			}
		}
		var a = [], i;
		for(i = 0; i < n; ++i) a[i] = o + o * Math.random();
		for(i = 0; i < 5; ++i) bump(a);
		return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
	}
};

/*
Compute the internal state of the widget
*/
BarWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.barData = this.getAttribute("data");
	this.barGrouped = this.getAttribute("grouped","no");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BarWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.data || changedTiddlers[this.barData]) {
		this.refreshSelf();
		return true;
	} else if(changedAttributes.grouped) {
		this.execute();
		if(this.updateChart) {
			this.updateChart();
		}
		return true;
	}
	return false;
};

exports.d3bar = BarWidget;

})();
