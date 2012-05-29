//--
//-- LoaderBase and SaverBase
//--

//# LoaderBase: A (abstract) storage loader that loads the tiddlers from a list of HTML elements.
//# The format of the elements is defined by subclasses of this loader through the internalizeTiddler implementation.
//# Subclasses must implement:
//#			function getTitle(store,node)
//#			function internalizeTiddler(store,tiddler,title,node)
//#
//# store must implement:
//#			function createTiddler(title)
function LoaderBase() {}

LoaderBase.prototype.loadTiddler = function(store,node,tiddlers)
{
	var title = this.getTitle(store,node);
	if(safeMode && store.isShadowTiddler(title))
		return;
	if(title) {
		var tiddler = store.createTiddler(title);
		this.internalizeTiddler(store,tiddler,title,node);
		tiddlers.push(tiddler);
	}
};

LoaderBase.prototype.loadTiddlers = function(store,nodes)
{
	var t,tiddlers = [];
	for(t = 0; t < nodes.length; t++) {
		try {
			this.loadTiddler(store,nodes[t],tiddlers);
		} catch(ex) {
			showException(ex,config.messages.tiddlerLoadError.format([this.getTitle(store,nodes[t])]));
		}
	}
	return tiddlers;
};

//# SaverBase: a (abstract) storage saver that externalizes all tiddlers into a string,
//# with every tiddler individually externalized (using this.externalizeTiddler) and joined with newlines
//# Subclasses must implement:
//#			function externalizeTiddler(store,tiddler)
//#
//# store must implement:
//#			function getTiddlers(sortByFieldName)
function SaverBase() {}

SaverBase.prototype.externalize = function(store)
{
	var results = [];
	var t,tiddlers = store.getTiddlers("title");
	for(t = 0; t < tiddlers.length; t++) {
		if(!tiddlers[t].doNotSave())
			results.push(this.externalizeTiddler(store, tiddlers[t]));
	}
	return results.join("\n");
};

