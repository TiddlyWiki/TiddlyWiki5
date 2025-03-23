'use strict';

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var prosemirrorKeymap = require('prosemirror-keymap');
var prosemirrorHistory = require('prosemirror-history');
var prosemirrorCommands = require('prosemirror-commands');
var prosemirrorState = require('prosemirror-state');
var prosemirrorDropcursor = require('prosemirror-dropcursor');
var prosemirrorGapcursor = require('prosemirror-gapcursor');
var prosemirrorMenu = require('prosemirror-menu');
var prosemirrorSchemaList = require('prosemirror-schema-list');
var prosemirrorInputrules = require('prosemirror-inputrules');
var prefix = "ProseMirror-prompt";
function openPrompt(options) {
  var wrapper = document.body.appendChild(document.createElement("div"));
  wrapper.className = prefix;
  var mouseOutside = function mouseOutside(e) {
    if (!wrapper.contains(e.target)) close();
  };
  setTimeout(function () {
    return window.addEventListener("mousedown", mouseOutside);
  }, 50);
  var close = function close() {
    window.removeEventListener("mousedown", mouseOutside);
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  };
  var domFields = [];
  for (var name in options.fields) domFields.push(options.fields[name].render());
  var submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = prefix + "-submit";
  submitButton.textContent = "OK";
  var cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = prefix + "-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", close);
  var form = wrapper.appendChild(document.createElement("form"));
  if (options.title) form.appendChild(document.createElement("h5")).textContent = options.title;
  domFields.forEach(function (field) {
    form.appendChild(document.createElement("div")).appendChild(field);
  });
  var buttons = form.appendChild(document.createElement("div"));
  buttons.className = prefix + "-buttons";
  buttons.appendChild(submitButton);
  buttons.appendChild(document.createTextNode(" "));
  buttons.appendChild(cancelButton);
  var box = wrapper.getBoundingClientRect();
  wrapper.style.top = (window.innerHeight - box.height) / 2 + "px";
  wrapper.style.left = (window.innerWidth - box.width) / 2 + "px";
  var submit = function submit() {
    var params = getValues(options.fields, domFields);
    if (params) {
      close();
      options.callback(params);
    }
  };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submit();
  });
  form.addEventListener("keydown", function (e) {
    if (e.keyCode == 27) {
      e.preventDefault();
      close();
    } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      submit();
    } else if (e.keyCode == 9) {
      window.setTimeout(function () {
        if (!wrapper.contains(document.activeElement)) close();
      }, 500);
    }
  });
  var input = form.elements[0];
  if (input) input.focus();
}
function getValues(fields, domFields) {
  var result = Object.create(null),
    i = 0;
  for (var name in fields) {
    var field = fields[name],
      dom = domFields[i++];
    var value = field.read(dom),
      bad = field.validate(value);
    if (bad) {
      reportInvalid(dom, bad);
      return null;
    }
    result[name] = field.clean(value);
  }
  return result;
}
function reportInvalid(dom, message) {
  var parent = dom.parentNode;
  var msg = parent.appendChild(document.createElement("div"));
  msg.style.left = dom.offsetLeft + dom.offsetWidth + 2 + "px";
  msg.style.top = dom.offsetTop - 5 + "px";
  msg.className = "ProseMirror-invalid";
  msg.textContent = message;
  setTimeout(function () {
    return parent.removeChild(msg);
  }, 1500);
}
var Field = function () {
  function Field(options) {
    _classCallCheck(this, Field);
    this.options = options;
  }
  _createClass(Field, [{
    key: "read",
    value: function read(dom) {
      return dom.value;
    }
  }, {
    key: "validateType",
    value: function validateType(value) {
      return null;
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!value && this.options.required) return "Required field";
      return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
    }
  }, {
    key: "clean",
    value: function clean(value) {
      return this.options.clean ? this.options.clean(value) : value;
    }
  }]);
  return Field;
}();
var TextField = function (_Field) {
  _inherits(TextField, _Field);
  var _super = _createSuper(TextField);
  function TextField() {
    _classCallCheck(this, TextField);
    return _super.apply(this, arguments);
  }
  _createClass(TextField, [{
    key: "render",
    value: function render() {
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = this.options.label;
      input.value = this.options.value || "";
      input.autocomplete = "off";
      return input;
    }
  }]);
  return TextField;
}(Field);
function canInsert(state, nodeType) {
  var $from = state.selection.$from;
  for (var d = $from.depth; d >= 0; d--) {
    var index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
  }
  return false;
}
function insertImageItem(nodeType) {
  return new prosemirrorMenu.MenuItem({
    title: "Insert image",
    label: "Image",
    enable: function enable(state) {
      return canInsert(state, nodeType);
    },
    run: function run(state, _, view) {
      var _state$selection = state.selection,
        from = _state$selection.from,
        to = _state$selection.to,
        attrs = null;
      if (state.selection instanceof prosemirrorState.NodeSelection && state.selection.node.type == nodeType) attrs = state.selection.node.attrs;
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({
            label: "Location",
            required: true,
            value: attrs && attrs.src
          }),
          title: new TextField({
            label: "Title",
            value: attrs && attrs.title
          }),
          alt: new TextField({
            label: "Description",
            value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")
          })
        },
        callback: function callback(attrs) {
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
  if (!options.enable && !options.select) passedOptions[options.enable ? "enable" : "select"] = function (state) {
    return cmd(state);
  };
  return new prosemirrorMenu.MenuItem(passedOptions);
}
function markActive(state, type) {
  var _state$selection2 = state.selection,
    from = _state$selection2.from,
    $from = _state$selection2.$from,
    to = _state$selection2.to,
    empty = _state$selection2.empty;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());else return state.doc.rangeHasMark(from, to, type);
}
function markItem(markType, options) {
  var passedOptions = {
    active: function active(state) {
      return markActive(state, markType);
    }
  };
  for (var prop in options) passedOptions[prop] = options[prop];
  return cmdItem(prosemirrorCommands.toggleMark(markType), passedOptions);
}
function linkItem(markType) {
  return new prosemirrorMenu.MenuItem({
    title: "Add or remove link",
    icon: prosemirrorMenu.icons.link,
    active: function active(state) {
      return markActive(state, markType);
    },
    enable: function enable(state) {
      return !state.selection.empty;
    },
    run: function run(state, dispatch, view) {
      if (markActive(state, markType)) {
        prosemirrorCommands.toggleMark(markType)(state, dispatch);
        return true;
      }
      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({
            label: "Link target",
            required: true
          }),
          title: new TextField({
            label: "Title"
          })
        },
        callback: function callback(attrs) {
          prosemirrorCommands.toggleMark(markType, attrs)(view.state, view.dispatch);
          view.focus();
        }
      });
    }
  });
}
function wrapListItem(nodeType, options) {
  return cmdItem(prosemirrorSchemaList.wrapInList(nodeType, options.attrs), options);
}
function buildMenuItems(schema) {
  var r = {};
  var mark;
  if (mark = schema.marks.strong) r.toggleStrong = markItem(mark, {
    title: "Toggle strong style",
    icon: prosemirrorMenu.icons.strong
  });
  if (mark = schema.marks.em) r.toggleEm = markItem(mark, {
    title: "Toggle emphasis",
    icon: prosemirrorMenu.icons.em
  });
  if (mark = schema.marks.code) r.toggleCode = markItem(mark, {
    title: "Toggle code font",
    icon: prosemirrorMenu.icons.code
  });
  if (mark = schema.marks.link) r.toggleLink = linkItem(mark);
  var node;
  if (node = schema.nodes.image) r.insertImage = insertImageItem(node);
  if (node = schema.nodes.bullet_list) r.wrapBulletList = wrapListItem(node, {
    title: "Wrap in bullet list",
    icon: prosemirrorMenu.icons.bulletList
  });
  if (node = schema.nodes.ordered_list) r.wrapOrderedList = wrapListItem(node, {
    title: "Wrap in ordered list",
    icon: prosemirrorMenu.icons.orderedList
  });
  if (node = schema.nodes.blockquote) r.wrapBlockQuote = prosemirrorMenu.wrapItem(node, {
    title: "Wrap in block quote",
    icon: prosemirrorMenu.icons.blockquote
  });
  if (node = schema.nodes.paragraph) r.makeParagraph = prosemirrorMenu.blockTypeItem(node, {
    title: "Change to paragraph",
    label: "Plain"
  });
  if (node = schema.nodes.code_block) r.makeCodeBlock = prosemirrorMenu.blockTypeItem(node, {
    title: "Change to code block",
    label: "Code"
  });
  if (node = schema.nodes.heading) for (var i = 1; i <= 10; i++) r["makeHead" + i] = prosemirrorMenu.blockTypeItem(node, {
    title: "Change to heading " + i,
    label: "Level " + i,
    attrs: {
      level: i
    }
  });
  if (node = schema.nodes.horizontal_rule) {
    var hr = node;
    r.insertHorizontalRule = new prosemirrorMenu.MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      enable: function enable(state) {
        return canInsert(state, hr);
      },
      run: function run(state, dispatch) {
        dispatch(state.tr.replaceSelectionWith(hr.create()));
      }
    });
  }
  var cut = function cut(arr) {
    return arr.filter(function (x) {
      return x;
    });
  };
  r.insertMenu = new prosemirrorMenu.Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {
    label: "Insert"
  });
  r.typeMenu = new prosemirrorMenu.Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new prosemirrorMenu.DropdownSubmenu(cut([r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6]), {
    label: "Heading"
  })]), {
    label: "Type..."
  });
  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
  r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, prosemirrorMenu.joinUpItem, prosemirrorMenu.liftItem, prosemirrorMenu.selectParentNodeItem])];
  r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[prosemirrorMenu.undoItem, prosemirrorMenu.redoItem]], r.blockMenu);
  return r;
}
var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
function buildKeymap(schema, mapKeys) {
  var keys = {},
    type;
  function bind(key, cmd) {
    if (mapKeys) {
      var mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }
  bind("Mod-z", prosemirrorHistory.undo);
  bind("Shift-Mod-z", prosemirrorHistory.redo);
  bind("Backspace", prosemirrorInputrules.undoInputRule);
  if (!mac) bind("Mod-y", prosemirrorHistory.redo);
  bind("Alt-ArrowUp", prosemirrorCommands.joinUp);
  bind("Alt-ArrowDown", prosemirrorCommands.joinDown);
  bind("Mod-BracketLeft", prosemirrorCommands.lift);
  bind("Escape", prosemirrorCommands.selectParentNode);
  if (type = schema.marks.strong) {
    bind("Mod-b", prosemirrorCommands.toggleMark(type));
    bind("Mod-B", prosemirrorCommands.toggleMark(type));
  }
  if (type = schema.marks.em) {
    bind("Mod-i", prosemirrorCommands.toggleMark(type));
    bind("Mod-I", prosemirrorCommands.toggleMark(type));
  }
  if (type = schema.marks.code) bind("Mod-`", prosemirrorCommands.toggleMark(type));
  if (type = schema.nodes.bullet_list) bind("Shift-Ctrl-8", prosemirrorSchemaList.wrapInList(type));
  if (type = schema.nodes.ordered_list) bind("Shift-Ctrl-9", prosemirrorSchemaList.wrapInList(type));
  if (type = schema.nodes.blockquote) bind("Ctrl->", prosemirrorCommands.wrapIn(type));
  if (type = schema.nodes.hard_break) {
    var br = type,
      cmd = prosemirrorCommands.chainCommands(prosemirrorCommands.exitCode, function (state, dispatch) {
        if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        return true;
      });
    bind("Mod-Enter", cmd);
    bind("Shift-Enter", cmd);
    if (mac) bind("Ctrl-Enter", cmd);
  }
  if (type = schema.nodes.list_item) {
    bind("Enter", prosemirrorSchemaList.splitListItem(type));
    bind("Mod-[", prosemirrorSchemaList.liftListItem(type));
    bind("Mod-]", prosemirrorSchemaList.sinkListItem(type));
  }
  if (type = schema.nodes.paragraph) bind("Shift-Ctrl-0", prosemirrorCommands.setBlockType(type));
  if (type = schema.nodes.code_block) bind("Shift-Ctrl-\\", prosemirrorCommands.setBlockType(type));
  if (type = schema.nodes.heading) for (var i = 1; i <= 6; i++) bind("Shift-Ctrl-" + i, prosemirrorCommands.setBlockType(type, {
    level: i
  }));
  if (type = schema.nodes.horizontal_rule) {
    var hr = type;
    bind("Mod-_", function (state, dispatch) {
      if (dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }
  return keys;
}
function blockQuoteRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^\s*>\s$/, nodeType);
}
function orderedListRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^(\d+)\.\s$/, nodeType, function (match) {
    return {
      order: +match[1]
    };
  }, function (match, node) {
    return node.childCount + node.attrs.order == +match[1];
  });
}
function bulletListRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}
function codeBlockRule(nodeType) {
  return prosemirrorInputrules.textblockTypeInputRule(/^```$/, nodeType);
}
function headingRule(nodeType, maxLevel) {
  return prosemirrorInputrules.textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, function (match) {
    return {
      level: match[1].length
    };
  });
}
function buildInputRules(schema) {
  var rules = prosemirrorInputrules.smartQuotes.concat(prosemirrorInputrules.ellipsis, prosemirrorInputrules.emDash),
    type;
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type));
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type));
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6));
  return prosemirrorInputrules.inputRules({
    rules: rules
  });
}
function exampleSetup(options) {
  var plugins = [buildInputRules(options.schema), prosemirrorKeymap.keymap(buildKeymap(options.schema, options.mapKeys)), prosemirrorKeymap.keymap(prosemirrorCommands.baseKeymap), prosemirrorDropcursor.dropCursor(), prosemirrorGapcursor.gapCursor()];
  if (options.menuBar !== false) plugins.push(prosemirrorMenu.menuBar({
    floating: options.floatingMenu !== false,
    content: options.menuContent || buildMenuItems(options.schema).fullMenu
  }));
  if (options.history !== false) plugins.push(prosemirrorHistory.history());
  return plugins.concat(new prosemirrorState.Plugin({
    props: {
      attributes: {
        "class": "ProseMirror-example-setup-style"
      }
    }
  }));
}
exports.buildInputRules = buildInputRules;
exports.buildKeymap = buildKeymap;
exports.buildMenuItems = buildMenuItems;
exports.exampleSetup = exampleSetup;
