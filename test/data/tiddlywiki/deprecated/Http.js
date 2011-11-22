//--
//-- Deprecated HTTP request code
//-- Use the jQuery ajax functions directly instead
//--

//# Load a file over http
//#   url - the source url
//#   callback - function to call when there is a response
//#   params - parameter object that gets passed to the callback for storing it's state
//# Return value is the underlying XMLHttpRequest object, or a string if there was an error
//# Callback function is called like this:
//#   callback(status,params,responseText,xhr)
//#     status - true if OK, false if error
//#     params - the parameter object provided to loadRemoteFile()
//#     responseText - the text of the file
//#     xhr - the underlying XMLHttpRequest object
function loadRemoteFile(url,callback,params)
{
	return httpReq("GET",url,callback,params);
}

function doHttp(type,url,data,contentType,username,password,callback,params,headers,allowCache)
{
	return httpReq(type,url,callback,params,headers,data,contentType,username,password,allowCache);
}

