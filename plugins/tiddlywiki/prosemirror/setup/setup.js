/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/setup.js
type: application/javascript
module-type: library

\*/

"use strict";

var { keymap } = require("prosemirror-keymap");
var { history } = require("prosemirror-history");
var { baseKeymap } = require("prosemirror-commands");
var { Plugin } = require("prosemirror-state");
var { dropCursor } = require("prosemirror-dropcursor");
var { gapCursor } = require("prosemirror-gapcursor");
var { menuBar } = require("prosemirror-menu");
var { Schema } = require("prosemirror-model");

var { buildMenuItems } = require("$:/plugins/tiddlywiki/prosemirror/setup/menu.js");
var { buildKeymap } = require("$:/plugins/tiddlywiki/prosemirror/setup/keymap.js");
var { buildInputRules } = require("$:/plugins/tiddlywiki/prosemirror/setup/inputrules.js");

exports.buildMenuItems = buildMenuItems;
exports.buildKeymap = buildKeymap;
exports.buildInputRules = buildInputRules;

function exampleSetup(options) {
  var plugins = [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor()
  ];
  if (options.menuBar !== false)
    plugins.push(menuBar({ floating: options.floatingMenu !== false, content: options.menuContent || buildMenuItems(options.schema).fullMenu }));
  if (options.history !== false)
    plugins.push(history());

  return plugins.concat(new Plugin({
    props: {
      attributes: { class: "ProseMirror-example-setup-style" }
    }
  }));
}

exports.exampleSetup = exampleSetup;
