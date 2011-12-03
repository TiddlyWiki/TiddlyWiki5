//--
//-- Server adaptor for talking to static TiddlyWiki files
//--

function FileAdaptor()
{
}

FileAdaptor.prototype = new AdaptorBase();

FileAdaptor.serverType = 'file';
FileAdaptor.serverLabel = 'TiddlyWiki';

FileAdaptor.loadTiddlyWikiSuccess = function(context,jqXHR)
{
	context.status = true;
	//# Load the content into a TiddlyWiki() object
	context.adaptor.store = new TiddlyWiki();
	if(!context.adaptor.store.importTiddlyWiki(jqXHR.responseText)) {
		context.statusText = config.messages.invalidFileError.format([context.host]);
		context.status = false;
	}
	context.complete(context,context.userParams);
};

FileAdaptor.loadTiddlyWikiError = function(context,jqXHR)
{
	context.status = false;
	context.statusText = jqXHR.message;
	context.complete(context,context.userParams);
};

// Get the list of workspaces on a given server
//#   context - passed on as a parameter to the callback function
//#   userParams - user settable object object that is passed on unchanged to the callback function
//#   callback - function to be called on completion
//# Return value is true if the request was successfully issued, false if this connector doesn't support getWorkspaceList(),
//#   or an error description string if there was a problem
//# The callback parameters are callback(context,userParams)
//#   context.status - true if OK, false if error
//#   context.statusText - error message if there was an error
//#   context.adaptor - reference to this adaptor object
//#   userParams - parameters as originally passed into the getWorkspaceList function
FileAdaptor.prototype.getWorkspaceList = function(context,userParams,callback)
{
	context = this.setContext(context,userParams,callback);
	context.workspaces = [{title:"(default)"}];
	context.status = true;
	if(callback)
		window.setTimeout(function() {callback(context,userParams);},10);
	return true;
};

// Gets the list of tiddlers within a given workspace
//#   context - passed on as a parameter to the callback function
//#   userParams - user settable object object that is passed on unchanged to the callback function
//#   callback - function to be called on completion
//#   filter - filter expression
//# Return value is true if the request was successfully issued,
//#   or an error description string if there was a problem
//# The callback parameters are callback(context,userParams)
//#   context.status - true if OK, false if error
//#   context.statusText - error message if there was an error
//#   context.adaptor - reference to this adaptor object
//#   context.tiddlers - array of tiddler objects
//#   userParams - parameters as originally passed into the getTiddlerList function
FileAdaptor.prototype.getTiddlerList = function(context,userParams,callback,filter)
{
	context = this.setContext(context,userParams,callback);
	if(!context.filter)
		context.filter = filter;
	context.complete = FileAdaptor.getTiddlerListComplete;
	if(this.store) {
		return context.complete(context,context.userParams);
	}
	var options = {
		type:"GET",
		url:context.host,
		processData:false,
		success:function(data,textStatus,jqXHR) {
			FileAdaptor.loadTiddlyWikiSuccess(context,jqXHR);
		},
		error:function(jqXHR,textStatus,errorThrown) {
			context.xhr = jqXHR;
			FileAdaptor.loadTiddlyWikiError(context,jqXHR);
		}
	};
	return ajaxReq(options);
};

FileAdaptor.getTiddlerListComplete = function(context,userParams)
{
	if(context.status) {
		if(context.filter) {
			context.tiddlers = context.adaptor.store.filterTiddlers(context.filter);
		} else {
			context.tiddlers = [];
			context.adaptor.store.forEachTiddler(function(title,tiddler) {context.tiddlers.push(tiddler);});
		}
		var i;
		for(i=0; i<context.tiddlers.length; i++) {
			context.tiddlers[i].fields['server.type'] = FileAdaptor.serverType;
			context.tiddlers[i].fields['server.host'] = AdaptorBase.minHostName(context.host);
			context.tiddlers[i].fields['server.page.revision'] = context.tiddlers[i].modified.convertToYYYYMMDDHHMM();
		}
		context.status = true;
	}
	if(context.callback) {
		window.setTimeout(function() {context.callback(context,userParams);},10);
	}
	return true;
};

FileAdaptor.prototype.generateTiddlerInfo = function(tiddler)
{
	var info = {};
	info.uri = tiddler.fields['server.host'] + "#" + tiddler.title;
	return info;
};

// Retrieve a tiddler from a given workspace on a given server
//#   title - title of the tiddler to get
//#   context - passed on as a parameter to the callback function
//#   userParams - user settable object object that is passed on unchanged to the callback function
//#   callback - function to be called on completion
//# Return value is true if the request was successfully issued,
//#   or an error description string if there was a problem
//# The callback parameters are callback(context,userParams)
//#   context.status - true if OK, false if error
//#   context.statusText - error message if there was an error
//#   context.adaptor - reference to this adaptor object
//#   context.tiddler - the retrieved tiddler, or null if it cannot be found
//#   userParams - parameters as originally passed into the getTiddler function
FileAdaptor.prototype.getTiddler = function(title,context,userParams,callback)
{
	context = this.setContext(context,userParams,callback);
	context.title = title;
	context.complete = FileAdaptor.getTiddlerComplete;
	if(context.adaptor.store) {
		return context.complete(context,context.userParams);
	}
	var options = {
		type:"GET",
		url:context.host,
		processData:false,
		success:function(data,textStatus,jqXHR) {
			FileAdaptor.loadTiddlyWikiSuccess(context,jqXHR);
		},
		error:function(jqXHR,textStatus,errorThrown) {
			FileAdaptor.loadTiddlyWikiError(context,jqXHR);
		}
	};
	return ajaxReq(options);
};

FileAdaptor.getTiddlerComplete = function(context,userParams)
{
	var t = context.adaptor.store.fetchTiddler(context.title);
	if(t) {
		t.fields['server.type'] = FileAdaptor.serverType;
		t.fields['server.host'] = AdaptorBase.minHostName(context.host);
		t.fields['server.page.revision'] = t.modified.convertToYYYYMMDDHHMM();
		context.tiddler = t;
		context.status = true;
	} else { //# tiddler does not exist in document
		context.status = false;
	}
	if(context.allowSynchronous) {
		context.isSynchronous = true;
		context.callback(context,userParams);
	} else {
		window.setTimeout(function() {context.callback(context,userParams);},10);
	}
	return true;
};

FileAdaptor.prototype.close = function()
{
	this.store = null;
};

config.adaptors[FileAdaptor.serverType] = FileAdaptor;

config.defaultAdaptor = FileAdaptor.serverType;

