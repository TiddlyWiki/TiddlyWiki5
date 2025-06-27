/*\
title: $:/core/modules/widgets/dataitemjs
type: application/javascript
module-type: widget

Widget to dynamically represent a virtual tiddler

\*/

(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    
    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    
    var DataItemWidget = function(parseTreeNode,options) {
        this.initialise(parseTreeNode,options);
    };
    
    /*
    Inherit from the base widget class
    */
    DataItemWidget.prototype = new Widget();
    
    /*
    Render this widget into the DOM
    */
    DataItemWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.tiddler = this.computeDataTiddlerValues()
        this.execute();
        this.renderChildren(parent, nextSibling);
    
    };
    
    /*
    Compute the internal state of the widget for rendering    
    */
    DataItemWidget.prototype.execute = function() {
        var text = this.tiddler.fields.text,
            type = this.tiddler.fields.parseType || "text/vnd.tiddlywiki",
            parser = this.wiki.parseText(type,text,{defaultType: "text/plain"});
    
        if(!this.tiddler.fields.renderType) {
            this.makeChildWidgets(parser.tree);
        }else{
            // Otherwise, render to the rendertype and return in a <PRE> tag
            var widgetNode = this.wiki.makeWidget(parser),
                container = $tw.fakeDocument.createElement("div");
    
            widgetNode.render(container,null);
            text = this.tiddler.fields.renderType === "text/html" ? container.innerHTML : container.textContent;
    
            this.makeChildWidgets([{ type: "element", tag: "pre", children: [{ type: "text",text: text}] }]);
        
        }
    };
    
    /*
    Read the tiddler value(s)
    
    TODO - Test for Object.keys(item).length > 0
    */
    DataItemWidget.prototype.computeDataTiddlerValues = function(){
        this.title = this.getAttribute("$tiddler");
    
        // Read any attributes not prefixed with $
        var item = Object.create(null);
        $tw.utils.each(this.attributes,function(value,name) {
            if(name.charAt(0) !== "$") {
                item[name] = value;	
            }
        });
    
        if(this.title) {
            var tiddler = this.wiki.getTiddler(this.title);
            return new $tw.Tiddler(tiddler,item);
        } else {
            return new $tw.Tiddler(item);
        }
    };
    
    DataItemWidget.prototype.refresh = function(changedTiddlers) {
        // Regenerate and rerender the widget and
        // replace the existing DOM node
        this.refreshSelf();
        return true;
    };
    
    exports.dataitem = DataItemWidget;
    
    })();

