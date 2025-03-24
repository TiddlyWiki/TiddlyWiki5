/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/menu.js
type: application/javascript
module-type: library

\*/

"use strict";

var {
  wrapItem,
  blockTypeItem,
  Dropdown,
  DropdownSubmenu,
  joinUpItem,
  liftItem,
  selectParentNodeItem,
  undoItem,
  redoItem,
  icons,
  MenuItem,
  MenuElement
} = require("prosemirror-menu");
var { NodeSelection, EditorState } = require("prosemirror-state");
var { Schema, NodeType, MarkType } = require("prosemirror-model");
var { toggleMark } = require("prosemirror-commands");
var { wrapInList } = require("prosemirror-flat-list");
var { TextField, openPrompt } = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js");

function canInsert(state, nodeType) {
  var $from = state.selection.$from;
  for (var d = $from.depth; d >= 0; d--) {
    var index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
  }
  return false;
}

function insertImageItem(nodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    enable: function(state) { return canInsert(state, nodeType); },
    run: function(state, _, view) {
      var from = state.selection.from, to = state.selection.to, attrs = null;
      if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
        attrs = state.selection.node.attrs;
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({label: "Location", required: true, value: attrs && attrs.src}),
          title: new TextField({label: "Title", value: attrs && attrs.title}),
          alt: new TextField({label: "Description", value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")})
        },
        callback: function(attrs) {
          view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
          view.focus();
        }
      });
    }
  });
}

function cmdItem(cmd, options) {
  var passedOptions = {
    label: options.title,
    run: cmd
  };
  for (var prop in options) passedOptions[prop] = options[prop];
  if (!options.enable && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = function(state) { return cmd(state); };

  return new MenuItem(passedOptions);
}

function markActive(state, type) {
  var from = state.selection.from, $from = state.selection.$from, to = state.selection.to, empty = state.selection.empty;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
  else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
  var passedOptions = {
    active: function(state) { return markActive(state, markType); }
  };
  for (var prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

function linkItem(markType) {
  return new MenuItem({
    title: "Add or remove link",
    icon: icons.link,
    active: function(state) { return markActive(state, markType); },
    enable: function(state) { return !state.selection.empty; },
    run: function(state, dispatch, view) {
      if (markActive(state, markType)) {
        toggleMark(markType)(state, dispatch);
        return true;
      }
      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({label: "Link target", required: true}),
          title: new TextField({label: "Title"})
        },
        callback: function(attrs) {
          toggleMark(markType, attrs)(view.state, view.dispatch);
          view.focus();
        }
      });
    }
  });
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options);
}

function buildMenuItems(schema) {
  var r = {};
  var mark;
  if (mark = schema.marks.strong)
    r.toggleStrong = markItem(mark, {title: "Toggle strong style", icon: icons.strong});
  if (mark = schema.marks.em)
    r.toggleEm = markItem(mark, {title: "Toggle emphasis", icon: icons.em});
  if (mark = schema.marks.code)
    r.toggleCode = markItem(mark, {title: "Toggle code font", icon: icons.code});
  if (mark = schema.marks.link)
    r.toggleLink = linkItem(mark);

  var node;
  if (node = schema.nodes.image)
    r.insertImage = insertImageItem(node);
  if (node = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(node, {title: "Wrap in bullet list", icon: icons.bulletList});
  if (node = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(node, {title: "Wrap in ordered list", icon: icons.orderedList});
  if (node = schema.nodes.blockquote)
    r.wrapBlockQuote = wrapItem(node, {title: "Wrap in block quote", icon: icons.blockquote});
  if (node = schema.nodes.paragraph)
    r.makeParagraph = blockTypeItem(node, {title: "Change to paragraph", label: "Plain"});
  if (node = schema.nodes.code_block)
    r.makeCodeBlock = blockTypeItem(node, {title: "Change to code block", label: "Code"});
  if (node = schema.nodes.heading)
    for (var i = 1; i <= 10; i++)
      r["makeHead" + i] = blockTypeItem(node, {title: "Change to heading " + i, label: "Level " + i, attrs: {level: i}});
  if (node = schema.nodes.horizontal_rule) {
    var hr = node;
    r.insertHorizontalRule = new MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      enable: function(state) { return canInsert(state, hr); },
      run: function(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())); }
    });
  }

  var cut = function(arr) { return arr.filter(function(x) { return x; }); };
  r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"});
  r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
    r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
  ]), {label: "Heading"})]), {label: "Type..."});

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
  r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, liftItem, selectParentNodeItem])];
  r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);

  return r;
}

exports.buildMenuItems = buildMenuItems;
