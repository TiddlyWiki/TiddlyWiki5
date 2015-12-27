/*\
title: $:/core/modules/widgets/checklist.js
type: application/javascript
module-type: widget

checklist widget

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var ChecklistWidget = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };
    ChecklistWidget.prototype = new Widget();

    /*
    Render this widget into the DOM
    */
    ChecklistWidget.prototype.render = function (parent, nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();
        // Create our elements
        this.labelDomNode = this.document.createElement("label");
        this.labelDomNode.setAttribute("class", this.checkboxClass);
        this.inputDomNode = this.document.createElement("input");
        this.inputDomNode.setAttribute("type", "checkbox");
        if (this.getValue()) {
            this.inputDomNode.setAttribute("checked", "true");
        }
        this.labelDomNode.appendChild(this.inputDomNode);
        this.spanDomNode = this.document.createElement("span");
        this.labelDomNode.appendChild(this.spanDomNode);
        // Add a click event handler
        $tw.utils.addEventListeners(this.inputDomNode, [{
            name: "change",
            handlerObject: this,
            handlerMethod: "handleChangeEvent"
        }]);
        // Insert the label into the DOM and render any children
        parent.insertBefore(this.labelDomNode, nextSibling);
        this.renderChildren(this.spanDomNode, null);
        this.domNodes.push(this.labelDomNode);
    };

    //Replacement for hasTag() to handle any field
    ChecklistWidget.prototype.hasItem = function (item, itemList) {
        var list = $tw.utils.parseStringArray(itemList);
        return list && list.indexOf(item) !== -1;
    };

    //Determines if the list contains the item
    ChecklistWidget.prototype.getValue = function () {
        var tiddler = this.wiki.getTiddler(this.checklistTitle);
        if (tiddler && this.checklistItem) {
            var HasItem = this.hasItem(this.checklistItem, tiddler.fields[this.checklistList]);
            if (this.checklistInvert) {
                return !HasItem;
            } else {
                return HasItem;
            }
        }
        return false;
    };

    //Determines if checkbox states match
    ChecklistWidget.prototype.tagCheck = function (tiddler) {
        var hasTag = tiddler && this.hasItem(this.checklistItem, tiddler.fields[this.checklistList]),
            checked = this.inputDomNode.checked;
        if (this.checklistItem && this.checklistInvert) {
            return hasTag === checked;
        } else if (this.checklistItem) {
            return hasTag !== checked;
        }
        return false;
    };

    ChecklistWidget.prototype.handleChangeEvent = function (event) {
        var tiddler = this.wiki.getTiddler(this.checklistTitle),
            fallbackFields = {
                text: ""
            },
            newFields = {
                title: this.checklistTitle
            },
            hasChanged = false;
        // Set the tag if specified
        if (this.checklistItem && (!tiddler || this.tagCheck(tiddler))) {
            var array = tiddler ? $tw.utils.parseStringArray(tiddler.fields[this.checklistList] || []).slice(0) : [],
                pos = array.indexOf(this.checklistItem),
                altpos = array.indexOf(this.checklistAlt),
                checked = this.inputDomNode.checked;
            if (this.checklistAlt === "") {
                if (pos !== -1) {
                    array.splice(pos, 1);
                }
                if (this.checklistInvert && !checked) {
                    array.push(this.checklistItem);
                } else if (!this.checklistInvert && checked) {
                    array.push(this.checklistItem);
                }
            } else {
                if (pos !== -1) {
                    array[pos] = this.checklistAlt;
                } else if (altpos !== -1) {
                    array[altpos] = this.checklistItem;
                } else {
                    array.push(this.checklistItem);
                }
            }
            newFields[this.checklistList] = $tw.utils.stringifyList(array);
            this.wiki.addTiddler(new $tw.Tiddler(tiddler, newFields));
            //hasChanged = true;
        }
        if (hasChanged) {
            this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(), fallbackFields, tiddler, newFields, this.wiki.getModificationFields()));
        }
    };

    /*
    Compute the internal state of the widget
    */
    ChecklistWidget.prototype.execute = function () {
        // Get the parameters from the attributes
        this.checklistTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
        this.checklistItem = this.getAttribute("item");
        this.checklistAlt = this.getAttribute("alt", "");
        this.checklistClass = this.getAttribute("class", "");
        if (this.getAttribute("invert") === "yes" || this.getAttribute("invert", "") === "true") {
            this.checklistInvert = true;
        }
        if (this.hasAttribute("list")) {
            this.checklistList = this.getAttribute("list");
        } else {
            this.checklistList = this.getAttribute("field", "tags");
        }
        // Make the child widgets
        this.makeChildWidgets();
    };

    /*
    Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
    */
    ChecklistWidget.prototype.refresh = function (changedTiddlers) {
        var changedAttributes = this.computeAttributes();
        if (changedAttributes.tiddler || changedAttributes.item || changedAttributes.alt || changedAttributes.invert || changedAttributes.list || changedAttributes["class"]) {
            this.refreshSelf();
            return true;
        } else {
            var refreshed = false;
            if (changedTiddlers[this.checklistTitle]) {
                this.inputDomNode.checked = this.getValue();
                refreshed = true;
            }
            return this.refreshChildren(changedTiddlers) || refreshed;
        }
    };

    exports.checklist = ChecklistWidget;

})();
