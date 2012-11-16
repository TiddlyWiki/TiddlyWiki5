/***
|''Name:''|ExamplePlugin|
|''Description:''|To demonstrate how to write TiddlyWiki plugins|
|''Version:''|2.0.3|
|''Date:''|Sep 22, 2006|
|''Source:''|http://www.tiddlywiki.com/#ExamplePlugin|
|''Author:''|JeremyRuston (jeremy (at) osmosoft (dot) com)|
|''License:''|[[BSD open source license]]|
|''~CoreVersion:''|2.1.0|
|''Browser:''|Firefox 1.0.4+; Firefox 1.5; InternetExplorer 6.0|
***/

//{{{

// Uncomment the following line to see how the PluginManager deals with errors in plugins
// deliberateError();

// Log a message
pluginInfo.log.push("This is a test message from " + tiddler.title);

//}}}
