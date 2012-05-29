//--
//-- Tiddler toolbar
//--

// Create a toolbar command button
//#  place - parent DOM element
//#  command - reference to config.commands[] member -or- name of member
//#  tiddler - reference to tiddler that toolbar applies to
//#  className - the class to give the button
config.macros.toolbar.createCommand = function(place,commandName,tiddler,className)
{
	if(typeof commandName != "string") {
		var c = null;
		var t;
		for(t in config.commands) {
			if(config.commands[t] == commandName)
				c = t;
		}
		commandName = c;
	}
	if((tiddler instanceof Tiddler) && (typeof commandName == "string")) {
		var command = config.commands[commandName];
		if(command.isEnabled ? command.isEnabled(tiddler) : this.isCommandEnabled(command,tiddler)) {
			var text = command.getText ? command.getText(tiddler) : this.getCommandText(command,tiddler);
			var tooltip = command.getTooltip ? command.getTooltip(tiddler) : this.getCommandTooltip(command,tiddler);
			var cmd = command.type == "popup" ? this.onClickPopup : this.onClickCommand;
			var btn = createTiddlyButton(null,text,tooltip,cmd);
			btn.setAttribute("commandName",commandName);
			btn.setAttribute("tiddler",tiddler.title);
			jQuery(btn).addClass("command_" + commandName);
			if(className)
				jQuery(btn).addClass(className);
			place.appendChild(btn);
		}
	}
};

config.macros.toolbar.isCommandEnabled = function(command,tiddler)
{
	var title = tiddler.title;
	var ro = tiddler.isReadOnly();
	var shadow = store.isShadowTiddler(title) && !store.tiddlerExists(title);
	return (!ro || (ro && !command.hideReadOnly)) && !(shadow && command.hideShadow);
};

config.macros.toolbar.getCommandText = function(command,tiddler)
{
	return (tiddler.isReadOnly() && command.readOnlyText) || command.text;
};

config.macros.toolbar.getCommandTooltip = function(command,tiddler)
{
	return (tiddler.isReadOnly() && command.readOnlyTooltip) || command.tooltip;
};

config.macros.toolbar.onClickCommand = function(ev)
{
	var e = ev || window.event;
	e.cancelBubble = true;
	if(e.stopPropagation) e.stopPropagation();
	var command = config.commands[this.getAttribute("commandName")];
	return command.handler(e,this,this.getAttribute("tiddler"));
};

config.macros.toolbar.onClickPopup = function(ev)
{
	var e = ev || window.event;
	e.cancelBubble = true;
	if(e.stopPropagation) e.stopPropagation();
	var popup = Popup.create(this);
	var command = config.commands[this.getAttribute("commandName")];
	var title = this.getAttribute("tiddler");
	popup.setAttribute("tiddler",title);
	command.handlePopup(popup,title);
	Popup.show();
	return false;
};

// Invoke the first command encountered from a given place that is tagged with a specified class
config.macros.toolbar.invokeCommand = function(place,className,event)
{
	var children = place.getElementsByTagName("a");
	var t;
	for(t=0; t<children.length; t++) {
		var c = children[t];
		if(jQuery(c).hasClass(className) && c.getAttribute && c.getAttribute("commandName")) {
			if(c.onclick instanceof Function)
				c.onclick.call(c,event);
			break;
		}
	}
};

config.macros.toolbar.onClickMore = function(ev)
{
	var e = this.nextSibling;
	e.style.display = "inline";
	this.style.display = "none";
	return false;
};

config.macros.toolbar.onClickLess = function(ev)
{
	var e = this.parentNode;
	var m = e.previousSibling;
	e.style.display = "none";
	m.style.display = "inline";
	return false;
};

config.macros.toolbar.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var t;
	for(t=0; t<params.length; t++) {
		var btn;
		var c = params[t];
		switch(c) {
		case "!":
			createTiddlyText(place,this.separator);
			break;
		case "*":
			createTiddlyElement(place,"br");
			break;
		case "<":
			btn = createTiddlyButton(place,this.lessLabel,this.lessPrompt,config.macros.toolbar.onClickLess);
			jQuery(btn).addClass("lessCommand");
			break;
		case ">":
			btn = createTiddlyButton(place,this.moreLabel,this.morePrompt,config.macros.toolbar.onClickMore);
			jQuery(btn).addClass("moreCommand");
			var e = createTiddlyElement(place,"span",null,"moreCommand");
			e.style.display = "none";
			place = e;
			break;
		default:
			var className = "";
			switch(c.substr(0,1)) {
			case "+":
				className = "defaultCommand";
				c = c.substr(1);
				break;
			case "-":
				className = "cancelCommand";
				c = c.substr(1);
				break;
			}
			if(config.commands[c]) {
				this.createCommand(place,c,tiddler,className);
			} else {
				this.customCommand(place,c,wikifier,tiddler);
			}
			break;
		}
	}
};

// Overrideable function to extend toolbar handler
config.macros.toolbar.customCommand = function(place,command,wikifier,tiddler)
{
};

