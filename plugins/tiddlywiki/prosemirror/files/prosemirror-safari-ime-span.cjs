"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  imeSpan: () => imeSpan
});
module.exports = __toCommonJS(src_exports);
var import_prosemirror_state = require("prosemirror-state");
var import_prosemirror_view = require("prosemirror-view");

// src/browser.ts
var nav = typeof navigator != "undefined" ? navigator : null;
var agent = nav && nav.userAgent || "";
var ie_edge = /Edge\/(\d+)/.exec(agent);
var ie_upto10 = /MSIE \d/.exec(agent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
var ie = !!(ie_upto10 || ie_11up || ie_edge);
var safari = !ie && !!nav && /Apple Computer/.test(nav.vendor);

// src/index.ts
var key = new import_prosemirror_state.PluginKey("safari-ime-span");
var isComposing = false;
var spec = {
  key,
  props: {
    decorations: createDecorations,
    handleDOMEvents: {
      compositionstart: () => {
        isComposing = true;
      },
      compositionend: () => {
        isComposing = false;
      }
    }
  }
};
function createDecorations(state) {
  const { $from, $to, to } = state.selection;
  if (isComposing && $from.sameParent($to)) {
    const deco = import_prosemirror_view.Decoration.widget(to, createSpan, {
      ignoreSelection: true,
      key: "safari-ime-span"
    });
    return import_prosemirror_view.DecorationSet.create(state.doc, [deco]);
  }
}
function createSpan(view) {
  const span = view.dom.ownerDocument.createElement("span");
  span.className = "ProseMirror-safari-ime-span";
  return span;
}
var imeSpan = new import_prosemirror_state.Plugin(safari ? spec : { key });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  imeSpan
});
