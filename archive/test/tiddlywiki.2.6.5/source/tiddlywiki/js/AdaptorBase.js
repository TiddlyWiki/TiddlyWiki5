//--
//-- Server adaptor base class
//--

function AdaptorBase()
{
	this.host = null;
	this.store = null;
	return this;
}

AdaptorBase.prototype.close = function()
{
	return true;
};

AdaptorBase.prototype.fullHostName = function(host)
{
	if(!host)
		return '';
	host = host.trim();
	if(!host.match(/:\/\//))
		host = 'http://' + host;
	if(host.substr(host.length-1) == '/')
		host = host.substr(0,host.length-1);
	return host;
};

AdaptorBase.minHostName = function(host)
{
	return host;
};

AdaptorBase.prototype.setContext = function(context,userParams,callback)
{
	if(!context) context = {};
	context.userParams = userParams;
	if(callback) context.callback = callback;
	context.adaptor = this;
	if(!context.host)
		context.host = this.host;
	context.host = this.fullHostName(context.host);
	if(!context.workspace)
		context.workspace = this.workspace;
	return context;
};

// Open the specified host
//#   host - uri of host (eg, "http://www.tiddlywiki.com/" or "www.tiddlywiki.com")
//#   context is itself passed on as a parameter to the callback function
//#   userParams - user settable object object that is passed on unchanged to the callback function
//#   callback - optional function to be called on completion
//# Return value is true if the request was successfully issued, false if this connector doesn't support openHost(),
//#   or an error description string if there was a problem
//# The callback parameters are callback(context)
//#   context.status - true if OK, string if error
//#   context.adaptor - reference to this adaptor object
//#   userParams - parameters as originally passed into the openHost function
AdaptorBase.prototype.openHost = function(host,context,userParams,callback)
{
	this.host = host;
	context = this.setContext(context,userParams,callback);
	context.status = true;
	if(callback)
		window.setTimeout(function() {context.callback(context,userParams);},10);
	return true;
};

// Open the specified workspace
//#   workspace - name of workspace to open
//#   context - passed on as a parameter to the callback function
//#   userParams - user settable object object that is passed on unchanged to the callback function
//#   callback - function to be called on completion
//# Return value is true if the request was successfully issued
//#   or an error description string if there was a problem
//# The callback parameters are callback(context,userParams)
//#   context.status - true if OK, false if error
//#   context.statusText - error message if there was an error
//#   context.adaptor - reference to this adaptor object
//#   userParams - parameters as originally passed into the openWorkspace function
AdaptorBase.prototype.openWorkspace = function(workspace,context,userParams,callback)
{
	this.workspace = workspace;
	context = this.setContext(context,userParams,callback);
	context.status = true;
	if(callback)
		window.setTimeout(function() {callback(context,userParams);},10);
	return true;
};

