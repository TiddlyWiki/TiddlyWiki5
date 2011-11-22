//--
//-- Search macro
//--

config.macros.search.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	params = paramString.parseParams("anon",null,false,false,false);
	createTiddlyButton(place,this.label,this.prompt,this.onClick,"searchButton");
	var txt = createTiddlyElement(null,"input",null,"txtOptionInput searchField");
	txt.value = getParam(params,"anon","");
	if(config.browser.isSafari) {
		txt.setAttribute("type","search");
		txt.setAttribute("results","5");
	} else {
		txt.setAttribute("type","text");
	}
	place.appendChild(txt);
	txt.onkeyup = this.onKeyPress;
	txt.onfocus = this.onFocus;
	txt.setAttribute("size",this.sizeTextbox);
	txt.setAttribute("accessKey",getParam(params,"accesskey",this.accessKey));
	txt.setAttribute("autocomplete","off");
	txt.setAttribute("lastSearchText","");
	txt.setAttribute("placeholder",getParam(params,"placeholder",this.placeholder));
};

// Global because there's only ever one outstanding incremental search timer
config.macros.search.timeout = null;

config.macros.search.doSearch = function(txt)
{
	if(txt.value.length > 0) {
		story.search(txt.value,config.options.chkCaseSensitiveSearch,config.options.chkRegExpSearch);
		txt.setAttribute("lastSearchText",txt.value);
	}
};

config.macros.search.onClick = function(e)
{
	config.macros.search.doSearch(this.nextSibling);
	return false;
};

config.macros.search.onKeyPress = function(ev)
{
	var me = config.macros.search;
	var e = ev || window.event;
	switch(e.keyCode) {
		case 9: // Tab
			return;
		case 13: // Ctrl-Enter
		case 10: // Ctrl-Enter on IE PC
			me.doSearch(this);
			break;
		case 27: // Escape
			this.value = "";
			clearMessage();
			break;
	}
	if(config.options.chkIncrementalSearch) {
		if(this.value.length > 2) {
			if(this.value != this.getAttribute("lastSearchText")) {
				if(me.timeout) {
					clearTimeout(me.timeout);
				}
				var txt = this;
				me.timeout = setTimeout(function() {me.doSearch(txt);},500);
			}
		} else {
			if(me.timeout) {
				clearTimeout(me.timeout);
			}
		}
	}
};

config.macros.search.onFocus = function(e)
{
	this.select();
};

