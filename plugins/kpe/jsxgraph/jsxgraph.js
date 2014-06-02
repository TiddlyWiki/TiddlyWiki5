/*\
title: $:/plugins/kpe/jsxgraph/jsxgraph.js
type: application/javascript
module-type: widget

Creates a JSXGraph widget

\*/

(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var Widget = require("$:/core/modules/widgets/widget.js").widget;

    var JSXGraphWidget = function(parseTreeNode,options) {
        this.initialise(parseTreeNode,options);
    };

    /*
     Inherit from the base widget class
     */
    JSXGraphWidget.prototype = new Widget();

    /*
     Render this widget into the DOM
     */
    JSXGraphWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();

        var height = this.getAttribute('height','500px');
        var width = this.getAttribute('width','500px');
        var id = this.getAttribute('id','jxgbox');
        var script = this.parseTreeNode.children[0].text;

        var divNode = this.document.createElement('div');
        divNode.setAttribute('class', 'jxgbox');
        divNode.setAttribute('style', 'height:'+height+';width:'+width);
        divNode.setAttribute('id', id);

        var scriptNode = this.document.createElement('script');
        scriptNode.appendChild(this.document.createTextNode(script));

        parent.insertBefore(divNode, nextSibling);
        parent.insertBefore(scriptNode, nextSibling);
        this.domNodes.push(divNode);
        this.domNodes.push(scriptNode);
    };

    /*
     Compute the internal state of the widget
     */
    JSXGraphWidget.prototype.execute = function() {
        // Nothing to do for a text node
    };

    /*
     Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
     */
    JSXGraphWidget.prototype.refresh = function(changedTiddlers) {
        return false;
    };

    exports.jsxgraph = JSXGraphWidget;

})();

