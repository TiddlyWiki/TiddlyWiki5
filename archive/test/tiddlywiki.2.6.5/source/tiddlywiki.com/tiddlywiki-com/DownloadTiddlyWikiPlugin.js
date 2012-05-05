/***
|''Name:''|DownloadTiddlyWikiPlugin|
|''Description:''|Download TiddlyWiki according to browser type|
|''Version:''|0.0.8|
|''Date:''|Aug 26, 2008|
|''Source:''|http://www.tiddlywiki.com/#DownloadTiddlyWikiPlugin|
|''License:''|[[BSD open source license]]|
|''~CoreVersion:''|2.4.1|
***/

//{{{
if(!version.extensions.DownloadTiddlyWikiPlugin) {
version.extensions.DownloadTiddlyWikiPlugin = {installed:true};

config.macros.download = {};

merge(config.macros.download,{
	label: "download",
	prompt: "Download TiddlyWiki",
	className: "chunkyButton"});

config.macros.download.handler = function(place,macroName,params,wikifier,paramString,tiddler)
{
	var span = createTiddlyElement(place,"span",null,this.className);
	createTiddlyButton(span,params[0]||this.label,params[1]||this.prompt,this.onClick);
};

config.macros.download.onClick = function(ev)
{
	// display the tiddler containing the instructions
	var e = ev || window.event;
	var title = "Downloading";
	var url = config.browser.isSafari || config.browser.isOpera ? 'http://www.tiddlywiki.com/empty.zip' :'http://www.tiddlywiki.com/empty.download';
	if(config.browser.isOpera || config.browser.isWindows) {
		story.displayTiddler(target,title);
		window.setTimeout(function() {document.location.href = url;},300);
	} else {
		// put an iframe in the target instructions tiddler to start the download
		var html = '<html><iframe src="' + url + '" style="display:none"></html>';
		var tiddler = store.getTiddler(title);
		var oldText = tiddler.text;
		tiddler.text = html + tiddler.text;
		var target = resolveTarget(e);
		story.closeTiddler(title,true);
		story.displayTiddler(target,title);
		tiddler.text = oldText;
	}
	return false;
};

} //# end of 'install only once'
//}}}
