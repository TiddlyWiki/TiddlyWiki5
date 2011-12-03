//--
//-- Paramifiers
//--

function getParameters()
{
	var p = null;
	if(window.location.hash) {
		p = decodeURIComponent(window.location.hash.substr(1));
		if(config.browser.firefoxDate != null && config.browser.firefoxDate[1] < "20051111")
			p = convertUTF8ToUnicode(p);
	}
	return p;
}

function invokeParamifier(params,handler)
{
	if(!params || params.length == undefined || params.length <= 1)
		return;
	var i;
	for(i=1; i<params.length; i++) {
		var p = config.paramifiers[params[i].name];
		if(p && p[handler] instanceof Function)
			p[handler](params[i].value);
		else {
			//# not a paramifier with handler()... check for an 'option' prefix
			var h = config.optionHandlers[params[i].name.substr(0,3)];
			if(h && h.set instanceof Function)
				h.set(params[i].name,params[i].value);
		}
	}
}

config.paramifiers = {};

config.paramifiers.start = {
	oninit: function(v) {
		safeMode = v.toLowerCase() == "safe";
	}
};

config.paramifiers.open = {
	onstart: function(v) {
		if(!readOnly || store.tiddlerExists(v) || store.isShadowTiddler(v))
			story.displayTiddler("bottom",v,null,false,null);
	}
};

config.paramifiers.story = {
	onstart: function(v) {
		var list = store.getTiddlerText(v,"").parseParams("open",null,false);
		invokeParamifier(list,"onstart");
	}
};

config.paramifiers.search = {
	onstart: function(v) {
		story.search(v,false,false);
	}
};

config.paramifiers.searchRegExp = {
	onstart: function(v) {
		story.prototype.search(v,false,true);
	}
};

config.paramifiers.tag = {
	onstart: function(v) {
		story.displayTiddlers(null,store.filterTiddlers("[tag["+v+"]]"),null,false,null);
	}
};

config.paramifiers.newTiddler = {
	onstart: function(v) {
		var args = v.parseParams("anon", null, null)[0];
		var title = args.title ? args.title[0] : v;
		var customFields = args.fields ? args.fields[0] : null;
		if(!readOnly) {
			story.displayTiddler(null,title,DEFAULT_EDIT_TEMPLATE,false,null,customFields);
			story.focusTiddler(title,"text");
			var i,tags = args.tag || [];
			for(i=0;i<tags.length;i++) {
				story.setTiddlerTag(title,tags[i],+1);
			}
		}
	}
};

config.paramifiers.newJournal = {
	onstart: function(v) {
		if(!readOnly) {
			var now = new Date();
			var title = now.formatString(v.trim());
			story.displayTiddler(null,title,DEFAULT_EDIT_TEMPLATE);
			story.focusTiddler(title,"text");
		}
	}
};

config.paramifiers.readOnly = {
	onconfig: function(v) {
		var p = v.toLowerCase();
		readOnly = p == "yes" ? true : (p == "no" ? false : readOnly);
	}
};

config.paramifiers.theme = {
	onconfig: function(v) {
		story.switchTheme(v);
	}
};

config.paramifiers.upgrade = {
	onstart: function(v) {
		upgradeFrom(v);
	}
};

config.paramifiers.recent= {
	onstart: function(v) {
		var titles=[];
		var i,tiddlers=store.getTiddlers("modified","excludeLists").reverse();
		for(i=0; i<v && i<tiddlers.length; i++)
			titles.push(tiddlers[i].title);
		story.displayTiddlers(null,titles);
	}
};

config.paramifiers.filter = {
	onstart: function(v) {
		story.displayTiddlers(null,store.filterTiddlers(v),null,false);
	}
};

