/*\
title: $:/plugins/tiddlywiki/d3/cloudwidget.js
type: application/javascript
module-type: widget

A widget for displaying word clouds. Derived from https://github.com/jasondavies/d3-cloud

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var d3 = require("$:/plugins/tiddlywiki/d3/d3.js").d3;

if($tw.browser) {
	// Frightful hack to give the cloud plugin the global d3 variable it needs
	window.d3 = d3;
	d3.layout.cloud  = require("$:/plugins/tiddlywiki/d3/d3.layout.cloud.js").cloud;
}

var CloudWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

CloudWidget.prototype.generate = function() {
	// Get the parameters
	this.data = this.renderer.getAttribute("data");
	this.spiral = this.renderer.getAttribute("spiral","archimedean");
	// Set the return element
	this.tag = "div";
	this.attributes = {
		"class": "tw-cloudwidget"
	};
};

CloudWidget.prototype.postRenderInDom = function() {
	this.updateChart = this.createChart();
};

CloudWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Reexecute the widget if the data reference attributes have changed
	if(changedAttributes.data || changedTiddlers[this.data]) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else if(changedAttributes.spiral) {
		// Update the chart if the spiral setting has changed
		this.spiral = this.renderer.getAttribute("spiral","archimedean");
		if(this.updateChart) {
			this.updateChart();
		}
	}
};

CloudWidget.prototype.createChart = function() {

	var self = this;

	var domNode = this.renderer.domNode;

	  var fill = d3.scale.category20();


	var data = this.renderer.renderTree.wiki.getTiddlerData(this.data);

	if(!data) {
		// Use dummy data if none provided
		data = "This word cloud does not have any data in it".split(" ").map(function(d) {
        return {text: d, size: 10 + Math.random() * 90};
      })
	}

  var svg = d3.select(domNode).append("svg")
        .attr("width", 600)
        .attr("height", 400)
      .append("g")
        .attr("transform", "translate(300,200)");

  var layout = d3.layout.cloud().size([600, 400])
      .words(data)
      .padding(5)
      .rotate(function() { return ~~(Math.random() * 5) * 30 - 60; })
      .font("Impact")
      .fontSize(function(d) { return d.size*2; })
      .on("end", draw)
      .start();

  function draw(words) {
    svg.selectAll("text")
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

  return updateChart;

};

exports.d3cloud = CloudWidget;

})();
