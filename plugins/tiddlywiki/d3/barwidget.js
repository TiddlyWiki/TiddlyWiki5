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

var d3 = require("$:/plugins/tiddlywiki/d3/d3.js").d3;

var BarWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

BarWidget.prototype.generate = function() {
	// Get the parameters
	this.data = this.renderer.getAttribute("data");
	this.grouped = this.renderer.getAttribute("grouped","no");
	// Set the return element
	this.tag = "div";
	this.attributes = {
		"class": "tw-barwidget"
	};
};

BarWidget.prototype.postRenderInDom = function() {
	this.updateChart = this.createChart();
};

BarWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Reexecute the widget if the data reference attributes have changed
	if(changedAttributes.data || changedTiddlers[this.data]) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else if(changedAttributes.grouped) {
		// Update the chart if the grouping setting has changed
		this.grouped = this.renderer.getAttribute("grouped","no");
		if(this.updateChart) {
			this.updateChart();
		}
	}
};


BarWidget.prototype.createChart = function() {

	var n,m,stack,layers;

	// Get the data we're plotting
	var data = this.renderer.renderTree.wiki.getTiddlerData(this.data);
	if(data) {
		n = data.layers;
		m = data.samples;
		layers = data.data;
	} else {
		n = 4; // number of layers
		m = 58; // number of samples per layer
		stack = d3.layout.stack();
		layers = stack(d3.range(n).map(function() { return bumpLayer(m, .1); }));
	}

	var yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
		yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

	var margin = {top: 40, right: 10, bottom: 20, left: 10},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.domain(d3.range(m))
		.rangeRoundBands([0, width], .08);

	var y = d3.scale.linear()
		.domain([0, yStackMax])
		.range([height, 0]);

	var color = d3.scale.linear()
		.domain([0, n - 1])
		.range(["#aad", "#556"]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.tickSize(0)
		.tickPadding(6)
		.orient("bottom");

	var svg = d3.select(this.renderer.domNode).append("svg")
		.attr("viewBox", "0 0 960 500")
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var layer = svg.selectAll(".layer")
		.data(layers)
	  .enter().append("g")
		.attr("class", "layer")
		.style("fill", function(d, i) { return color(i); });

	var rect = layer.selectAll("rect")
		.data(function(d) { return d; })
	  .enter().append("rect")
		.attr("x", function(d) { return x(d.x); })
		.attr("y", height)
		.attr("width", x.rangeBand())
		.attr("height", 0);

	rect.transition()
		.delay(function(d, i) { return i * 10; })
		.attr("y", function(d) { return y(d.y0 + d.y); })
		.attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	var self = this,
		updateChart = function() {
	  if (self.grouped !== "no") {
		transitionGrouped();
	  } else {
		transitionStacked();
	  }
	};
	// Update the chart according to the grouped setting
	updateChart();
	// Return the update function
	return updateChart;

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
		var x = 1 / (.1 + Math.random()),
			y = 2 * Math.random() - .5,
			z = 10 / (.1 + Math.random());
		for (var i = 0; i < n; i++) {
		  var w = (i / n - y) * z;
		  a[i] += x * Math.exp(-w * w);
		}
	  }

	  var a = [], i;
	  for (i = 0; i < n; ++i) a[i] = o + o * Math.random();
	  for (i = 0; i < 5; ++i) bump(a);
	  return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
	}

};

exports.d3bar = BarWidget;

})();
