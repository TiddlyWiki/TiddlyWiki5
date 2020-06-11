/*\
title: $:/core/modules/widgets/compress.js
type: application/javascript
module-type: widget

Compress widget

\*/
;(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  'use strict'

  var Widget = require('$:/core/modules/widgets/widget.js').widget

  var CompressWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode,options);
  }

  /*
   * Inherit from the base widget class
   */
  CompressWidget.prototype = new Widget()

  /*
   * Render this widget into the DOM
   */
  CompressWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    var textNode = this.document.createTextNode(this.compressedText);
    parent.insertBefore(textNode, nextSibling);
    this.domNodes.push(textNode);
  }

  /*
   * Compute the internal state of the widget
   */
  CompressWidget.prototype.execute = function() {
    // Get parameters from our attributes
    this.filter = this.getAttribute("filter","[!is[system]]");
    // Compress the filtered tiddlers
    var tiddlers = this.wiki.filterTiddlers(this.filter);
    var json = {};
    var self = this;
    $tw.utils.each(tiddlers,function(title) {
      var tiddler = self.wiki.getTiddler(title);
      var jsonTiddler = {};
      for (var f in tiddler.fields) {
        jsonTiddler[f] = tiddler.getFieldString(f);
      }
      json[title] = jsonTiddler;
    });
    this.compressedText = $tw.compress.deflate(JSON.stringify(json));
    var tiddler = $tw.wiki.getTiddler("$:/isEncrypted");
    if(tiddler !== undefined && tiddler !== null && tiddler.fields.text === "yes") {
      this.compressedText = $tw.crypto.encrypt(this.compressedText)
    }
  }

  /*
   * Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
   */
  CompressWidget.prototype.refresh = function (changedTiddlers) {
    // We don't need to worry about refreshing because the compress widget isn't for interactive use
    return false;
  }

  exports.compress = CompressWidget
})();
