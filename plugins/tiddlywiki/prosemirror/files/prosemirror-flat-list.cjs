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
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ListDOMSerializer: () => ListDOMSerializer,
  backspaceCommand: () => backspaceCommand,
  createDedentListCommand: () => createDedentListCommand,
  createIndentListCommand: () => createIndentListCommand,
  createListClipboardPlugin: () => createListClipboardPlugin,
  createListEventPlugin: () => createListEventPlugin,
  createListNodeView: () => createListNodeView,
  createListPlugins: () => createListPlugins,
  createListRenderingPlugin: () => createListRenderingPlugin,
  createListSpec: () => createListSpec,
  createMoveListCommand: () => createMoveListCommand,
  createParseDomRules: () => createParseDomRules,
  createSafariInputMethodWorkaroundPlugin: () => createSafariInputMethodWorkaroundPlugin,
  createSplitListCommand: () => createSplitListCommand,
  createToggleCollapsedCommand: () => createToggleCollapsedCommand,
  createToggleListCommand: () => createToggleListCommand,
  createUnwrapListCommand: () => createUnwrapListCommand,
  createWrapInListCommand: () => createWrapInListCommand,
  defaultAttributesGetter: () => defaultAttributesGetter,
  defaultListClickHandler: () => defaultListClickHandler,
  defaultMarkerGetter: () => defaultMarkerGetter,
  deleteCommand: () => deleteCommand,
  doSplitList: () => doSplitList,
  enterCommand: () => enterCommand,
  enterWithoutLift: () => enterWithoutLift,
  findListsRange: () => findListsRange,
  flatListGroup: () => flatListGroup,
  getListType: () => getListType,
  handleListMarkerMouseDown: () => handleListMarkerMouseDown,
  isCollapsedListNode: () => isCollapsedListNode,
  isListNode: () => isListNode,
  isListType: () => isListType,
  isListsRange: () => isListsRange,
  joinCollapsedListBackward: () => joinCollapsedListBackward,
  joinListElements: () => joinListElements,
  joinListUp: () => joinListUp,
  listInputRules: () => listInputRules,
  listKeymap: () => listKeymap,
  listToDOM: () => listToDOM,
  migrateDocJSON: () => migrateDocJSON,
  parseInteger: () => parseInteger,
  protectCollapsed: () => protectCollapsed,
  rangeToString: () => rangeToString,
  setSafeSelection: () => setSafeSelection,
  unwrapListSlice: () => unwrapListSlice,
  wrappingListInputRule: () => wrappingListInputRule
});
module.exports = __toCommonJS(src_exports);

// src/commands/dedent-list.ts
var import_prosemirror_model2 = require("prosemirror-model");
var import_prosemirror_transform3 = require("prosemirror-transform");

// src/utils/auto-fix-list.ts
var import_prosemirror_transform = require("prosemirror-transform");

// src/utils/parse-integer.ts
function parseInteger(attr) {
  if (attr == null) return null;
  const int = Number.parseInt(attr, 10);
  if (Number.isInteger(int)) return int;
  return null;
}

// src/schema/parse-dom.ts
function createParseDomRules() {
  return [
    {
      tag: "div[data-list-kind]",
      getAttrs: (element) => {
        if (typeof element === "string") {
          return {};
        }
        return {
          kind: element.getAttribute("data-list-kind") || "bullet",
          order: parseInteger(element.getAttribute("data-list-order")),
          checked: element.hasAttribute("data-list-checked"),
          collapsed: element.hasAttribute("data-list-collapsed")
        };
      }
    },
    {
      tag: "div[data-list]",
      getAttrs: (element) => {
        if (typeof element === "string") {
          return {};
        }
        return {
          kind: element.getAttribute("data-list-kind") || "bullet",
          order: parseInteger(element.getAttribute("data-list-order")),
          checked: element.hasAttribute("data-list-checked"),
          collapsed: element.hasAttribute("data-list-collapsed")
        };
      }
    },
    {
      tag: "ul > li",
      getAttrs: (element) => {
        var _a;
        if (typeof element !== "string") {
          let checkbox = element.firstChild;
          for (let i = 0; i < 3 && checkbox; i++) {
            if (["INPUT", "UL", "OL", "LI"].includes(checkbox.nodeName)) {
              break;
            }
            checkbox = checkbox.firstChild;
          }
          if (checkbox && checkbox.nodeName === "INPUT" && checkbox.getAttribute("type") === "checkbox") {
            return {
              kind: "task",
              checked: checkbox.hasAttribute("checked")
            };
          }
          if (element.hasAttribute("data-task-list-item") || element.getAttribute("data-list-kind") === "task") {
            return {
              kind: "task",
              checked: element.hasAttribute("data-list-checked") || element.hasAttribute("data-checked")
            };
          }
          if (element.hasAttribute("data-toggle-list-item") || element.getAttribute("data-list-kind") === "toggle") {
            return {
              kind: "toggle",
              collapsed: element.hasAttribute("data-list-collapsed")
            };
          }
          if (((_a = element.firstChild) == null ? void 0 : _a.nodeType) === 3) {
            const textContent = element.firstChild.textContent;
            if (textContent && /^\[[\sx|]]\s{1,2}/.test(textContent)) {
              element.firstChild.textContent = textContent.replace(
                /^\[[\sx|]]\s{1,2}/,
                ""
              );
              return {
                kind: "task",
                checked: textContent.startsWith("[x]")
              };
            }
          }
        }
        return {
          kind: "bullet"
        };
      }
    },
    {
      tag: "ol > li",
      getAttrs: (element) => {
        if (typeof element === "string") {
          return {
            kind: "ordered"
          };
        }
        return {
          kind: "ordered",
          order: parseInteger(element.getAttribute("data-list-order"))
        };
      }
    },
    {
      // This rule is for handling nested lists copied from Dropbox Paper. It's
      // technically invalid HTML structure.
      tag: ":is(ul, ol) > :is(ul, ol)",
      getAttrs: () => {
        return {
          kind: "bullet"
        };
      }
    }
  ];
}

// src/schema/to-dom.ts
function listToDOM({
  node,
  nativeList = false,
  getMarkers = defaultMarkerGetter,
  getAttributes = defaultAttributesGetter
}) {
  var _a;
  const attrs = node.attrs;
  const markerHidden = ((_a = node.firstChild) == null ? void 0 : _a.type) === node.type;
  const markers = markerHidden ? null : getMarkers(node);
  const domAttrs = getAttributes(node);
  const contentContainer = ["div", { class: "list-content" }, 0];
  const markerContainer = markers && [
    "div",
    {
      class: "list-marker list-marker-click-target",
      // Set `contenteditable` to `false` so that the cursor won't be
      // moved into the mark container when clicking on it.
      contenteditable: "false"
    },
    ...markers
  ];
  if (nativeList) {
    const listTag = attrs.kind === "ordered" ? "ol" : "ul";
    if (markerContainer) {
      return [listTag, ["li", domAttrs, markerContainer, contentContainer]];
    } else {
      return [listTag, ["li", domAttrs, 0]];
    }
  } else {
    if (markerContainer) {
      return ["div", domAttrs, markerContainer, contentContainer];
    } else {
      return ["div", domAttrs, contentContainer];
    }
  }
}
function defaultMarkerGetter(node) {
  const attrs = node.attrs;
  switch (attrs.kind) {
    case "task":
      return [
        [
          "label",
          [
            "input",
            { type: "checkbox", checked: attrs.checked ? "" : void 0 }
          ]
        ]
      ];
    case "toggle":
      return [];
    default:
      return null;
  }
}
function defaultAttributesGetter(node) {
  var _a;
  const attrs = node.attrs;
  const markerHidden = ((_a = node.firstChild) == null ? void 0 : _a.type) === node.type;
  const markerType = markerHidden ? void 0 : attrs.kind || "bullet";
  const domAttrs = {
    class: "prosemirror-flat-list",
    "data-list-kind": markerType,
    "data-list-order": attrs.order != null ? String(attrs.order) : void 0,
    "data-list-checked": attrs.checked ? "" : void 0,
    "data-list-collapsed": attrs.collapsed ? "" : void 0,
    "data-list-collapsable": node.childCount >= 2 ? "" : void 0,
    style: attrs.order != null ? `--prosemirror-flat-list-order: ${attrs.order};` : void 0
  };
  return domAttrs;
}

// src/schema/node-spec.ts
var flatListGroup = "flatList";
function createListSpec() {
  return {
    content: "block+",
    group: `${flatListGroup} block`,
    definingForContent: true,
    definingAsContext: false,
    attrs: {
      kind: {
        default: "bullet"
      },
      order: {
        default: null
      },
      checked: {
        default: false
      },
      collapsed: {
        default: false
      }
    },
    toDOM: (node) => {
      return listToDOM({ node });
    },
    parseDOM: createParseDomRules()
  };
}

// src/utils/get-list-type.ts
function getListType(schema) {
  let name = schema.cached["PROSEMIRROR_FLAT_LIST_LIST_TYPE_NAME"];
  if (!name) {
    for (const type of Object.values(schema.nodes)) {
      if ((type.spec.group || "").split(" ").includes(flatListGroup)) {
        name = type.name;
        break;
      }
    }
    if (!name) {
      throw new TypeError(
        "[prosemirror-flat-list] Unable to find a flat list type in the schema"
      );
    }
    schema.cached["PROSEMIRROR_FLAT_LIST_LIST_TYPE_NAME"] = name;
  }
  return schema.nodes[name];
}

// src/utils/is-list-type.ts
function isListType(type) {
  return getListType(type.schema) === type;
}

// src/utils/is-list-node.ts
function isListNode(node) {
  if (!node) return false;
  return isListType(node.type);
}

// src/utils/patch-command.ts
function patchCommand(patch) {
  const withPatch = (command) => {
    const patchedCommand = (state, dispatch, view) => {
      return command(
        state,
        dispatch ? (tr) => dispatch(patch(tr)) : void 0,
        view
      );
    };
    return patchedCommand;
  };
  return withPatch;
}

// src/utils/auto-fix-list.ts
function* getTransactionRanges(tr) {
  const ranges = [];
  let i = 0;
  while (true) {
    for (; i < tr.mapping.maps.length; i++) {
      const map = tr.mapping.maps[i];
      for (let j = 0; j < ranges.length; j++) {
        ranges[j] = map.map(ranges[j]);
      }
      map.forEach(
        (_oldStart, _oldEnd, newStart, newEnd) => ranges.push(newStart, newEnd)
      );
    }
    yield ranges;
  }
}
function findBoundaries(positions, doc, prediction) {
  const boundaries = /* @__PURE__ */ new Set();
  const joinable = [];
  for (const pos of positions) {
    const $pos = doc.resolve(pos);
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const boundary = $pos.before(depth + 1);
      if (boundaries.has(boundary)) {
        break;
      }
      boundaries.add(boundary);
      const index = $pos.index(depth);
      const parent = $pos.node(depth);
      const before = parent.maybeChild(index - 1);
      if (!before) continue;
      const after = parent.maybeChild(index);
      if (!after) continue;
      if (prediction(before, after, parent, index)) {
        joinable.push(boundary);
      }
    }
  }
  return joinable.sort((a, b) => b - a);
}
function isListJoinable(before, after) {
  return isListNode(before) && isListNode(after) && isListNode(after.firstChild);
}
function isListSplitable(before, after, parent, index) {
  if (index === 1 && isListNode(parent) && isListNode(before) && !isListNode(after)) {
    return true;
  }
  return false;
}
function fixList(tr) {
  const ranges = getTransactionRanges(tr);
  const joinable = findBoundaries(ranges.next().value, tr.doc, isListJoinable);
  for (const pos of joinable) {
    if ((0, import_prosemirror_transform.canJoin)(tr.doc, pos)) {
      tr.join(pos);
    }
  }
  const splitable = findBoundaries(ranges.next().value, tr.doc, isListSplitable);
  for (const pos of splitable) {
    if ((0, import_prosemirror_transform.canSplit)(tr.doc, pos)) {
      tr.split(pos);
    }
  }
  return tr;
}
var withAutoFixList = patchCommand(fixList);

// src/utils/block-boundary.ts
function atStartBlockBoundary($pos, depth) {
  for (let d = depth; d <= $pos.depth; d++) {
    if ($pos.node(d).isTextblock) {
      continue;
    }
    const index = $pos.index(d);
    if (index !== 0) {
      return false;
    }
  }
  return true;
}
function atEndBlockBoundary($pos, depth) {
  for (let d = depth; d <= $pos.depth; d++) {
    if ($pos.node(d).isTextblock) {
      continue;
    }
    const index = $pos.index(d);
    if (index !== $pos.node(d).childCount - 1) {
      return false;
    }
  }
  return true;
}

// src/utils/list-range.ts
var import_prosemirror_model = require("prosemirror-model");
function findListsRange($from, $to = $from) {
  if ($to.pos < $from.pos) {
    return findListsRange($to, $from);
  }
  let range = $from.blockRange($to);
  while (range) {
    if (isListsRange(range)) {
      return range;
    }
    if (range.depth <= 0) {
      break;
    }
    range = new import_prosemirror_model.NodeRange($from, $to, range.depth - 1);
  }
  return null;
}
function isListsRange(range) {
  const { startIndex, endIndex, parent } = range;
  for (let i = startIndex; i < endIndex; i++) {
    if (!isListNode(parent.child(i))) {
      return false;
    }
  }
  return true;
}

// src/utils/map-pos.ts
function mapPos(tr, pos) {
  let nextStepIndex = tr.steps.length;
  const getPos = () => {
    if (nextStepIndex < tr.steps.length) {
      const mapping = tr.mapping.slice(nextStepIndex);
      nextStepIndex = tr.steps.length;
      pos = mapping.map(pos);
    }
    return pos;
  };
  return getPos;
}

// src/utils/safe-lift.ts
var import_prosemirror_transform2 = require("prosemirror-transform");
function safeLift(tr, range) {
  const target = (0, import_prosemirror_transform2.liftTarget)(range);
  if (target == null) {
    return false;
  }
  tr.lift(range, target);
  return true;
}
function safeLiftFromTo(tr, from, to) {
  const $from = tr.doc.resolve(from);
  const $to = tr.doc.resolve(to);
  const range = $from.blockRange($to);
  if (!range) return false;
  return safeLift(tr, range);
}

// src/utils/zoom-in-range.ts
function zoomInRange(range) {
  const { $from, $to, depth, start, end } = range;
  const doc = $from.doc;
  const deeper = ($from.pos > start ? $from : doc.resolve(start + 1)).blockRange($to.pos < end ? $to : doc.resolve(end - 1));
  if (deeper && deeper.depth > depth) {
    return deeper;
  }
  return null;
}

// src/commands/set-safe-selection.ts
var import_prosemirror_state = require("prosemirror-state");

// src/utils/is-collapsed-list-node.ts
function isCollapsedListNode(node) {
  return !!(isListNode(node) && node.attrs.collapsed);
}

// src/utils/set-node-attributes.ts
function setNodeAttributes(tr, pos, oldAttrs, newAttrs) {
  let needUpdate = false;
  for (const key of Object.keys(newAttrs)) {
    if (newAttrs[key] !== oldAttrs[key]) {
      tr.setNodeAttribute(pos, key, newAttrs[key]);
      needUpdate = true;
    }
  }
  return needUpdate;
}

// src/utils/set-list-attributes.ts
function setListAttributes(tr, pos, attrs) {
  const $pos = tr.doc.resolve(pos);
  const node = $pos.nodeAfter;
  if (node && isListNode(node)) {
    const oldAttrs = node.attrs;
    const newAttrs = { ...oldAttrs, ...attrs };
    return setNodeAttributes(tr, pos, oldAttrs, newAttrs);
  }
  return false;
}

// src/commands/set-safe-selection.ts
function moveOutOfCollapsed($pos, minDepth) {
  for (let depth = minDepth; depth <= $pos.depth; depth++) {
    if (isCollapsedListNode($pos.node(depth)) && $pos.index(depth) >= 1) {
      const before = $pos.posAtIndex(1, depth);
      const $before = $pos.doc.resolve(before);
      return import_prosemirror_state.TextSelection.near($before, -1);
    }
  }
  return null;
}
function setSafeSelection(tr) {
  const { $from, $to, to } = tr.selection;
  const selection = moveOutOfCollapsed($from, 0) || moveOutOfCollapsed($to, $from.sharedDepth(to));
  if (selection) {
    tr.setSelection(selection);
  }
  return tr;
}
var withSafeSelection = patchCommand(setSafeSelection);
function getCollapsedPosition($pos, minDepth) {
  for (let depth = minDepth; depth <= $pos.depth; depth++) {
    if (isCollapsedListNode($pos.node(depth)) && $pos.index(depth) >= 1) {
      return $pos.before(depth);
    }
  }
  return null;
}
function setVisibleSelection(tr) {
  var _a;
  const { $from, $to, to } = tr.selection;
  const pos = (_a = getCollapsedPosition($from, 0)) != null ? _a : getCollapsedPosition($to, $from.sharedDepth(to));
  if (pos != null) {
    tr.doc.resolve(pos);
    setListAttributes(tr, pos, { collapsed: false });
  }
  return tr;
}
var withVisibleSelection = patchCommand(setVisibleSelection);

// src/commands/dedent-list.ts
function createDedentListCommand(options) {
  const dedentListCommand = (state, dispatch) => {
    const tr = state.tr;
    const $from = (options == null ? void 0 : options.from) == null ? tr.selection.$from : tr.doc.resolve(options.from);
    const $to = (options == null ? void 0 : options.to) == null ? tr.selection.$to : tr.doc.resolve(options.to);
    const range = findListsRange($from, $to);
    if (!range) return false;
    if (dedentRange(range, tr)) {
      dispatch == null ? void 0 : dispatch(tr);
      return true;
    }
    return false;
  };
  return withVisibleSelection(withAutoFixList(dedentListCommand));
}
function dedentRange(range, tr, startBoundary, endBoundary) {
  const { depth, $from, $to } = range;
  startBoundary = startBoundary || atStartBlockBoundary($from, depth + 1);
  if (!startBoundary) {
    const { startIndex, endIndex } = range;
    if (endIndex - startIndex === 1) {
      const contentRange = zoomInRange(range);
      return contentRange ? dedentRange(contentRange, tr) : false;
    } else {
      return splitAndDedentRange(range, tr, startIndex + 1);
    }
  }
  endBoundary = endBoundary || atEndBlockBoundary($to, depth + 1);
  if (!endBoundary) {
    fixEndBoundary(range, tr);
    const endOfParent = $to.end(depth);
    range = new import_prosemirror_model2.NodeRange(
      tr.doc.resolve($from.pos),
      tr.doc.resolve(endOfParent),
      depth
    );
    return dedentRange(range, tr, void 0, true);
  }
  if (range.startIndex === 0 && range.endIndex === range.parent.childCount && isListNode(range.parent)) {
    return dedentNodeRange(new import_prosemirror_model2.NodeRange($from, $to, depth - 1), tr);
  }
  return dedentNodeRange(range, tr);
}
function splitAndDedentRange(range, tr, splitIndex) {
  const { $from, $to, depth } = range;
  const splitPos = $from.posAtIndex(splitIndex, depth);
  const range1 = $from.blockRange(tr.doc.resolve(splitPos - 1));
  if (!range1) return false;
  const getRange2From = mapPos(tr, splitPos + 1);
  const getRange2To = mapPos(tr, $to.pos);
  dedentRange(range1, tr, void 0, true);
  let range2 = tr.doc.resolve(getRange2From()).blockRange(tr.doc.resolve(getRange2To()));
  if (range2 && range2.depth >= depth) {
    range2 = new import_prosemirror_model2.NodeRange(range2.$from, range2.$to, depth);
    dedentRange(range2, tr, true, void 0);
  }
  return true;
}
function dedentNodeRange(range, tr) {
  if (isListNode(range.parent)) {
    return safeLiftRange(tr, range);
  } else if (isListsRange(range)) {
    return dedentOutOfList(tr, range);
  } else {
    return safeLiftRange(tr, range);
  }
}
function safeLiftRange(tr, range) {
  if (moveRangeSiblings(tr, range)) {
    const $from = tr.doc.resolve(range.$from.pos);
    const $to = tr.doc.resolve(range.$to.pos);
    range = new import_prosemirror_model2.NodeRange($from, $to, range.depth);
  }
  return safeLift(tr, range);
}
function moveRangeSiblings(tr, range) {
  const listType = getListType(tr.doc.type.schema);
  const { $to, depth, end, parent, endIndex } = range;
  const endOfParent = $to.end(depth);
  if (end < endOfParent) {
    const lastChild = parent.maybeChild(endIndex - 1);
    if (!lastChild) return false;
    const canAppend = endIndex < parent.childCount && lastChild.canReplace(
      lastChild.childCount,
      lastChild.childCount,
      parent.content,
      endIndex,
      parent.childCount
    );
    if (canAppend) {
      tr.step(
        new import_prosemirror_transform3.ReplaceAroundStep(
          end - 1,
          endOfParent,
          end,
          endOfParent,
          new import_prosemirror_model2.Slice(import_prosemirror_model2.Fragment.from(listType.create(null)), 1, 0),
          0,
          true
        )
      );
      return true;
    } else {
      tr.step(
        new import_prosemirror_transform3.ReplaceAroundStep(
          end,
          endOfParent,
          end,
          endOfParent,
          new import_prosemirror_model2.Slice(import_prosemirror_model2.Fragment.from(listType.create(null)), 0, 0),
          1,
          true
        )
      );
      return true;
    }
  }
  return false;
}
function fixEndBoundary(range, tr) {
  if (range.endIndex - range.startIndex >= 2) {
    range = new import_prosemirror_model2.NodeRange(
      range.$to.doc.resolve(
        range.$to.posAtIndex(range.endIndex - 1, range.depth)
      ),
      range.$to,
      range.depth
    );
  }
  const contentRange = zoomInRange(range);
  if (contentRange) {
    fixEndBoundary(contentRange, tr);
    range = new import_prosemirror_model2.NodeRange(
      tr.doc.resolve(range.$from.pos),
      tr.doc.resolve(range.$to.pos),
      range.depth
    );
  }
  moveRangeSiblings(tr, range);
}
function dedentOutOfList(tr, range) {
  const { startIndex, endIndex, parent } = range;
  const getRangeStart = mapPos(tr, range.start);
  const getRangeEnd = mapPos(tr, range.end);
  for (let end2 = getRangeEnd(), i = endIndex - 1; i > startIndex; i--) {
    end2 -= parent.child(i).nodeSize;
    tr.delete(end2 - 1, end2 + 1);
  }
  const $start = tr.doc.resolve(getRangeStart());
  const listNode = $start.nodeAfter;
  if (!listNode) return false;
  const start = range.start;
  const end = start + listNode.nodeSize;
  if (getRangeEnd() !== end) return false;
  if (!$start.parent.canReplace(
    startIndex,
    startIndex + 1,
    import_prosemirror_model2.Fragment.from(listNode)
  )) {
    return false;
  }
  tr.step(
    new import_prosemirror_transform3.ReplaceAroundStep(
      start,
      end,
      start + 1,
      end - 1,
      new import_prosemirror_model2.Slice(import_prosemirror_model2.Fragment.empty, 0, 0),
      0,
      true
    )
  );
  return true;
}

// src/commands/enter-without-lift.ts
var import_prosemirror_commands = require("prosemirror-commands");
var enterWithoutLift = (0, import_prosemirror_commands.chainCommands)(
  import_prosemirror_commands.newlineInCode,
  import_prosemirror_commands.createParagraphNear,
  import_prosemirror_commands.splitBlock
);

// src/commands/indent-list.ts
var import_prosemirror_model3 = require("prosemirror-model");
var import_prosemirror_transform4 = require("prosemirror-transform");

// src/utils/in-collapsed-list.ts
function inCollapsedList($pos) {
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isListNode(node)) {
      const attrs = node.attrs;
      if (attrs.collapsed) {
        return true;
      }
    }
  }
  return false;
}

// src/commands/indent-list.ts
function createIndentListCommand(options) {
  const indentListCommand = (state, dispatch) => {
    const tr = state.tr;
    const $from = (options == null ? void 0 : options.from) == null ? tr.selection.$from : tr.doc.resolve(options.from);
    const $to = (options == null ? void 0 : options.to) == null ? tr.selection.$to : tr.doc.resolve(options.to);
    const range = findListsRange($from, $to) || $from.blockRange($to);
    if (!range) return false;
    if (indentRange(range, tr)) {
      dispatch == null ? void 0 : dispatch(tr);
      return true;
    }
    return false;
  };
  return withVisibleSelection(withAutoFixList(indentListCommand));
}
function indentRange(range, tr, startBoundary, endBoundary) {
  const { depth, $from, $to } = range;
  startBoundary = startBoundary || atStartBlockBoundary($from, depth + 1);
  if (!startBoundary) {
    const { startIndex, endIndex } = range;
    if (endIndex - startIndex === 1) {
      const contentRange = zoomInRange(range);
      return contentRange ? indentRange(contentRange, tr) : false;
    } else {
      return splitAndIndentRange(range, tr, startIndex + 1);
    }
  }
  endBoundary = endBoundary || atEndBlockBoundary($to, depth + 1);
  if (!endBoundary && !inCollapsedList($to)) {
    const { startIndex, endIndex } = range;
    if (endIndex - startIndex === 1) {
      const contentRange = zoomInRange(range);
      return contentRange ? indentRange(contentRange, tr) : false;
    } else {
      return splitAndIndentRange(range, tr, endIndex - 1);
    }
  }
  return indentNodeRange(range, tr);
}
function splitAndIndentRange(range, tr, splitIndex) {
  const { $from, $to, depth } = range;
  const splitPos = $from.posAtIndex(splitIndex, depth);
  const range1 = $from.blockRange(tr.doc.resolve(splitPos - 1));
  if (!range1) return false;
  const getRange2From = mapPos(tr, splitPos + 1);
  const getRange2To = mapPos(tr, $to.pos);
  indentRange(range1, tr, void 0, true);
  const range2 = tr.doc.resolve(getRange2From()).blockRange(tr.doc.resolve(getRange2To()));
  range2 && indentRange(range2, tr, true, void 0);
  return true;
}
function indentNodeRange(range, tr) {
  const listType = getListType(tr.doc.type.schema);
  const { parent, startIndex } = range;
  const prevChild = startIndex >= 1 && parent.child(startIndex - 1);
  if (prevChild && isListNode(prevChild)) {
    const { start, end } = range;
    tr.step(
      new import_prosemirror_transform4.ReplaceAroundStep(
        start - 1,
        end,
        start,
        end,
        new import_prosemirror_model3.Slice(import_prosemirror_model3.Fragment.from(listType.create(null)), 1, 0),
        0,
        true
      )
    );
    return true;
  }
  const isParentListNode = isListNode(parent);
  const isFirstChildListNode = isListNode(parent.maybeChild(startIndex));
  if (startIndex === 0 && isParentListNode || isFirstChildListNode) {
    const { start, end } = range;
    const listAttrs = isFirstChildListNode ? parent.child(startIndex).attrs : isParentListNode ? parent.attrs : null;
    tr.step(
      new import_prosemirror_transform4.ReplaceAroundStep(
        start,
        end,
        start,
        end,
        new import_prosemirror_model3.Slice(import_prosemirror_model3.Fragment.from(listType.create(listAttrs)), 0, 0),
        1,
        true
      )
    );
    return true;
  }
  return false;
}

// src/commands/join-collapsed-backward.ts
var import_prosemirror_state3 = require("prosemirror-state");

// src/utils/at-textblock-start.ts
function atTextblockStart(state, view) {
  const { $cursor } = state.selection;
  if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
    return null;
  return $cursor;
}

// src/commands/join-textblocks-around.ts
var import_prosemirror_model4 = require("prosemirror-model");
var import_prosemirror_state2 = require("prosemirror-state");
var import_prosemirror_transform5 = require("prosemirror-transform");
function joinTextblocksAround(tr, $cut, dispatch) {
  let before = $cut.nodeBefore, beforeText = before, beforePos = $cut.pos - 1;
  for (; !beforeText.isTextblock; beforePos--) {
    if (beforeText.type.spec.isolating) return false;
    let child = beforeText.lastChild;
    if (!child) return false;
    beforeText = child;
  }
  let after = $cut.nodeAfter, afterText = after, afterPos = $cut.pos + 1;
  for (; !afterText.isTextblock; afterPos++) {
    if (afterText.type.spec.isolating) return false;
    let child = afterText.firstChild;
    if (!child) return false;
    afterText = child;
  }
  let step = (0, import_prosemirror_transform5.replaceStep)(tr.doc, beforePos, afterPos, import_prosemirror_model4.Slice.empty);
  if (!step || step.from != beforePos || step instanceof import_prosemirror_transform5.ReplaceStep && step.slice.size >= afterPos - beforePos) return false;
  if (dispatch) {
    tr.step(step);
    tr.setSelection(import_prosemirror_state2.TextSelection.create(tr.doc, beforePos));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

// src/commands/join-collapsed-backward.ts
var joinCollapsedListBackward = (state, dispatch, view) => {
  const $cursor = atTextblockStart(state, view);
  if (!$cursor) return false;
  const $cut = findCutBefore($cursor);
  if (!$cut) return false;
  const { nodeBefore, nodeAfter } = $cut;
  if (nodeBefore && nodeAfter && isListNode(nodeBefore) && nodeBefore.attrs.collapsed && nodeAfter.isBlock) {
    const tr = state.tr;
    const listPos = $cut.pos - nodeBefore.nodeSize;
    tr.delete($cut.pos, $cut.pos + nodeAfter.nodeSize);
    const insert = listPos + 1 + nodeBefore.child(0).nodeSize;
    tr.insert(insert, nodeAfter);
    const $insert = tr.doc.resolve(insert);
    tr.setSelection(import_prosemirror_state3.TextSelection.near($insert));
    if (joinTextblocksAround(tr, $insert, dispatch)) {
      return true;
    }
  }
  return false;
};
function findCutBefore($pos) {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1));
      if ($pos.node(i).type.spec.isolating) break;
    }
  return null;
}

// src/commands/join-list-up.ts
var import_prosemirror_model5 = require("prosemirror-model");
var joinListUp = (state, dispatch, view) => {
  const $cursor = atTextblockStart(state, view);
  if (!$cursor) return false;
  const { depth } = $cursor;
  if (depth < 2) return false;
  const listDepth = depth - 1;
  const listNode = $cursor.node(listDepth);
  if (!isListNode(listNode)) return false;
  const indexInList = $cursor.index(listDepth);
  if (indexInList === 0) {
    if (dispatch) {
      liftListContent(state, dispatch, $cursor);
    }
    return true;
  }
  if (indexInList === listNode.childCount - 1) {
    if (dispatch) {
      liftParent(state, dispatch, $cursor);
    }
    return true;
  }
  return false;
};
function liftListContent(state, dispatch, $cursor) {
  const tr = state.tr;
  const listDepth = $cursor.depth - 1;
  const range = new import_prosemirror_model5.NodeRange(
    $cursor,
    tr.doc.resolve($cursor.end(listDepth)),
    listDepth
  );
  if (safeLift(tr, range)) {
    dispatch(tr);
  }
}
function liftParent(state, dispatch, $cursor) {
  const tr = state.tr;
  const range = $cursor.blockRange();
  if (range && safeLift(tr, range)) {
    dispatch(tr);
  }
}

// src/commands/keymap.ts
var import_prosemirror_commands3 = require("prosemirror-commands");

// src/commands/protect-collapsed.ts
var protectCollapsed = (state, dispatch) => {
  const tr = state.tr;
  let found = false;
  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (node, pos, parent, index) => {
    if (found && !dispatch) {
      return false;
    }
    if (parent && isCollapsedListNode(parent) && index >= 1) {
      found = true;
      if (!dispatch) {
        return false;
      }
      const $pos = state.doc.resolve(pos);
      tr.setNodeAttribute($pos.before($pos.depth), "collapsed", false);
    }
  });
  if (found) {
    dispatch == null ? void 0 : dispatch(tr);
  }
  return found;
};

// src/commands/split-list.ts
var import_prosemirror_commands2 = require("prosemirror-commands");
var import_prosemirror_model6 = require("prosemirror-model");
var import_prosemirror_state5 = require("prosemirror-state");
var import_prosemirror_transform6 = require("prosemirror-transform");

// src/utils/create-and-fill.ts
function createAndFill(type, attrs, content, marks) {
  const node = type.createAndFill(attrs, content, marks);
  if (!node) {
    throw new RangeError(`Failed to create '${type.name}' node`);
  }
  node.check();
  return node;
}

// src/utils/is-node-selection.ts
function isNodeSelection(selection) {
  return Boolean(selection.node);
}

// src/utils/is-block-node-selection.ts
function isBlockNodeSelection(selection) {
  return isNodeSelection(selection) && selection.node.type.isBlock;
}

// src/utils/is-text-selection.ts
var import_prosemirror_state4 = require("prosemirror-state");
function isTextSelection(value) {
  return Boolean(value && value instanceof import_prosemirror_state4.TextSelection);
}

// src/commands/split-list.ts
function createSplitListCommand() {
  return withAutoFixList(
    (0, import_prosemirror_commands2.chainCommands)(splitBlockNodeSelectionInListCommand, splitListCommand)
  );
}
function deriveListAttributes(listNode) {
  return { kind: listNode.attrs.kind };
}
var splitBlockNodeSelectionInListCommand = (state, dispatch) => {
  if (!isBlockNodeSelection(state.selection)) {
    return false;
  }
  const selection = state.selection;
  const { $to, node } = selection;
  const parent = $to.parent;
  if (isListNode(node) || !isListNode(parent) || parent.childCount !== 1 || parent.firstChild !== node) {
    return false;
  }
  const listType = parent.type;
  const nextList = listType.createAndFill(deriveListAttributes(parent));
  if (!nextList) {
    return false;
  }
  if (dispatch) {
    const tr = state.tr;
    const cutPoint = $to.pos;
    tr.replace(
      cutPoint,
      cutPoint,
      new import_prosemirror_model6.Slice(import_prosemirror_model6.Fragment.fromArray([listType.create(), nextList]), 1, 1)
    );
    const newSelection = import_prosemirror_state5.TextSelection.near(tr.doc.resolve(cutPoint));
    if (isTextSelection(newSelection)) {
      tr.setSelection(newSelection);
      dispatch(tr);
    }
  }
  return true;
};
var splitListCommand = (state, dispatch) => {
  if (isBlockNodeSelection(state.selection)) {
    return false;
  }
  const { $from, $to } = state.selection;
  if (!$from.sameParent($to)) {
    return false;
  }
  if ($from.depth < 2) {
    return false;
  }
  const listDepth = $from.depth - 1;
  const listNode = $from.node(listDepth);
  if (!isListNode(listNode)) {
    return false;
  }
  const parent = $from.parent;
  const indexInList = $from.index(listDepth);
  const parentEmpty = parent.content.size === 0;
  if (indexInList === 0) {
    if (parentEmpty) {
      const $listEnd = state.doc.resolve($from.end(listDepth));
      const listParentDepth = listDepth - 1;
      const listParent = $from.node(listParentDepth);
      const indexInListParent = $from.index(listParentDepth);
      const isLastChildInListParent = indexInListParent === listParent.childCount - 1;
      const range = isLastChildInListParent ? new import_prosemirror_model6.NodeRange($from, $listEnd, listParentDepth) : new import_prosemirror_model6.NodeRange($from, $listEnd, listDepth);
      const tr = state.tr;
      if (range && dedentNodeRange(range, tr)) {
        dispatch == null ? void 0 : dispatch(tr);
        return true;
      }
      return false;
    } else {
      return doSplitList(state, listNode, dispatch);
    }
  } else {
    if (parentEmpty) {
      return enterWithoutLift(state, dispatch);
    } else {
      return false;
    }
  }
};
function doSplitList(state, listNode, dispatch) {
  const tr = state.tr;
  const listType = listNode.type;
  const attrs = listNode.attrs;
  const newAttrs = deriveListAttributes(listNode);
  tr.delete(tr.selection.from, tr.selection.to);
  const { $from, $to } = tr.selection;
  const { parentOffset } = $to;
  const atStart = parentOffset == 0;
  const atEnd = parentOffset == $to.parent.content.size;
  if (atStart) {
    if (dispatch) {
      const pos = $from.before(-1);
      tr.insert(pos, createAndFill(listType, newAttrs));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  if (atEnd && attrs.collapsed) {
    if (dispatch) {
      const pos = $from.after(-1);
      tr.insert(pos, createAndFill(listType, newAttrs));
      tr.setSelection(import_prosemirror_state5.Selection.near(tr.doc.resolve(pos)));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  const nextType = atEnd ? listNode.contentMatchAt(0).defaultType : void 0;
  const typesAfter = [
    { type: listType, attrs: newAttrs },
    nextType ? { type: nextType } : null
  ];
  if (!(0, import_prosemirror_transform6.canSplit)(tr.doc, $from.pos, 2, typesAfter)) {
    return false;
  }
  dispatch == null ? void 0 : dispatch(tr.split($from.pos, 2, typesAfter).scrollIntoView());
  return true;
}

// src/commands/keymap.ts
var enterCommand = (0, import_prosemirror_commands3.chainCommands)(
  protectCollapsed,
  createSplitListCommand()
);
var backspaceCommand = (0, import_prosemirror_commands3.chainCommands)(
  protectCollapsed,
  import_prosemirror_commands3.deleteSelection,
  joinListUp,
  joinCollapsedListBackward,
  import_prosemirror_commands3.joinTextblockBackward,
  import_prosemirror_commands3.selectNodeBackward
);
var deleteCommand = (0, import_prosemirror_commands3.chainCommands)(
  protectCollapsed,
  import_prosemirror_commands3.deleteSelection,
  import_prosemirror_commands3.joinTextblockForward,
  import_prosemirror_commands3.selectNodeForward
);
var listKeymap = {
  Enter: enterCommand,
  Backspace: backspaceCommand,
  Delete: deleteCommand,
  "Mod-[": createDedentListCommand(),
  "Mod-]": createIndentListCommand()
};

// src/utils/cut-by-index.ts
function cutByIndex(fragment, from, to) {
  return fragment.cutByIndex(from, to);
}

// src/commands/move-list.ts
function createMoveListCommand(direction) {
  const moveList = (state, dispatch) => {
    const tr = state.tr;
    if (doMoveList(tr, direction, true, !!dispatch)) {
      dispatch == null ? void 0 : dispatch(tr);
      return true;
    }
    return false;
  };
  return withAutoFixList(moveList);
}
function doMoveList(tr, direction, canDedent, dispatch) {
  const { $from, $to } = tr.selection;
  const range = findListsRange($from, $to);
  if (!range) return false;
  const { parent, depth, startIndex, endIndex } = range;
  if (direction === "up") {
    if (startIndex >= 2 || startIndex === 1 && isListNode(parent.child(0))) {
      const before = cutByIndex(parent.content, startIndex - 1, startIndex);
      const selected = cutByIndex(parent.content, startIndex, endIndex);
      if (parent.canReplace(startIndex - 1, endIndex, selected.append(before))) {
        if (dispatch) {
          tr.insert($from.posAtIndex(endIndex, depth), before);
          tr.delete(
            $from.posAtIndex(startIndex - 1, depth),
            $from.posAtIndex(startIndex, depth)
          );
        }
        return true;
      } else {
        return false;
      }
    } else if (canDedent && isListNode(parent)) {
      return safeLift(tr, range) && doMoveList(tr, direction, false, dispatch);
    } else {
      return false;
    }
  } else {
    if (endIndex < parent.childCount) {
      const selected = cutByIndex(parent.content, startIndex, endIndex);
      const after = cutByIndex(parent.content, endIndex, endIndex + 1);
      if (parent.canReplace(startIndex, endIndex + 1, after.append(selected))) {
        if (dispatch) {
          tr.delete(
            $from.posAtIndex(endIndex, depth),
            $from.posAtIndex(endIndex + 1, depth)
          );
          tr.insert($from.posAtIndex(startIndex, depth), after);
        }
        return true;
      } else {
        return false;
      }
    } else if (canDedent && isListNode(parent)) {
      return safeLift(tr, range) && doMoveList(tr, direction, false, dispatch);
    } else {
      return false;
    }
  }
}

// src/commands/toggle-collapsed.ts
function createToggleCollapsedCommand({
  collapsed = void 0,
  isToggleable = defaultIsToggleable
} = {}) {
  const toggleCollapsed = (state, dispatch) => {
    const { $from } = state.selection;
    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth);
      if (isListNode(node) && isToggleable(node)) {
        if (dispatch) {
          const pos = $from.before(depth);
          const attrs = node.attrs;
          const tr = state.tr;
          tr.setNodeAttribute(pos, "collapsed", collapsed != null ? collapsed : !attrs.collapsed);
          dispatch(setSafeSelection(tr));
        }
        return true;
      }
    }
    return false;
  };
  return toggleCollapsed;
}
function defaultIsToggleable(node) {
  const attrs = node.attrs;
  return attrs.kind === "toggle" && node.childCount >= 2 && !isListNode(node.firstChild);
}

// src/commands/toggle-list.ts
var import_prosemirror_commands4 = require("prosemirror-commands");

// src/commands/unwrap-list.ts
function createUnwrapListCommand(options) {
  const kind = options == null ? void 0 : options.kind;
  const unwrapList = (state, dispatch) => {
    const selection = state.selection;
    if (isNodeSelection(selection) && isTargetList(selection.node, kind)) {
      if (dispatch) {
        const tr = state.tr;
        safeLiftFromTo(tr, tr.selection.from + 1, tr.selection.to - 1);
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    const range = selection.$from.blockRange(selection.$to);
    if (range && isTargetListsRange(range, kind)) {
      const tr = state.tr;
      if (dedentOutOfList(tr, range)) {
        dispatch == null ? void 0 : dispatch(tr);
        return true;
      }
    }
    if (range && isTargetList(range.parent, kind)) {
      if (dispatch) {
        const tr = state.tr;
        safeLiftFromTo(
          tr,
          range.$from.start(range.depth),
          range.$to.end(range.depth)
        );
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    return false;
  };
  return unwrapList;
}
function isTargetList(node, kind) {
  if (isListNode(node)) {
    if (kind) {
      return node.attrs.kind === kind;
    }
    return true;
  }
  return false;
}
function isTargetListsRange(range, kind) {
  const { startIndex, endIndex, parent } = range;
  for (let i = startIndex; i < endIndex; i++) {
    if (!isTargetList(parent.child(i), kind)) {
      return false;
    }
  }
  return true;
}

// src/commands/wrap-in-list.ts
var import_prosemirror_model7 = require("prosemirror-model");
var import_prosemirror_transform7 = require("prosemirror-transform");
function createWrapInListCommand(getAttrs) {
  const wrapInList = (state, dispatch) => {
    const { $from, $to } = state.selection;
    let range = $from.blockRange($to);
    if (!range) {
      return false;
    }
    if (rangeAllowInlineContent(range) && isListNode(range.parent) && range.depth > 0 && range.startIndex === 0) {
      range = new import_prosemirror_model7.NodeRange($from, $to, range.depth - 1);
    }
    const attrs = typeof getAttrs === "function" ? getAttrs(range) : getAttrs;
    if (!attrs) {
      return false;
    }
    const { parent, startIndex, endIndex, depth } = range;
    const tr = state.tr;
    const listType = getListType(state.schema);
    for (let i = endIndex - 1; i >= startIndex; i--) {
      const node = parent.child(i);
      if (isListNode(node)) {
        const oldAttrs = node.attrs;
        const newAttrs = { ...oldAttrs, ...attrs };
        setNodeAttributes(tr, $from.posAtIndex(i, depth), oldAttrs, newAttrs);
      } else {
        const beforeNode = $from.posAtIndex(i, depth);
        const afterNode = $from.posAtIndex(i + 1, depth);
        let nodeStart = beforeNode + 1;
        let nodeEnd = afterNode - 1;
        if (nodeStart > nodeEnd) {
          ;
          [nodeStart, nodeEnd] = [nodeEnd, nodeStart];
        }
        const range2 = new import_prosemirror_model7.NodeRange(
          tr.doc.resolve(nodeStart),
          tr.doc.resolve(nodeEnd),
          depth
        );
        const wrapping = (0, import_prosemirror_transform7.findWrapping)(range2, listType, attrs);
        if (wrapping) {
          tr.wrap(range2, wrapping);
        }
      }
    }
    dispatch == null ? void 0 : dispatch(tr);
    return true;
  };
  return wrapInList;
}
function rangeAllowInlineContent(range) {
  const { parent, startIndex, endIndex } = range;
  for (let i = startIndex; i < endIndex; i++) {
    if (parent.child(i).inlineContent) {
      return true;
    }
  }
  return false;
}

// src/commands/toggle-list.ts
function createToggleListCommand(attrs) {
  const unwrapList = createUnwrapListCommand({ kind: attrs.kind });
  const wrapInList = createWrapInListCommand(attrs);
  return (0, import_prosemirror_commands4.chainCommands)(unwrapList, wrapInList);
}

// src/dom-events.ts
function handleListMarkerMouseDown({
  view,
  event,
  onListClick = defaultListClickHandler
}) {
  const target = event.target;
  if (target == null ? void 0 : target.closest(".list-marker-click-target")) {
    event.preventDefault();
    const pos = view.posAtDOM(target, -10, -10);
    return handleMouseDown(pos, onListClick)(
      view.state,
      (tr) => view.dispatch(tr)
    );
  }
  return false;
}
function handleMouseDown(pos, onListClick) {
  const mouseDown = (state, dispatch) => {
    const tr = state.tr;
    const $pos = tr.doc.resolve(pos);
    const list = $pos.parent;
    if (!isListNode(list)) {
      return false;
    }
    const listPos = $pos.before($pos.depth);
    const attrs = onListClick(list);
    if (setNodeAttributes(tr, listPos, list.attrs, attrs)) {
      dispatch == null ? void 0 : dispatch(tr);
    }
    return true;
  };
  return withSafeSelection(mouseDown);
}
var defaultListClickHandler = (node) => {
  const attrs = node.attrs;
  if (attrs.kind === "task") {
    return { ...attrs, checked: !attrs.checked };
  } else if (attrs.kind === "toggle") {
    return { ...attrs, collapsed: !attrs.collapsed };
  } else {
    return attrs;
  }
};

// src/input-rule.ts
var import_prosemirror_inputrules = require("prosemirror-inputrules");
var import_prosemirror_transform8 = require("prosemirror-transform");
function wrappingListInputRule(regexp, getAttrs) {
  return new import_prosemirror_inputrules.InputRule(
    regexp,
    (state, match, start, end) => {
      const tr = state.tr;
      tr.deleteRange(start, end);
      const $pos = tr.selection.$from;
      const listNode = $pos.index(-1) === 0 && $pos.node(-1);
      if (listNode && isListNode(listNode)) {
        const oldAttrs = listNode.attrs;
        const newAttrs2 = typeof getAttrs === "function" ? getAttrs({ match, attributes: oldAttrs }) : getAttrs;
        const entries = Object.entries(newAttrs2).filter(([key, value]) => {
          return oldAttrs[key] !== value;
        });
        if (entries.length === 0) {
          return null;
        } else {
          const pos = $pos.before(-1);
          for (const [key, value] of entries) {
            tr.setNodeAttribute(pos, key, value);
          }
          return tr;
        }
      }
      const $start = tr.doc.resolve(start);
      const range = $start.blockRange();
      if (!range) {
        return null;
      }
      const newAttrs = typeof getAttrs === "function" ? getAttrs({ match }) : getAttrs;
      const wrapping = (0, import_prosemirror_transform8.findWrapping)(range, getListType(state.schema), newAttrs);
      if (!wrapping) {
        return null;
      }
      return tr.wrap(range, wrapping);
    }
  );
}
var listInputRules = [
  wrappingListInputRule(/^\s?([*-])\s$/, {
    kind: "bullet",
    collapsed: false
  }),
  wrappingListInputRule(/^\s?(\d+)\.\s$/, ({ match }) => {
    const order = parseInteger(match[1]);
    return {
      kind: "ordered",
      collapsed: false,
      order: order != null && order >= 2 ? order : null
    };
  }),
  wrappingListInputRule(/^\s?\[([\sXx]?)]\s$/, ({ match }) => {
    return {
      kind: "task",
      checked: ["x", "X"].includes(match[1]),
      collapsed: false
    };
  }),
  wrappingListInputRule(/^\s?>>\s$/, {
    kind: "toggle"
  })
];

// src/migrate.ts
function migrateNodes(nodes) {
  var _a, _b, _c;
  const content = [];
  let updated = false;
  for (const node of nodes) {
    if (node.type === "bullet_list" || node.type === "bulletList") {
      updated = true;
      for (const child of (_a = node.content) != null ? _a : []) {
        content.push(migrateNode(child, { kind: "bullet" })[0]);
      }
    } else if (node.type === "ordered_list" || node.type === "orderedList") {
      updated = true;
      for (const child of (_b = node.content) != null ? _b : []) {
        content.push(migrateNode(child, { kind: "ordered" })[0]);
      }
    } else if (node.type === "task_list" || node.type === "taskList") {
      updated = true;
      for (const child of (_c = node.content) != null ? _c : []) {
        content.push(migrateNode(child, { kind: "task" })[0]);
      }
    } else {
      content.push(node);
    }
  }
  return [content, updated];
}
function migrateNode(node, { kind } = {}) {
  var _a;
  if (node.type === "list_item" || node.type === "listItem" || node.type === "taskListItem") {
    return [
      {
        ...node,
        type: "list",
        attrs: {
          collapsed: Boolean((_a = node.attrs) == null ? void 0 : _a.closed),
          ...node.attrs,
          kind: kind != null ? kind : "bullet"
        },
        content: node.content ? migrateNodes(node.content)[0] : void 0
      },
      true
    ];
  } else if (node.content) {
    const [content, updated] = migrateNodes(node.content);
    return [{ ...node, content }, updated];
  } else {
    return [node, false];
  }
}
function migrateDocJSON(docJSON) {
  const [migrated, updated] = migrateNode(docJSON);
  return updated ? migrated : null;
}

// src/node-view.ts
var import_prosemirror_model8 = require("prosemirror-model");

// src/utils/browser.ts
var nav = typeof navigator != "undefined" ? navigator : null;
var agent = nav && nav.userAgent || "";
var ie_edge = /Edge\/(\d+)/.exec(agent);
var ie_upto10 = /MSIE \d/.exec(agent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
var ie = !!(ie_upto10 || ie_11up || ie_edge);
var safari = !ie && !!nav && /Apple Computer/.test(nav.vendor);

// src/node-view.ts
var createListNodeView = (node) => {
  var _a, _b;
  let prevNode = node;
  const prevNested = ((_a = node.firstChild) == null ? void 0 : _a.type) === node.type;
  const prevSingleChild = node.childCount === 1;
  const spec = node.type.spec.toDOM(node);
  const { dom, contentDOM } = import_prosemirror_model8.DOMSerializer.renderSpec(document, spec);
  if (safari && node.attrs.kind === "toggle") {
    ;
    (_b = dom.querySelector(".list-marker-click-target")) == null ? void 0 : _b.appendChild(document.createElement("span"));
  }
  const update = (node2) => {
    var _a2;
    if (!node2.sameMarkup(prevNode)) return false;
    const nested = ((_a2 = node2.firstChild) == null ? void 0 : _a2.type) === node2.type;
    const singleChild = node2.childCount === 1;
    if (prevNested !== nested || prevSingleChild !== singleChild) return false;
    prevNode = node2;
    return true;
  };
  return { dom, contentDOM, update };
};

// src/plugins/clipboard.ts
var import_prosemirror_state6 = require("prosemirror-state");

// src/utils/list-serializer.ts
var import_prosemirror_model9 = require("prosemirror-model");
var ListDOMSerializer = class _ListDOMSerializer extends import_prosemirror_model9.DOMSerializer {
  static nodesFromSchema(schema) {
    const nodes = import_prosemirror_model9.DOMSerializer.nodesFromSchema(schema);
    return {
      ...nodes,
      list: (node) => listToDOM({ node, nativeList: true, getMarkers: () => null })
    };
  }
  static fromSchema(schema) {
    return schema.cached.listDomSerializer || (schema.cached.listDomSerializer = new _ListDOMSerializer(
      this.nodesFromSchema(schema),
      this.marksFromSchema(schema)
    ));
  }
  serializeFragment(fragment, options, target) {
    const dom = super.serializeFragment(fragment, options, target);
    return joinListElements(dom);
  }
};
function joinListElements(parent) {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.children.item(i);
    if (!child) continue;
    if (child.tagName === "UL" || child.tagName === "OL") {
      let next = null;
      while (next = child.nextElementSibling, (next == null ? void 0 : next.tagName) === child.tagName) {
        child.append(...Array.from(next.children));
        next.remove();
      }
    }
    joinListElements(child);
  }
  return parent;
}

// src/utils/unwrap-list-slice.ts
var import_prosemirror_model10 = require("prosemirror-model");
function unwrapListSlice(slice) {
  while (slice.openStart >= 2 && slice.openEnd >= 2 && slice.content.childCount === 1 && isListNode(slice.content.child(0))) {
    slice = new import_prosemirror_model10.Slice(
      slice.content.child(0).content,
      slice.openStart - 1,
      slice.openEnd - 1
    );
  }
  return slice;
}

// src/plugins/clipboard.ts
function createListClipboardPlugin(schema) {
  return new import_prosemirror_state6.Plugin({
    props: {
      clipboardSerializer: ListDOMSerializer.fromSchema(schema),
      transformCopied: unwrapListSlice
    }
  });
}

// src/plugins/event.ts
var import_prosemirror_state7 = require("prosemirror-state");
function createListEventPlugin() {
  return new import_prosemirror_state7.Plugin({
    props: {
      handleDOMEvents: {
        mousedown: (view, event) => handleListMarkerMouseDown({ view, event })
      }
    }
  });
}

// src/plugins/rendering.ts
var import_prosemirror_state8 = require("prosemirror-state");
function createListRenderingPlugin() {
  return new import_prosemirror_state8.Plugin({
    props: {
      nodeViews: {
        list: createListNodeView
      }
    }
  });
}

// src/plugins/safari-workaround.ts
var import_prosemirror_safari_ime_span = require("prosemirror-safari-ime-span");
function createSafariInputMethodWorkaroundPlugin() {
  return import_prosemirror_safari_ime_span.imeSpan;
}

// src/plugins/index.ts
function createListPlugins({ schema }) {
  return [
    createListEventPlugin(),
    createListRenderingPlugin(),
    createListClipboardPlugin(schema),
    createSafariInputMethodWorkaroundPlugin()
  ];
}

// src/utils/range-to-string.ts
function rangeToString(range) {
  const { parent, startIndex, endIndex } = range;
  return cutByIndex(parent.content, startIndex, endIndex).toString();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListDOMSerializer,
  backspaceCommand,
  createDedentListCommand,
  createIndentListCommand,
  createListClipboardPlugin,
  createListEventPlugin,
  createListNodeView,
  createListPlugins,
  createListRenderingPlugin,
  createListSpec,
  createMoveListCommand,
  createParseDomRules,
  createSafariInputMethodWorkaroundPlugin,
  createSplitListCommand,
  createToggleCollapsedCommand,
  createToggleListCommand,
  createUnwrapListCommand,
  createWrapInListCommand,
  defaultAttributesGetter,
  defaultListClickHandler,
  defaultMarkerGetter,
  deleteCommand,
  doSplitList,
  enterCommand,
  enterWithoutLift,
  findListsRange,
  flatListGroup,
  getListType,
  handleListMarkerMouseDown,
  isCollapsedListNode,
  isListNode,
  isListType,
  isListsRange,
  joinCollapsedListBackward,
  joinListElements,
  joinListUp,
  listInputRules,
  listKeymap,
  listToDOM,
  migrateDocJSON,
  parseInteger,
  protectCollapsed,
  rangeToString,
  setSafeSelection,
  unwrapListSlice,
  wrappingListInputRule
});
