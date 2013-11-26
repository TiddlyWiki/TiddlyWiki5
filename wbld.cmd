@echo off

rem build the TiddlyWeb edition of TiddlyWiki5 and upload it to TiddlySpace. Requires the TiddlySpace credentials
rem of a member of the tw5tiddlyweb space

rem usage:
rem .\wbld.cmd <tiddlyspace username> <tiddlyspace password>

rem Create the tmp directory if needed

mkdir tmp

rem Open the tw5tiddlyweb edition in TW5 and save the template for the main HTML file

node .\tiddlywiki.js ^
	editions\tw5tiddlyweb ^
	--verbose ^
	--rendertiddler $:/core/templates/tiddlywiki5.template.html tmp\tiddlyweb.html text/plain ^
	|| exit 1

rem Prepend the type information that TiddlyWeb needs to turn the .html file into a .tid file

echo "type: text/html" > tmp\tiddlerforupload.txt
echo "" >> tmp\tiddlerforupload.txt
type tmp\tiddlyweb.html >> tmp\tiddlerforupload.txt

rem Upload the tiddler file

curl -u %1:%2 -X PUT -H "content-type: text/plain" http://tw5tiddlyweb.tiddlyspace.com/bags/tw5tiddlyweb_public/tiddlers/tw5 --data-binary @tmp/tiddlerforupload.txt
