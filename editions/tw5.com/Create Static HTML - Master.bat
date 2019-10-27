echo off
node ../../tiddlywiki.js ../tw5.com --rendertiddler $:/core/templates/alltiddlers.template.html static-output-master.html text/plain
echo DONE
