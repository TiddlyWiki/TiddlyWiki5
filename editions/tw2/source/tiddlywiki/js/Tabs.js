//--
//-- Tabs macro
//--

config.macros.tabs.handler = function(place,macroName,params)
{
	var cookie = params[0];
	var numTabs = (params.length-1)/3;
	var wrapper = createTiddlyElement(null,"div",null,"tabsetWrapper " + cookie);
	var tabset = createTiddlyElement(wrapper,"div",null,"tabset");
	tabset.setAttribute("cookie",cookie);
	var validTab = false;
	var t;
	for(t=0; t<numTabs; t++) {
		var label = params[t*3+1];
		var prompt = params[t*3+2];
		var content = params[t*3+3];
		var tab = createTiddlyButton(tabset,label,prompt,this.onClickTab,"tab tabUnselected");
		createTiddlyElement(tab,"span",null,null," ",{style:"font-size:0pt;line-height:0px"});
		tab.setAttribute("tab",label);
		tab.setAttribute("content",content);
		tab.title = prompt;
		if(config.options[cookie] == label)
			validTab = true;
	}
	if(!validTab)
		config.options[cookie] = params[1];
	place.appendChild(wrapper);
	this.switchTab(tabset,config.options[cookie]);
};

config.macros.tabs.onClickTab = function(e)
{
	config.macros.tabs.switchTab(this.parentNode,this.getAttribute("tab"));
	return false;
};

config.macros.tabs.switchTab = function(tabset,tab)
{
	var cookie = tabset.getAttribute("cookie");
	var theTab = null;
	var nodes = tabset.childNodes;
	var t;
	for(t=0; t<nodes.length; t++) {
		if(nodes[t].getAttribute && nodes[t].getAttribute("tab") == tab) {
			theTab = nodes[t];
			theTab.className = "tab tabSelected";
		} else {
			nodes[t].className = "tab tabUnselected";
		}
	}
	if(theTab) {
		if(tabset.nextSibling && tabset.nextSibling.className == "tabContents")
			jQuery(tabset.nextSibling).remove();
		var tabContent = createTiddlyElement(null,"div",null,"tabContents");
		tabset.parentNode.insertBefore(tabContent,tabset.nextSibling);
		var contentTitle = theTab.getAttribute("content");
		wikify(store.getTiddlerText(contentTitle),tabContent,null,store.getTiddler(contentTitle));
		if(cookie) {
			config.options[cookie] = tab;
			saveOption(cookie);
		}
	}
};

