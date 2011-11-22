//--
//-- Story functions
//--

//# A story is a HTML div containing a sequence of tiddlers that can be manipulated
//# container - id of containing element
//# idPrefix - string prefix prepended to title to make ids for tiddlers in this story
function Story(containerId,idPrefix)
{
	this.container = containerId;
	this.idPrefix = idPrefix;
	this.highlightRegExp = null;
	//# generate tiddler ID
	this.tiddlerId = function(title) {
		//# replace spaces in titles to ensure valid element IDs
		title = title.replace(/_/g, "__").replace(/ /g, "_");
		var id = this.idPrefix + title;
		return id==this.container ? this.idPrefix + "_" + title : id;
	};
	this.containerId = function() {
		return this.container;
	};
}

//# retrieve tiddler element
Story.prototype.getTiddler = function(title)
{
	return document.getElementById(this.tiddlerId(title));
};

Story.prototype.getContainer = function()
{
	return document.getElementById(this.containerId());
};

//# Iterate through all the tiddlers currently opened in a story
//# fn - callback function to be called for each tiddler. Arguments are:
//#      tiddlerTitle - title of the tiddler
//#      element - reference to tiddler display element
Story.prototype.forEachTiddler = function(fn)
{
	var place = this.getContainer();
	if(!place)
		return;
	var e = place.firstChild;
	while(e) {
		var n = e.nextSibling;
		var title = e.getAttribute("tiddler");
		if(title) {
			fn.call(this,title,e);
		}
		e = n;
	}
};

Story.prototype.displayDefaultTiddlers = function()
{
	this.displayTiddlers(null,store.filterTiddlers(store.getTiddlerText("DefaultTiddlers")));
};

//# Display several tiddlers given their titles in an array. Parameters same as displayTiddler(), except:
//# titles - array of tiddlers or string titles
Story.prototype.displayTiddlers = function(srcElement,titles,template,animate,unused,customFields,toggle)
{
	var t;
	for(t = titles.length-1;t>=0;t--)
		this.displayTiddler(srcElement,titles[t],template,animate,unused,customFields);
};

//# Display a given tiddler with a given template. If the tiddler is already displayed but with a different
//# template, it is switched to the specified template. If the tiddler does not exist, and if server hosting
//# custom fields were provided, then an attempt is made to retrieve the tiddler from the server
//# srcElement - reference to element from which this one is being opened -or-
//#              special positions "top", "bottom"
//# tiddler - tiddler or title of tiddler to display
//# template - the name of the tiddler containing the template -or-
//#            one of the constants DEFAULT_VIEW_TEMPLATE and DEFAULT_EDIT_TEMPLATE -or-
//#            null or undefined to indicate the current template if there is one, DEFAULT_VIEW_TEMPLATE if not
//# animate - whether to perform animations
//# customFields - an optional list of name:"value" pairs to be assigned as tiddler fields (for edit templates)
//# toggle - if true, causes the tiddler to be closed if it is already opened
//# animationSrc - optional. If provided, this will specify the element which is to act as the start of the animation -or-
//#                the source of the animation will be the srcElement.
Story.prototype.displayTiddler = function(srcElement,tiddler,template,animate,unused,customFields,toggle,animationSrc)
{
	var title = (tiddler instanceof Tiddler) ? tiddler.title : tiddler;
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem) {
		if(toggle) {
			if(tiddlerElem.getAttribute("dirty") != "true")
				this.closeTiddler(title,true);
		} else {
			this.refreshTiddler(title,template,false,customFields);
		}
	} else {
		var place = this.getContainer();
		var before = this.positionTiddler(srcElement);
		tiddlerElem = this.createTiddler(place,before,title,template,customFields);
	}
	if(animationSrc && typeof animationSrc !== "string") {
		srcElement = animationSrc;
	}
	if(srcElement && typeof srcElement !== "string") {
		if(config.options.chkAnimate && (animate == undefined || animate == true) && anim && typeof Zoomer == "function" && typeof Scroller == "function")
			anim.startAnimating(new Zoomer(title,srcElement,tiddlerElem),new Scroller(tiddlerElem));
		else
			window.scrollTo(0,ensureVisible(tiddlerElem));
	}
	return tiddlerElem;
};

//# Figure out the appropriate position for a newly opened tiddler
//# srcElement - reference to the element containing the link to the tiddler -or-
//#              special positions "top", "bottom"
//# returns - reference to the tiddler that the new one should appear before (null for the bottom of the story)
Story.prototype.positionTiddler = function(srcElement)
{
	var place = this.getContainer();
	var before = null;
	if(typeof srcElement == "string") {
		switch(srcElement) {
		case "top":
			before = place.firstChild;
			break;
		case "bottom":
			before = null;
			break;
		}
	} else {
		var after = this.findContainingTiddler(srcElement);
		if(after == null) {
			before = place.firstChild;
		} else if(after.nextSibling) {
			before = after.nextSibling;
			if(before.nodeType != 1)
				before = null;
		}
	}
	return before;
};

//# Create a tiddler frame at the appropriate place in a story column. If the tiddler doesn't exist,
//# triggers an attempt to load it as a missing tiddler
//# place - reference to parent element
//# before - null, or reference to element before which to insert new tiddler
//# title - title of new tiddler
//# template - the name of the tiddler containing the template or one of the constants DEFAULT_VIEW_TEMPLATE and DEFAULT_EDIT_TEMPLATE
//# customFields - an optional list of name:"value" pairs to be assigned as tiddler fields
Story.prototype.createTiddler = function(place,before,title,template,customFields)
{
	var tiddlerElem = createTiddlyElement(null,"div",this.tiddlerId(title),"tiddler");
	tiddlerElem.setAttribute("refresh","tiddler");
	if(customFields)
		tiddlerElem.setAttribute("tiddlyFields",customFields);
	place.insertBefore(tiddlerElem,before);
	var defaultText = null;
	if(!store.tiddlerExists(title) && !store.isShadowTiddler(title))
		defaultText = this.loadMissingTiddler(title,customFields);
	this.refreshTiddler(title,template,false,customFields,defaultText);
	return tiddlerElem;
};

//# Attempts to load a missing tiddler from the server specified in the custom fields
//#   title - title of the missing tiddler
//#   fields - string of name:"value" pairs or hashmap
//#   callback - optional function invoked with context argument upon completion; context provides context.tiddler if successful
Story.prototype.loadMissingTiddler = function(title,fields,callback)
{
	var getTiddlerCallback = function(context)
	{
		if(context.status) {
			var t = context.tiddler;
			if(!t.created)
				t.created = new Date();
			if(!t.modified)
				t.modified = t.created;
			var dirty = store.isDirty();
			context.tiddler = store.saveTiddler(t.title,t.title,t.text,t.modifier,t.modified,t.tags,t.fields,true,t.created,t.creator);
			if(window.location.protocol != "file:")
				store.setDirty(dirty);
			autoSaveChanges();
		} else {
			story.refreshTiddler(context.title,null,true);
		}
		context.adaptor.close();
		if(callback) {
			callback(context);
		}
	};
	var tiddler = new Tiddler(title);
	tiddler.fields = typeof fields == "string" ? fields.decodeHashMap() : fields||{};
	var context = {serverType:tiddler.getServerType()};
	if(!context.serverType)
		return "";
	context.host = tiddler.fields['server.host'];
	context.workspace = tiddler.fields['server.workspace'];
	var adaptor = new config.adaptors[context.serverType]();
	adaptor.getTiddler(title,context,null,getTiddlerCallback);
	return config.messages.loadingMissingTiddler.format([title,context.serverType,context.host,context.workspace]);
};

//# Overridable for choosing the name of the template to apply for a tiddler
Story.prototype.chooseTemplateForTiddler = function(title,template)
{
	if(!template)
		template = DEFAULT_VIEW_TEMPLATE;
	if(template == DEFAULT_VIEW_TEMPLATE || template == DEFAULT_EDIT_TEMPLATE)
		template = config.tiddlerTemplates[template];
	return template;
};

//# Overridable for extracting the text of a template from a tiddler
Story.prototype.getTemplateForTiddler = function(title,template,tiddler)
{
	return store.getRecursiveTiddlerText(template,null,10);
};

//# Apply a template to an existing tiddler if it is not already displayed using that template
//# title - title of tiddler to update
//# template - the name of the tiddler containing the template or one of the constants DEFAULT_VIEW_TEMPLATE and DEFAULT_EDIT_TEMPLATE
//# force - if true, forces the refresh even if the template hasn't changed
//# customFields - an optional list of name/value pairs to be assigned as tiddler fields (for edit templates)
//# defaultText - an optional string to replace the default text for non-existent tiddlers
Story.prototype.refreshTiddler = function(title,template,force,customFields,defaultText)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem) {
		if(tiddlerElem.getAttribute("dirty") == "true" && !force)
			return tiddlerElem;
		template = this.chooseTemplateForTiddler(title,template);
		var currTemplate = tiddlerElem.getAttribute("template");
		if((template != currTemplate) || force) {
			var tiddler = store.getTiddler(title);
			if(!tiddler) {
				tiddler = new Tiddler();
				if(store.isShadowTiddler(title)) {
					var tags = [];
					tiddler.set(title,store.getTiddlerText(title),config.views.wikified.shadowModifier,version.date,tags,version.date);
				} else {
					var text = template=="EditTemplate" ?
								config.views.editor.defaultText.format([title]) :
								config.views.wikified.defaultText.format([title]);
					text = defaultText || text;
					var fields = customFields ? customFields.decodeHashMap() : null;
					tiddler.set(title,text,config.views.wikified.defaultModifier,version.date,[],version.date,fields);
				}
			}
			tiddlerElem.setAttribute("tags",tiddler.tags.join(" "));
			tiddlerElem.setAttribute("tiddler",title);
			tiddlerElem.setAttribute("template",template);
			tiddlerElem.onmouseover = this.onTiddlerMouseOver;
			tiddlerElem.onmouseout = this.onTiddlerMouseOut;
			tiddlerElem.ondblclick = this.onTiddlerDblClick;
			tiddlerElem[window.event?"onkeydown":"onkeypress"] = this.onTiddlerKeyPress;
			tiddlerElem.innerHTML = this.getTemplateForTiddler(title,template,tiddler);
			applyHtmlMacros(tiddlerElem,tiddler);
			if(store.getTaggedTiddlers(title).length > 0)
				jQuery(tiddlerElem).addClass("isTag");
			else
				jQuery(tiddlerElem).removeClass("isTag");
			if(store.tiddlerExists(title)) {
				jQuery(tiddlerElem).removeClass("shadow");
				jQuery(tiddlerElem).removeClass("missing");
			} else {
				jQuery(tiddlerElem).addClass(store.isShadowTiddler(title) ? "shadow" : "missing");
			}
			if(customFields)
				this.addCustomFields(tiddlerElem,customFields);
		}
	}
	return tiddlerElem;
};

//# Add hidden input elements for the custom fields of a tiddler
Story.prototype.addCustomFields = function(place,customFields)
{
	var fields = customFields.decodeHashMap();
	var w = createTiddlyElement(place,"div",null,"customFields");
	w.style.display = "none";
	var t;
	for(t in fields) {
		var e = document.createElement("input");
		e.setAttribute("type","text");
		e.setAttribute("value",fields[t]);
		w.appendChild(e);
		e.setAttribute("edit",t);
	}
};

//# Refresh all tiddlers in the Story
Story.prototype.refreshAllTiddlers = function(force)
{
	var e = this.getContainer().firstChild;
	while(e) {
		var template = e.getAttribute("template");
		if(template && e.getAttribute("dirty") != "true") {
			this.refreshTiddler(e.getAttribute("tiddler"),force ? null : template,true);
		}
		e = e.nextSibling;
	}
};

//# Default tiddler onmouseover/out event handlers
Story.prototype.onTiddlerMouseOver = function(e)
{
	jQuery(this).addClass("selected");
};

Story.prototype.onTiddlerMouseOut = function(e)
{
	jQuery(this).removeClass("selected");
};

//# Default tiddler ondblclick event handler
Story.prototype.onTiddlerDblClick = function(ev)
{
	var e = ev || window.event;
	var target = resolveTarget(e);
	if(target && target.nodeName.toLowerCase() != "input" && target.nodeName.toLowerCase() != "textarea") {
		if(document.selection && document.selection.empty)
			document.selection.empty();
		config.macros.toolbar.invokeCommand(this,"defaultCommand",e);
		e.cancelBubble = true;
		if(e.stopPropagation) e.stopPropagation();
		return true;
	}
	return false;
};

Story.prototype.onTiddlerKeyPress = function(ev)
{
	var e = ev || window.event;
	clearMessage();
	var consume = false;
	var title = this.getAttribute("tiddler");
	var target = resolveTarget(e);
	switch(e.keyCode) {
	case 9: // Tab
		var ed = story.getTiddlerField(title,"text");
		if(target.tagName.toLowerCase() == "input" && ed.value==config.views.editor.defaultText.format([title])) {
			// moving from input field and editor still contains default text, so select it
			ed.focus();
			ed.select();
			consume = true;
		}
		if(config.options.chkInsertTabs && target.tagName.toLowerCase() == "textarea") {
			replaceSelection(target,String.fromCharCode(9));
			consume = true;
		}
		if(config.isOpera) {
			target.onblur = function() {
				this.focus();
				this.onblur = null;
			};
		}
		break;
	case 13: // Ctrl-Enter
	case 10: // Ctrl-Enter on IE PC
	case 77: // Ctrl-Enter is "M" on some platforms
		if(e.ctrlKey) {
			blurElement(this);
			config.macros.toolbar.invokeCommand(this,"defaultCommand",e);
			consume = true;
		}
		break;
	case 27: // Escape
		blurElement(this);
		config.macros.toolbar.invokeCommand(this,"cancelCommand",e);
		consume = true;
		break;
	}
	e.cancelBubble = consume;
	if(consume) {
		if(e.stopPropagation) e.stopPropagation(); // Stop Propagation
		e.returnValue = true; // Cancel The Event in IE
		if(e.preventDefault ) e.preventDefault(); // Cancel The Event in Moz
	}
	return !consume;
};

//# Returns the specified field (input or textarea element) in a tiddler, otherwise the first edit field it finds
//# or null if it found no edit field at all
Story.prototype.getTiddlerField = function(title,field)
{
	var tiddlerElem = this.getTiddler(title);
	var e = null;
	if(tiddlerElem) {
		var t,children = tiddlerElem.getElementsByTagName("*");
		for(t=0; t<children.length; t++) {
			var c = children[t];
			if(c.tagName.toLowerCase() == "input" || c.tagName.toLowerCase() == "textarea") {
				if(!e)
					e = c;
				if(c.getAttribute("edit") == field)
					e = c;
			}
		}
	}
	return e;
};

//# Focus a specified tiddler. Attempts to focus the specified field, otherwise the first edit field it finds
Story.prototype.focusTiddler = function(title,field)
{
	var e = this.getTiddlerField(title,field);
	if(e) {
		e.focus();
		e.select();
	}
};

//# Ensures that a specified tiddler does not have the focus
Story.prototype.blurTiddler = function(title)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem && tiddlerElem.focus && tiddlerElem.blur) {
		tiddlerElem.focus();
		tiddlerElem.blur();
	}
};

//# Adds a specified value to the edit controls (if any) of a particular
//# array-formatted field of a particular tiddler (eg "tags")
//#  title - name of tiddler
//#  tag - value of field, without any [[brackets]]
//#  mode - +1 to add the tag, -1 to remove it, 0 to toggle it
//#  field - name of field (eg "tags")
Story.prototype.setTiddlerField = function(title,tag,mode,field)
{
	var c = this.getTiddlerField(title,field);
	var tags = c.value.readBracketedList();
	tags.setItem(tag,mode);
	c.value = String.encodeTiddlyLinkList(tags);
};

//# The same as setTiddlerField but preset to the "tags" field
Story.prototype.setTiddlerTag = function(title,tag,mode)
{
	this.setTiddlerField(title,tag,mode,"tags");
};

//# Close a specified tiddler
//# title - name of tiddler to close
//# animate - whether to perform animations
Story.prototype.closeTiddler = function(title,animate,unused)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem) {
		clearMessage();
		this.scrubTiddler(tiddlerElem);
		if(config.options.chkAnimate && animate && anim && typeof Slider == "function")
			anim.startAnimating(new Slider(tiddlerElem,false,null,"all"));
		else {
			jQuery(tiddlerElem).remove();
		}
	}
};

//# Scrub IDs from a tiddler. This is so that the 'ghost' of a tiddler while it is being closed
//# does not interfere with things
//# tiddlerElem - reference to the tiddler element
Story.prototype.scrubTiddler = function(tiddlerElem)
{
	tiddlerElem.id = null;
};

//# Set the 'dirty' flag of a tiddler
//# title - title of tiddler to change
//# dirty - new boolean status of flag
Story.prototype.setDirty = function(title,dirty)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem)
		tiddlerElem.setAttribute("dirty",dirty ? "true" : "false");
};

//# Is a particular tiddler dirty (with unsaved changes)?
Story.prototype.isDirty = function(title)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem)
		return tiddlerElem.getAttribute("dirty") == "true";
	return null;
};

//# Determine whether any open tiddler are dirty
Story.prototype.areAnyDirty = function()
{
	var r = false;
	this.forEachTiddler(function(title,element) {
		if(this.isDirty(title))
			r = true;
	});
	return r;
};

//# Close all tiddlers in the story
Story.prototype.closeAllTiddlers = function(exclude)
{
	clearMessage();
	this.forEachTiddler(function(title,element) {
		if((title != exclude) && element.getAttribute("dirty") != "true")
			this.closeTiddler(title);
	});
	window.scrollTo(0,ensureVisible(this.container));
};

//# Check if there are any tiddlers in the story
Story.prototype.isEmpty = function()
{
	var place = this.getContainer();
	return place && place.firstChild == null;
};

//# Perform a search and display the result
//# text - text to search for
//# useCaseSensitive - true for case sensitive matching
//# useRegExp - true to interpret text as a RegExp
Story.prototype.search = function(text,useCaseSensitive,useRegExp)
{
	this.closeAllTiddlers();
	highlightHack = new RegExp(useRegExp ? text : text.escapeRegExp(),useCaseSensitive ? "mg" : "img");
	var matches = store.search(highlightHack,"title","excludeSearch");
	this.displayTiddlers(null,matches);
	highlightHack = null;
	var q = useRegExp ? "/" : "'";
	if(matches.length > 0)
		displayMessage(config.macros.search.successMsg.format([matches.length.toString(),q + text + q]));
	else
		displayMessage(config.macros.search.failureMsg.format([q + text + q]));
};

//# Determine if the specified element is within a tiddler in this story
//# e - reference to an element
//# returns: reference to a tiddler element or null if none
Story.prototype.findContainingTiddler = function(e)
{
	while(e && !jQuery(e).hasClass("tiddler")) {
		e = jQuery(e).hasClass("popup") && Popup.stack[0] ? Popup.stack[0].root : e.parentNode;
	}
	return e;
};

//# Gather any saveable fields from a tiddler element
//# e - reference to an element to scan recursively
//# fields - object to contain gathered field values
Story.prototype.gatherSaveFields = function(e,fields)
{
	if(e && e.getAttribute) {
		var f = e.getAttribute("edit");
		if(f)
			fields[f] = e.value.replace(/\r/mg,"");
		if(e.hasChildNodes()) {
			var t,c = e.childNodes;
			for(t=0; t<c.length; t++)
				this.gatherSaveFields(c[t],fields);
		}
	}
};

//# Determine whether a tiddler has any edit fields, and if so if their values have been changed
//# title - name of tiddler
Story.prototype.hasChanges = function(title)
{
	var e = this.getTiddler(title);
	if(e) {
		var fields = {};
		this.gatherSaveFields(e,fields);
		if(store.fetchTiddler(title)) {
		    var n;
			for(n in fields) {
				if(store.getValue(title,n) != fields[n]) //# tiddler changed
					return true;
			}
		} else {
			if(store.isShadowTiddler(title) && store.getShadowTiddlerText(title) == fields.text) { //# not checking for title or tags
				return false;
			} else { //# changed shadow or new tiddler
				return true;
			}
		}
	}
	return false;
};

//# Save any open edit fields of a tiddler and updates the display as necessary
//# title - name of tiddler
//# minorUpdate - true if the modified date shouldn't be updated
//# returns: title of saved tiddler, or null if not saved
Story.prototype.saveTiddler = function(title,minorUpdate)
{
	var tiddlerElem = this.getTiddler(title);
	if(tiddlerElem) {
		var fields = {};
		this.gatherSaveFields(tiddlerElem,fields);
		var newTitle = fields.title || title;
		if(!store.tiddlerExists(newTitle)) {
			newTitle = newTitle.trim();
			var creator = config.options.txtUserName;
		}
		if(store.tiddlerExists(newTitle) && newTitle != title) {
			if(!confirm(config.messages.overwriteWarning.format([newTitle.toString()])))
				return null;
				title = newTitle;
		}
		if(newTitle != title)
			this.closeTiddler(newTitle,false);
		tiddlerElem.id = this.tiddlerId(newTitle);
		tiddlerElem.setAttribute("tiddler",newTitle);
		tiddlerElem.setAttribute("template",DEFAULT_VIEW_TEMPLATE);
		tiddlerElem.setAttribute("dirty","false");
		if(config.options.chkForceMinorUpdate)
			minorUpdate = !minorUpdate;
		if(!store.tiddlerExists(newTitle))
			minorUpdate = false;
		var newDate = new Date();
		if(store.tiddlerExists(title)) {
			var t = store.fetchTiddler(title);
			var extendedFields = t.fields;
			creator = t.creator;
		} else {
			extendedFields = merge({},config.defaultCustomFields);
		}
		var n;
		for(n in fields) {
			if(!TiddlyWiki.isStandardField(n))
				extendedFields[n] = fields[n];
		}
		var tiddler = store.saveTiddler(title,newTitle,fields.text,minorUpdate ? undefined : config.options.txtUserName,minorUpdate ? undefined : newDate,fields.tags,extendedFields,null,null,creator);
		autoSaveChanges(null,[tiddler]);
		return newTitle;
	}
	return null;
};

Story.prototype.permaView = function()
{
	var links = [];
	this.forEachTiddler(function(title,element) {
		links.push(String.encodeTiddlyLink(title));
	});
	var t = encodeURIComponent(links.join(" "));
	if(t == "")
		t = "#";
	if(window.location.hash != t)
		window.location.hash = t;
};

Story.prototype.switchTheme = function(theme)
{
	if(safeMode)
		return;

	var isAvailable = function(title) {
		var s = title ? title.indexOf(config.textPrimitives.sectionSeparator) : -1;
		if(s!=-1)
			title = title.substr(0,s);
		return store.tiddlerExists(title) || store.isShadowTiddler(title);
	};

	var getSlice = function(theme,slice) {
		var r;
		if(readOnly)
			r = store.getTiddlerSlice(theme,slice+"ReadOnly") || store.getTiddlerSlice(theme,"Web"+slice);
		r = r || store.getTiddlerSlice(theme,slice);
		if(r && r.indexOf(config.textPrimitives.sectionSeparator)==0)
			r = theme + r;
		return isAvailable(r) ? r : slice;
	};

	var replaceNotification = function(i,name,theme,slice) {
		var newName = getSlice(theme,slice);
		if(name!=newName && store.namedNotifications[i].name==name) {
			store.namedNotifications[i].name = newName;
			return newName;
		}
		return name;
	};

	var pt = config.refresherData.pageTemplate;
	var vi = DEFAULT_VIEW_TEMPLATE;
	var vt = config.tiddlerTemplates[vi];
	var ei = DEFAULT_EDIT_TEMPLATE;
	var et = config.tiddlerTemplates[ei];

	var i;
	for(i=0; i<config.notifyTiddlers.length; i++) {
		var name = config.notifyTiddlers[i].name;
		switch(name) {
		case "PageTemplate":
			config.refresherData.pageTemplate = replaceNotification(i,config.refresherData.pageTemplate,theme,name);
			break;
		case "StyleSheet":
			removeStyleSheet(config.refresherData.styleSheet);
			config.refresherData.styleSheet = replaceNotification(i,config.refresherData.styleSheet,theme,name);
			break;
		case "ColorPalette":
			config.refresherData.colorPalette = replaceNotification(i,config.refresherData.colorPalette,theme,name);
			break;
		default:
			break;
		}
	}
	config.tiddlerTemplates[vi] = getSlice(theme,"ViewTemplate");
	config.tiddlerTemplates[ei] = getSlice(theme,"EditTemplate");
	if(!startingUp) {
		if(config.refresherData.pageTemplate!=pt || config.tiddlerTemplates[vi]!=vt || config.tiddlerTemplates[ei]!=et) {
			refreshAll();
			this.refreshAllTiddlers(true);
		} else {
			setStylesheet(store.getRecursiveTiddlerText(config.refresherData.styleSheet,"",10),config.refreshers.styleSheet);
		}
		config.options.txtTheme = theme;
		saveOption("txtTheme");
	}
};

