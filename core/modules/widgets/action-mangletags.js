/*\
title: $:/core/modules/widgets/action-mangletags.js
type: application/javascript
module-type: widget

Action widget to manipulate the tags of a tiddler.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  var Widget = require("$:/core/modules/widgets/widget.js").widget;

  var MangleTagsWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };

  /*
  Inherit from the base widget class
  */
  MangleTagsWidget.prototype = new Widget();

  /*
  Render this widget into the DOM
  */
  MangleTagsWidget.prototype.render = function (parent, nextSibling) {
    this.computeAttributes();
    this.execute();
  };

  /*
  Compute the internal state of the widget
  */
  MangleTagsWidget.prototype.execute = function () {
    // Get our parameters
    this.targetTiddler = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
    this.addTag = this.getAttribute("$add");
    this.removeTag = this.getAttribute("$remove");
  };

  /*
  Refresh the widget by ensuring our attributes are up to date
  */
  MangleTagsWidget.prototype.refresh = function (changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if (changedAttributes.$tiddler || changedAttributes.$add || changedAttributes.$remove) {
      this.refreshSelf();
      return true;
    }
    return this.refreshChildren(changedTiddlers);
  };

  /*
  Invoke the action associated with this widget
  */
  MangleTagsWidget.prototype.invokeAction = function (triggeringWidget, event) {
    // Get the target tiddler //
    var tiddler = this.wiki.getTiddler(this.targetTiddler);
    var tag = (this.addTag || "").trim();
    var modification = this.wiki.getModificationFields();
    modification.tags = (tiddler.fields.tags || []).slice(0);
    // If there is a remove= attribute -- find the tag and unconditionally remove it
    if (tiddler.fields.tags && this.removeTag) {
      var p = tiddler.fields.tags.indexOf(this.removeTag);
      if (p !== -1) {
        modification.tags.splice(p, 1);
        // If there is also an add= attribute -- replace the tag 
        if (tag !== "") {
          $tw.utils.pushTop(modification.tags, tag);
        }
      }
      // Else if there is an add= attribute only -- unconditionally add the tag
    } else {
      if (tag !== "") {
        $tw.utils.pushTop(modification.tags, tag);
      }
    }
    this.wiki.addTiddler(new $tw.Tiddler(tiddler, modification));
  };

  exports["action-mangletags"] = MangleTagsWidget;

})();
