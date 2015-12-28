/*\
title: $:/core/modules/widgets/checklist.js
type: application/javascript
module-type: widget

The Checklist widget toggles (or exchanges) the specified item in the specified list

\*/
(function () {
    "use strict";
    //Initialise the widget
    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var ChecklistWidget = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };
    ChecklistWidget.prototype = new Widget();
    //Set the widget properties
    ChecklistWidget.prototype.render = function (parent, nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();
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
        $tw.utils.addEventListeners(this.inputDomNode, [{
            name: "change",
            handlerObject: this,
            handlerMethod: "handleChangeEvent"
        }]);
        parent.insertBefore(this.labelDomNode, nextSibling);
        this.renderChildren(this.spanDomNode, null);
        this.domNodes.push(this.labelDomNode);
    };
    //Repalcement for hasTag, for any field
    ChecklistWidget.prototype.hasItem = function (item, itemList) {
        var list = $tw.utils.parseStringArray(itemList);
        return list && list.indexOf(item) !== -1;
    };
    //Determine if checkbox state matches
    ChecklistWidget.prototype.getValue = function () {
        var tiddler = this.wiki.getTiddler(this.checklistTitle);
        if (tiddler && this.checklistItem) {
            var HasItem = this.hasItem(this.checklistItem, tiddler.fields[this.checklistField]);
            return (this.checklistInvert) ? !HasItem : HasItem;
        }
        return false;
    };
    ChecklistWidget.prototype.tagCheck = function (tiddler) {
        var hasTag = tiddler && this.hasItem(this.checklistItem, tiddler.fields[this.checklistField]),
            checked = this.inputDomNode.checked;
        return (this.checklistItem) ? (this.checklistInvert) ? (hasTag === checked) : (hasTag !== checked) : false;
    };
    //Execute on change
    ChecklistWidget.prototype.handleChangeEvent = function (event) {
        var tiddler = this.wiki.getTiddler(this.checklistTitle),
            fallbackFields = {
                text: ""
            },
            newFields = {
                title: this.checklistTitle
            },
            hasChanged = false;
        if (this.checklistItem && (!tiddler || this.tagCheck(tiddler))) {
            var array = tiddler ? $tw.utils.parseStringArray(tiddler.fields[this.checklistField] || []).slice(0) : [],
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
            newFields[this.checklistField] = $tw.utils.stringifyList(array);
            this.wiki.addTiddler(new $tw.Tiddler(tiddler, newFields));
        }
        if (hasChanged) {
            this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(), fallbackFields, tiddler, newFields, this.wiki.getModificationFields()));
        }
    };
    //Fetch the widget attributes
    ChecklistWidget.prototype.execute = function () {
        this.checklistTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
        this.checklistItem = this.getAttribute("item");
        this.checklistAlt = this.getAttribute("alt", "");
        this.checklistClass = this.getAttribute("class", "");
        this.checklistInvert = this.getAttribute("invert", "");
        this.checklistField = this.getAttribute("field", "tags");
        this.makeChildWidgets();
    };
    //Refresh the widget whenever attributes change
    ChecklistWidget.prototype.refresh = function (changedTiddlers) {
        var changedAttributes = this.computeAttributes();
        if (changedAttributes.tiddler || changedAttributes.item || changedAttributes.alt || changedAttributes.invert || changedAttributes.field || changedAttributes["class"]) {
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
