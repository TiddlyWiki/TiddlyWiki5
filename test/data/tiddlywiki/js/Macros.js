//--
//-- Macro definitions
//--

function invokeMacro(place,macro,params,wikifier,tiddler)
{
	try {
		var m = config.macros[macro];
		if(m && m.handler) {
			var tiddlerElem = story.findContainingTiddler(place);
			//# Provide context for evaluated macro parameters (eg <<myMacro {{tiddler.title}}>>)
			window.tiddler = tiddlerElem ? store.getTiddler(tiddlerElem.getAttribute("tiddler")) : null;
			window.place = place;
			var allowEval = true;
			if(config.evaluateMacroParameters=="system") {
				if(!tiddler || tiddler.tags.indexOf("systemAllowEval") == -1) {
					allowEval = false;
				}
			}
			m.handler(place,macro,m.noPreParse?null:params.readMacroParams(!allowEval),wikifier,params,tiddler);
		} else {
			createTiddlyError(place,config.messages.macroError.format([macro]),config.messages.macroErrorDetails.format([macro,config.messages.missingMacro]));
		}
	} catch(ex) {
		createTiddlyError(place,config.messages.macroError.format([macro]),config.messages.macroErrorDetails.format([macro,ex.toString()]));
	}
}

config.macros.version.handler = function(place)
{
	jQuery("<span/>").text(formatVersion()).appendTo(place);
};

config.macros.today.handler = function(place,macroName,params)
{
	var now = new Date();
	var text = params[0] ? now.formatString(params[0].trim()) : now.toLocaleString();
	jQuery("<span/>").text(text).appendTo(place);
};

config.macros.list.template = "<<view title link>>";
config.macros.list.handler = function(place,macroName,params,wikifier,paramString)
{
	var list = document.createElement("ul");
	jQuery(list).attr({ refresh: "macro", macroName: macroName }).data("params", paramString);
	place.appendChild(list);
	this.refresh(list);
};

config.macros.list.refresh = function(list) {
	var paramString = jQuery(list).data("params");
	var params = paramString.readMacroParams();
	var args = paramString.parseParams("anon", null, null)[0];
	var type = args.anon ? args.anon[0] : "all";
	jQuery(list).empty().addClass("list list-" + type);
	var template = args.template ? store.getTiddlerText(args.template[0]) : false;
	if(!template) {
		template = config.macros.list.template;
	}
	if(this[type].prompt)
		createTiddlyElement(list,"li",null,"listTitle",this[type].prompt);
	var results;
	if(this[type].handler)
		results = this[type].handler(params);
	var t;
	for(t = 0; t < results.length; t++) {
		var li = document.createElement("li");
		list.appendChild(li);
		var tiddler = results[t];
		if(typeof(tiddler) == 'string') { // deal with missing etc..
				tiddler = store.getTiddler(tiddler) || new Tiddler(tiddler);
		}
		wikify(template, li, null, tiddler);
	}
	if(results.length === 0 && args.emptyMessage) {
		jQuery(list).addClass("emptyList");
		jQuery("<li />").text(args.emptyMessage[0]).appendTo(list);
	}
};

config.macros.list.all.handler = function(params)
{
	return store.reverseLookup("tags","excludeLists",false,"title");
};

config.macros.list.missing.handler = function(params)
{
	return store.getMissingLinks();
};

config.macros.list.orphans.handler = function(params)
{
	return store.getOrphans();
};

config.macros.list.shadowed.handler = function(params)
{
	return store.getShadowed();
};

config.macros.list.touched.handler = function(params)
{
	return store.getTouched();
};

config.macros.list.filter.handler = function(params)
{
	var filter = params[1];
	var results = [];
	if(filter) {
		var tiddlers = store.filterTiddlers(filter);
		var t;
		for(t=0; t<tiddlers.length; t++)
			results.push(tiddlers[t].title);
	}
	return results;
};

config.macros.allTags.handler = function(place,macroName,params)
{
	var tags = store.getTags(params[0]);
	var ul = createTiddlyElement(place,"ul");
	if(tags.length == 0)
		createTiddlyElement(ul,"li",null,"listTitle",this.noTags);
	var t;
	for(t=0; t<tags.length; t++) {
		var title = tags[t][0];
		var info = getTiddlyLinkInfo(title);
		var li = createTiddlyElement(ul,"li");
		var btn = createTiddlyButton(li,title + " (" + tags[t][1] + ")",this.tooltip.format([title]),onClickTag,info.classes);
		btn.setAttribute("tag",title);
		btn.setAttribute("refresh","link");
		btn.setAttribute("tiddlyLink",title);
		if(params[1]) {
			btn.setAttribute("sortby",params[1]);
		}
	}
};

var macro = config.macros.timeline;
merge(macro, {
	handler: function(place,macroName,params, wikifier, paramString, tiddler) {
		var container = jQuery("<div />").attr("params", paramString).
			attr("macroName", macroName).appendTo(place)[0];
		macro.refresh(container);
	},
	refresh: function(container) {
		jQuery(container).attr("refresh", "macro").empty();
		var paramString = jQuery(container).attr("params");
		var args = paramString.parseParams("anon", null, null)[0];
		var params = args.anon || [];

		var field = params[0] || "modified";
		var dateFormat = params[2] || this.dateFormat;
		var groupTemplate = macro.groupTemplate.format(field, dateFormat);
		groupTemplate = args.groupTemplate ? store.getTiddlerText(args.groupTemplate[0]) || groupTemplate :
			groupTemplate;

		var itemTemplate = macro.itemTemplate;
		itemTemplate = args.template ? store.getTiddlerText(args.template[0]) || itemTemplate :
			itemTemplate;

		var tiddlers = args.filter ? store.sortTiddlers(store.filterTiddlers(args.filter[0]), field) :
			store.reverseLookup("tags", "excludeLists", false, field);
		var lastGroup = "", ul;
		var last = params[1] ? tiddlers.length-Math.min(tiddlers.length,parseInt(params[1],10)) : 0;
		var t;
		for(t=tiddlers.length-1; t>=last; t--) {
			var tiddler = tiddlers[t];
			var theGroup = wikifyPlainText(groupTemplate,0,tiddler);
			if(typeof(ul) == "undefined" || theGroup != lastGroup) {
				ul = document.createElement("ul");
				jQuery(ul).addClass("timeline");
				container.appendChild(ul);
				createTiddlyElement(ul,"li",null,"listTitle",theGroup);
				lastGroup = theGroup;
			}
			var item = createTiddlyElement(ul,"li",null,"listLink");
			wikify(itemTemplate,item,null,tiddler);
		}
	},
	groupTemplate: "<<view %0 date '%1'>>", 
	itemTemplate: "<<view title link>>"
});

config.macros.tiddler.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var allowEval = true;
	var stack = config.macros.tiddler.tiddlerStack;
	if(stack.length > 0 && config.evaluateMacroParameters == "system") {
		// included tiddler and "system" evaluation required, so check tiddler tagged appropriately
		var title = stack[stack.length-1];
		var pos = title.indexOf(config.textPrimitives.sectionSeparator);
		if(pos != -1) {
			title = title.substr(0,pos); // get the base tiddler title
		}
		var t = store.getTiddler(title);
		if(!t || t.tags.indexOf("systemAllowEval") == -1) {
			allowEval = false;
		}
	}
	params = paramString.parseParams("name",null,allowEval,false,true);
	var names = params[0]["name"];
	var tiddlerName = names[0];
	var className = names[1] || null;
	var args = params[0]["with"];
	var wrapper = createTiddlyElement(place,"span",null,className,null,{
		refresh: "content", tiddler: tiddlerName
	});
	if(args!==undefined)
		wrapper.setAttribute("args","[["+args.join("]] [[")+"]]");
	this.transclude(wrapper,tiddlerName,args);
};

config.macros.tiddler.transclude = function(wrapper,tiddlerName,args)
{
	var text = store.getTiddlerText(tiddlerName);
	if(!text)
		return;
	var stack = config.macros.tiddler.tiddlerStack;
	if(stack.indexOf(tiddlerName) !== -1)
		return;
	stack.push(tiddlerName);
	try {
		if(typeof args == "string")
			args = args.readBracketedList();
		var n = args ? Math.min(args.length,9) : 0;
		var i;
		for(i=0; i<n; i++) {
			var placeholderRE = new RegExp("\\$" + (i + 1),"mg");
			text = text.replace(placeholderRE,args[i]);
		}
		config.macros.tiddler.renderText(wrapper,text,tiddlerName);
	} finally {
		stack.pop();
	}
};

config.macros.tiddler.renderText = function(place,text,tiddlerName)
{
	wikify(text,place,null,store.getTiddler(tiddlerName));
};

config.macros.tiddler.tiddlerStack = [];

//# params[0] - tag
//# params[1] - title (optional)
//# params[2] - tooltip (optional)
//# params[3] - sortby (optional)
config.macros.tag.handler = function(place,macroName,params)
{
	var btn = createTagButton(place,params[0],null,params[1],params[2]);
	if(params[3]) {
		btn.setAttribute('sortby',params[3]);
	}
};

config.macros.tags.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	params = paramString.parseParams("anon",null,true,false,false);
	var ul = createTiddlyElement(place,"ul");
	var title = getParam(params,"anon","");
	if(title && store.tiddlerExists(title))
		tiddler = store.getTiddler(title);
	var sep = getParam(params,"sep"," ");
	var lingo = config.views.wikified.tag;
	var label = null;
	var t;
	for(t=0; t<tiddler.tags.length; t++) {
		var tag = store.getTiddler(tiddler.tags[t]);
		if(!tag || !tag.tags.contains("excludeLists")) {
			if(!label)
				label = createTiddlyElement(ul,"li",null,"listTitle",lingo.labelTags.format([tiddler.title]));
			createTagButton(createTiddlyElement(ul,"li"),tiddler.tags[t],tiddler.title);
			if(t<tiddler.tags.length-1)
				createTiddlyText(ul,sep);
		}
	}
	if(!label)
		createTiddlyElement(ul,"li",null,"listTitle",lingo.labelNoTags.format([tiddler.title]));
};

config.macros.tagging.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	params = paramString.parseParams("anon",null,true,false,false);
	var ul = createTiddlyElement(place,"ul");
	var title = getParam(params,"anon","");
	if(title == "" && tiddler instanceof Tiddler)
		title = tiddler.title;
	var sep = getParam(params,"sep"," ");
	ul.setAttribute("title",this.tooltip.format([title]));
	var sortby = getParam(params,"sortBy",false);
	var tagged = store.getTaggedTiddlers(title,sortby);
	var prompt = tagged.length == 0 ? this.labelNotTag : this.label;
	createTiddlyElement(ul,"li",null,"listTitle",prompt.format([title,tagged.length]));
	var t;
	for(t=0; t<tagged.length; t++) {
		createTiddlyLink(createTiddlyElement(ul,"li"),tagged[t].title,true);
		if(t<tagged.length-1)
			createTiddlyText(ul,sep);
	}
};

config.macros.closeAll.handler = function(place)
{
	createTiddlyButton(place,this.label,this.prompt,this.onClick);
};

config.macros.closeAll.onClick = function(e)
{
	story.closeAllTiddlers();
	return false;
};

config.macros.permaview.handler = function(place)
{
	createTiddlyButton(place,this.label,this.prompt,this.onClick);
};

config.macros.permaview.onClick = function(e)
{
	story.permaView();
	return false;
};

config.macros.saveChanges.handler = function(place,macroName,params)
{
	if(!readOnly)
		createTiddlyButton(place,params[0] || this.label,params[1] || this.prompt,this.onClick,null,null,this.accessKey);
};

config.macros.saveChanges.onClick = function(e)
{
	saveChanges();
	return false;
};

config.macros.slider.onClickSlider = function(ev)
{
	var n = this.nextSibling;
	var cookie = n.getAttribute("cookie");
	var isOpen = n.style.display != "none";
	if(config.options.chkAnimate && anim && typeof Slider == "function")
		anim.startAnimating(new Slider(n,!isOpen,null,"none"));
	else
		n.style.display = isOpen ? "none" : "block";
	config.options[cookie] = !isOpen;
	saveOption(cookie);
	return false;
};

config.macros.slider.createSlider = function(place,cookie,title,tooltip)
{
	var c = cookie || "";
	createTiddlyButton(place,title,tooltip,this.onClickSlider);
	var panel = createTiddlyElement(null,"div",null,"sliderPanel");
	panel.setAttribute("cookie",c);
	panel.style.display = config.options[c] ? "block" : "none";
	place.appendChild(panel);
	return panel;
};

config.macros.slider.handler = function(place,macroName,params)
{
	var panel = this.createSlider(place,params[0],params[2],params[3]);
	var text = store.getTiddlerText(params[1]);
	panel.setAttribute("refresh","content");
	panel.setAttribute("tiddler",params[1]);
	if(text)
		wikify(text,panel,null,store.getTiddler(params[1]));
};

// <<gradient [[tiddler name]] vert|horiz rgb rgb rgb rgb... >>
config.macros.gradient.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var panel = wikifier ? createTiddlyElement(place,"div",null,"gradient") : place;
	panel.style.position = "relative";
	panel.style.overflow = "hidden";
	panel.style.zIndex = "0";
	if(wikifier) {
		var styles = config.formatterHelpers.inlineCssHelper(wikifier);
		config.formatterHelpers.applyCssHelper(panel,styles);
	}
	params = paramString.parseParams("color");
	var locolors = [], hicolors = [];
	var t;
	for(t=2; t<params.length; t++) {
		var c = params[t].value;
		if(params[t].name == "snap") {
			hicolors[hicolors.length-1] = c;
		} else {
			locolors.push(c);
			hicolors.push(c);
		}
	}
	drawGradient(panel,params[1].value != "vert",locolors,hicolors);
	if(wikifier)
		wikifier.subWikify(panel,">>");
	if(document.all) {
		panel.style.height = "100%";
		panel.style.width = "100%";
	}
};

config.macros.message.handler = function(place,macroName,params)
{
	if(params[0]) {
		var names = params[0].split(".");
		var lookupMessage = function(root,nameIndex) {
				if(root[names[nameIndex]]) {
					if(nameIndex < names.length-1)
						return (lookupMessage(root[names[nameIndex]],nameIndex+1));
					else
						return root[names[nameIndex]];
				} else
					return null;
			};
		var m = lookupMessage(config,0);
		if(m == null)
			m = lookupMessage(window,0);
		createTiddlyText(place,m.toString().format(params.splice(1)));
	}
};


config.macros.view.depth = 0;
config.macros.view.values = [];
config.macros.view.views = {
	text: function(value,place,params,wikifier,paramString,tiddler) {
		highlightify(value,place,highlightHack,tiddler);
	},
	link: function(value,place,params,wikifier,paramString,tiddler) {
		createTiddlyLink(place,value,true);
	},
	wikified: function(value,place,params,wikifier,paramString,tiddler) {
		if(config.macros.view.depth>50)
			return;
		if(config.macros.view.depth>0) {
			if (value==config.macros.view.values[config.macros.view.depth-1]) {
				return;
			}
		}
		config.macros.view.values[config.macros.view.depth] = value;
		config.macros.view.depth++;
		if(params[2])
			value=params[2].unescapeLineBreaks().format([value]);
		wikify(value,place,highlightHack,tiddler);
		config.macros.view.depth--;
		config.macros.view.values[config.macros.view.depth] = null;
	},
	date: function(value,place,params,wikifier,paramString,tiddler) {
		value = Date.convertFromYYYYMMDDHHMM(value);
		createTiddlyText(place,value.formatString(params[2] || config.views.wikified.dateFormat));
	}
};

config.macros.view.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	if((tiddler instanceof Tiddler) && params[0]) {
		var value = store.getValue(tiddler,params[0]);
		if(value) {
			var type = params[1] || config.macros.view.defaultView;
			var handler = config.macros.view.views[type];
			if(handler)
				handler(value,place,params,wikifier,paramString,tiddler);
		}
	}
};

config.macros.edit.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var field = params[0];
	var rows = params[1] || 0;
	var defVal = params[2] || '';
	if((tiddler instanceof Tiddler) && field) {
		story.setDirty(tiddler.title,true);
		var e,v;
		if(field != "text" && !rows) {
			e = createTiddlyElement(null,"input",null,null,null,{
				type: "text", edit: field, size: "40", autocomplete: "off"
			});
			e.value = store.getValue(tiddler,field) || defVal;
			place.appendChild(e);
		} else {
			var wrapper1 = createTiddlyElement(null,"fieldset",null,"fieldsetFix");
			var wrapper2 = createTiddlyElement(wrapper1,"div");
			e = createTiddlyElement(wrapper2,"textarea");
			e.value = v = store.getValue(tiddler,field) || defVal;
			rows = rows || 10;
			var lines = v.match(/\n/mg);
			var maxLines = Math.max(parseInt(config.options.txtMaxEditRows,10),5);
			if(lines != null && lines.length > rows)
				rows = lines.length + 5;
			rows = Math.min(rows,maxLines);
			e.setAttribute("rows",rows);
			e.setAttribute("edit",field);
			place.appendChild(wrapper1);
		}
		if(tiddler.isReadOnly()) {
			e.setAttribute("readOnly","readOnly");
			jQuery(e).addClass("readOnly");
		}
		return e;
	}
};

config.macros.tagChooser.onClick = function(ev)
{
	var e = ev || window.event;
	var lingo = config.views.editor.tagChooser;
	var popup = Popup.create(this);
	var tags = store.getTags(this.getAttribute("tags"));
	if(tags.length == 0)
		jQuery("<li/>").text(lingo.popupNone).appendTo(popup);
	var t;
	for(t=0; t<tags.length; t++) {
		var tag = createTiddlyButton(createTiddlyElement(popup,"li"),tags[t][0],lingo.tagTooltip.format([tags[t][0]]),config.macros.tagChooser.onTagClick);
		tag.setAttribute("tag",tags[t][0]);
		tag.setAttribute("tiddler",this.getAttribute("tiddler"));
	}
	Popup.show();
	e.cancelBubble = true;
	if(e.stopPropagation) e.stopPropagation();
	return false;
};

config.macros.tagChooser.onTagClick = function(ev)
{
	var e = ev || window.event;
	if(e.metaKey || e.ctrlKey) stopEvent(e); //# keep popup open on CTRL-click
	var tag = this.getAttribute("tag");
	var title = this.getAttribute("tiddler");
	if(!readOnly)
		story.setTiddlerTag(title,tag,0);
	return false;
};

config.macros.tagChooser.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	if(tiddler instanceof Tiddler) {
		var lingo = config.views.editor.tagChooser;
		var btn = createTiddlyButton(place,lingo.text,lingo.tooltip,this.onClick);
		btn.setAttribute("tiddler",tiddler.title);
		btn.setAttribute("tags",params[0]);
	}
};

config.macros.refreshDisplay.handler = function(place)
{
	createTiddlyButton(place,this.label,this.prompt,this.onClick);
};

config.macros.refreshDisplay.onClick = function(e)
{
	refreshAll();
	return false;
};

config.macros.annotations.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var title = tiddler ? tiddler.title : null;
	var a = title ? config.annotations[title] : null;
	if(!tiddler || !title || !a)
		return;
	var text = a.format([title]);
	wikify(text,createTiddlyElement(place,"div",null,"annotation"),null,tiddler);
};
