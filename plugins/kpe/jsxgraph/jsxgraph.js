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

    var uniqueID = 1;

    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var JXG = require("$:/plugins/kpe/jsxgraph/lib/jsxgraphcore.js");

    var JSXGraphWidget = function(parseTreeNode,options) {
        this.initialise(parseTreeNode,options);
    };

    /*
     Inherit from the base widget class
     */
    JSXGraphWidget.prototype = new Widget();

    /**
     * Intercepts the call to JSXGraph.initBoard() for replacing the first parameter.
     * @param {string} boardNodeID id of the the HTMLElement to rendered the JSXGraph into
     * @param {string} jxgScriptBody the script content
     * @returns {JXG.Board} the rendered JSXGraph board
     */
    JSXGraphWidget.prototype.processJXGScript = function(boardNodeID, jxgScriptBody){
        var result = null;
        var initBoardBackup;
        try{
            var doc = this.document;

            initBoardBackup = JXG.JSXGraph.initBoard;
            JXG.JSXGraph.initBoard = function(box, attributes){
                if(result != null) {
                    throw new Error("Only board per jsxgraph widget is supported!");
                }

                if($tw.fakeDocument === doc) {
                    boardNodeID = null;
                    attributes.document = {};
                    JXG.merge(JXG.Options, {renderer:'no'});
                    attributes.renderer = 'no';
                }

                result = initBoardBackup.call(this, boardNodeID, attributes);
                return result;
            };
            var jxgScript = new Function("JXG", jxgScriptBody);
            jxgScript.call(null, JXG);
        } finally {
            JXG.JSXGraph.initBoard = initBoardBackup;
        }
        return result;
    };


    /*
     Render this widget into the DOM
     */
    JSXGraphWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();

        var height = this.getAttribute("height", "500px");
        var width = this.getAttribute("width", "500px");
        var scriptBody = this.parseTreeNode.children[0].text;

        var divNode = this.document.createElement("div");
        divNode.setAttribute("class", "jxgbox");
        divNode.setAttribute("style", "height:" + height + ";width:" + width);
        divNode.setAttribute("id", "jxgbox_" + uniqueID++);

        parent.insertBefore(divNode, nextSibling);
        this.domNodes.push(divNode);

        var board = this.processJXGScript(divNode.id, scriptBody);
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

