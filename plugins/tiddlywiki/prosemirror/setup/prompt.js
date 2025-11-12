/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/prompt.js
type: application/javascript
module-type: library

\*/

"use strict";


var prefix = "ProseMirror-prompt";

function openPrompt(options) {
	var wrapper = document.body.appendChild(document.createElement("div"));
	wrapper.className = prefix;

	var mouseOutside = function(e) { if(!wrapper.contains(e.target)) close(); };
	setTimeout(function() { window.addEventListener("mousedown", mouseOutside); }, 50);
	var close = function() {
		window.removeEventListener("mousedown", mouseOutside);
		if(wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
	};

	var domFields = [];
	for(var name in options.fields) domFields.push(options.fields[name].render());

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
	if(options.title) form.appendChild(document.createElement("h5")).textContent = options.title;
	domFields.forEach(function(field) {
		form.appendChild(document.createElement("div")).appendChild(field);
	});
	var buttons = form.appendChild(document.createElement("div"));
	buttons.className = prefix + "-buttons";
	buttons.appendChild(submitButton);
	buttons.appendChild(document.createTextNode(" "));
	buttons.appendChild(cancelButton);

	var box = wrapper.getBoundingClientRect();
	wrapper.style.top = ((window.innerHeight - box.height) / 2) + "px";
	wrapper.style.left = ((window.innerWidth - box.width) / 2) + "px";

	var submit = function() {
		var params = getValues(options.fields, domFields);
		if(params) {
			close();
			options.callback(params);
		}
	};

	form.addEventListener("submit", function(e) {
		e.preventDefault();
		submit();
	});

	form.addEventListener("keydown", function(e) {
		if(e.keyCode == 27) {
			e.preventDefault();
			close();
		} else if(e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
			e.preventDefault();
			submit();
		} else if(e.keyCode == 9) {
			window.setTimeout(function() {
				if(!wrapper.contains(document.activeElement)) close();
			}, 500);
		}
	});

	var input = form.elements[0];
	if(input) input.focus();
}

function getValues(fields, domFields) {
	var result = Object.create(null), i = 0;
	for(var name in fields) {
		var field = fields[name], dom = domFields[i++];
		var value = field.read(dom), bad = field.validate(value);
		if(bad) {
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
	msg.style.left = (dom.offsetLeft + dom.offsetWidth + 2) + "px";
	msg.style.top = (dom.offsetTop - 5) + "px";
	msg.className = "ProseMirror-invalid";
	msg.textContent = message;
	setTimeout(function() { parent.removeChild(msg); }, 1500);
}

function Field(options) {
	this.options = options;
}

Field.prototype.read = function(dom) { return dom.value; };

Field.prototype.validateType = function(value) { return null; };

Field.prototype.validate = function(value) {
	if(!value && this.options.required)
		return "Required field";
	return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
};

Field.prototype.clean = function(value) {
	return this.options.clean ? this.options.clean(value) : value;
};

function TextField(options) {
	Field.call(this, options);
}

TextField.prototype = Object.create(Field.prototype);

TextField.prototype.render = function() {
	var input = document.createElement("input");
	input.type = "text";
	input.placeholder = this.options.label;
	input.value = this.options.value || "";
	input.autocomplete = "off";
	return input;
};

function SelectField(options) {
	Field.call(this, options);
}

SelectField.prototype = Object.create(Field.prototype);

SelectField.prototype.render = function() {
	var select = document.createElement("select");
	for(var i = 0; i < this.options.options.length; i++) {
		var o = this.options.options[i];
		var opt = select.appendChild(document.createElement("option"));
		opt.value = o.value;
		opt.selected = o.value == this.options.value;
		opt.label = o.label;
	}
	return select;
};

exports.openPrompt = openPrompt;
exports.Field = Field;
exports.TextField = TextField;
exports.SelectField = SelectField;
