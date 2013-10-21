<h1 class=''>
Welcome to <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a></h1><p>
Welcome to <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a>, a reboot of <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a>, the non-linear personal web notebook first released in 2004. It is a complete interactive wiki in <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/JavaScript.html'>
JavaScript</a> that can be run from a single HTML file in the browser or as a powerful <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/node.js.html'>
node.js application</a>.</p><p>
<a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> is currently in alpha, meaning it is working but incomplete. It is a great time to get involved and support its <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/RoadMap.html'>
future development</a>:</p><ul>
<li>
Explore its features online at <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/http%3A%2F%2Ffive.tiddlywiki.com%2F.html'>
http://five.tiddlywiki.com/</a></li><li>
Join the discussions on <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/http%3A%2F%2Fgroups.google.com%2Fgroup%2FTiddlyWikiDev.html'>
the TiddlyWikiDev Google Group</a></li><li>
Get involved in the <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/https%3A%2F%2Fgithub.com%2FJermolene%2FTiddlyWiki5.html'>
development on GitHub</a></li><li>
Follow <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/http%3A%2F%2Ftwitter.com%2F%23!%2FTiddlyWiki.html'>
@TiddlyWiki on Twitter</a> for the latest news</li></ul><p>
<em>
<a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> is a free, open source project that depends on <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/HelpingTiddlyWiki.html'>
your love and support</a> for its survival</em>
</p><h1 class=''>
Getting started with <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> under node.js</h1><p>
<a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> can be used on the command line to perform an extensive set of operations based on tiddlers, <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWikiFolders.html'>
TiddlyWikiFolders</a>, <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlerFiles.html'>
TiddlerFiles</a> and <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/TiddlyWikiFiles.html'>
TiddlyWikiFiles</a>. For example, the following command loads the tiddlers from a <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> HTML file and then saves one of them in HTML:</p><pre>
node tiddlywiki.js --verbose --load mywiki.html --rendertiddler ReadMe ./readme.html</pre><p>
In order to use <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> on the command line you must first install node.js from <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/http%3A%2F%2Fnodejs.org%2F.html'>
http://nodejs.org/</a></p><h2 class=''>
Usage</h2><p>
Running <code>
tiddlywiki.js</code> from the command line boots the <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> kernel, loads the core plugins and establishes an empty wiki store. It then sequentially processes the command line arguments from left to right. The arguments are separated with spaces.</p><p>
The first argument is the optional path to the <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWikiFolders.html'>
TiddlyWikiFolder</a> to be loaded. If not present, then the current directory is used.</p><p>
The commands and their individual arguments follow, each command being identified by the prefix <code>
--</code>.</p><pre>
node tiddlywiki.js [&lt;wikipath&gt;] [--&lt;command&gt; [&lt;arg&gt;[,&lt;arg&gt;]]]</pre><h2 class=''>
Batch Files</h2><p>
For trying <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> out under node.js, several batch files are provided:</p><h3 class=''>
<code>
bld.sh</code> builds tw5.com</h3><p>
This batch file builds several variants of <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> for deployment on tiddlywiki.com.</p><p>
By default, files are output to a folder called <code>
jermolene.github.com</code> in the same directory as the main <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> directory. You will need to create the directory before running the batch file. For example:</p><pre>
* /TiddlyWork/ - Directory for working with TiddlyWiki5
* /TiddlyWork/TiddlyWiki5/ - Directory containing the TiddlyWiki5 repo from GitHub
* /TiddlyWork/jermolene.github.com/ - Directory for output files</pre><p>
You can override the build output directory by defining the environment variable <code>
TW5_BUILD_OUTPUT</code>. The easiest way to do this is to create a personal batch file to invoke <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> that first sets the environment variable and then invokes <code>
bld.sh</code>.</p><p>
The files output by <code>
bld.sh</code> are:</p><ul>
<li>
<code>
readme.md</code> main readme file, output to the <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> directory</li><li>
<code>
index.html</code> <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> standalone HTML file with content from the <code>
tw5.com</code> edition</li><li>
<code>
empty.html</code> <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> standalone HTML file with no content</li><li>
<code>
encrypted.html</code> <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> standalone HTML file encrypted with the password <code>
password</code></li><li>
<code>
test.html</code> <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> browser-based test suite (see <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TestingMechanism.html'>
TestingMechanism</a>)</li><li>
<code>
static.html</code> static HTML version of the <a class=' tw-tiddlylink tw-tiddlylink-missing' href='http://five.tiddlywiki.com/static/DefaultTiddlers.html'>
DefaultTiddlers</a> of the <code>
tw5.com</code> edition</li><li>
<code>
static/*.html</code> and <code>
static/static.css</code> static HTML versions of individual tiddlers</li></ul><p>
<code>
bld.sh</code> also runs the <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> node.js-based test suite (see <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TestingMechanism.html'>
TestingMechanism</a>)</p><h3 class=''>
<code>
serve.sh</code> serves tw5.com</h3><p>
This batch file starts <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> running as an HTTP server with the content from the <code>
clientserver</code> edition. By default, the script serves on port 8080.</p><pre>
./server.sh UserName</pre><p>
The single parameter to the script is the username to use for signing edits.</p><p>
To experiment with this configuration, run the script and then visit <code>
http://0.0.0.0:8080</code> in a browser.</p><p>
Changes made in the browser propagate to the server over HTTP (use the browser developer console to see these requests). The server then syncs changes to the file system (and logs each change to the screen).</p><h3 class=''>
<code>
wbld.sh</code> builds <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> for <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWeb.html'>
TiddlyWeb</a></h3><p>
This batch file builds and deploys the code for <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5%20in%20the%20Sky%20for%20TiddlyWeb.html'>
TiddlyWiki5 in the Sky for TiddlyWeb</a>. If you want to experiment with your own builds of <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> for <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWeb.html'>
TiddlyWeb</a> you could use this batch file as a base.</p><h3 class=''>
<code>
2bld.sh</code> builds <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> 2.6.5</h3><p>
This batch file builds <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> 2.6.5 from the original source and then uses the <code>
opendiff</code> program to display the differences between them.</p><h2 class=''>
Commands</h2><p>
The following commands are available:</p><h3 class=''>
LoadCommand</h3><p>
Load tiddlers from 2.x.x <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a> files (<code>
.html</code>), <code>
.tiddler</code>, <code>
.tid</code>, <code>
.json</code> or other files </p><pre>
--load &lt;filepath&gt;</pre><h3 class=''>
PasswordCommand</h3><p>
Set a password for subsequent crypto operations</p><pre>
--password &lt;password&gt;</pre><h3 class=''>
PrintCommand</h3><p>
The <code>
print</code> command outputs specified information. </p><h3 class=''>
print tiddlers</h3><p>
Output the titles of the tiddlers in the wiki store</p><pre>
--print tiddlers</pre><h3 class=''>
print tiddler</h3><p>
Print the fields of an individual tiddler </p><pre>
--print tiddler &lt;title&gt;</pre><h3 class=''>
print system</h3><p>
Print the titles of the system tiddlers in the wiki store </p><pre>
--print system</pre><h3 class=''>
print config</h3><p>
Print the current core configuration </p><pre>
--print config</pre><h3 class=''>
RenderTiddlerCommand</h3><p>
Render an individual tiddler as a specified <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/ContentType.html'>
ContentType</a>, defaults to <code>
text/html</code> and save it to the specified filename </p><pre>
--rendertiddler &lt;title&gt; &lt;filename&gt; [&lt;type&gt;]</pre><h3 class=''>
RenderTiddlersCommand</h3><p>
Render a set of tiddlers matching a filter to separate files of a specified <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/ContentType.html'>
ContentType</a> (defaults to <code>
text/html</code>) and extension (defaults to <code>
.html</code>).</p><pre>
--rendertiddlers &lt;filter&gt; &lt;template&gt; &lt;pathname&gt; [&lt;type&gt;] [&lt;extension&gt;]</pre><p>
For example:</p><pre>
--rendertiddlers [!is[system]] $:/core/templates/static.tiddler.html ./static text/plain</pre><h3 class=''>
ServerCommand</h3><p>
The server built in to <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> is very simple. Although compatible with <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWeb.html'>
TiddlyWeb</a> it doesn't support many of the features needed for robust Internet-facing usage - in particular, <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a> is an old-school wiki in the sense that it offers no authentication.</p><p>
At the root, it serves a rendering of a specified tiddler. Away from the root, it serves individual tiddlers encoded in JSON, and supports the basic HTTP operations for <code>
GET</code>, <code>
PUT</code> and <code>
DELETE</code>.</p><pre>
--server &lt;port&gt; &lt;roottiddler&gt; &lt;rendertype&gt; &lt;servetype&gt; &lt;username&gt;</pre><p>
The parameters are:</p><ul>
<li>
<strong>
port</strong> - port number to serve from (defaults to &quot;8080&quot;)</li><li>
<strong>
roottiddler</strong> - the tiddler to serve at the root (defaults to &quot;$:/core/tiddlywiki5.template.html&quot;) </li><li>
<strong>
rendertype</strong> - the content type to which the root tiddler should be rendered (defaults to &quot;text/plain&quot;)</li><li>
<strong>
servetype</strong> - the content type with which the root tiddler should be served (defaults to &quot;text/html&quot;)</li><li>
<strong>
username</strong> - the default username for signing edits</li></ul><p>
For example:</p><pre>
--server 8080 $:/core/tiddlywiki5.template.html text/plain text/html MyUserName</pre><h3 class=''>
VerboseCommand</h3><p>
Triggers verbose output, useful for debugging </p><pre>
--verbose</pre><h3 class=''>
VersionCommand</h3><p>
Displays the version number of <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki.html'>
TiddlyWiki</a>.</p><pre>
--version</pre><p>
<em>
This readme file was automatically generated by <a class=' tw-tiddlylink tw-tiddlylink-resolves' href='http://five.tiddlywiki.com/static/TiddlyWiki5.html'>
TiddlyWiki5</a></em>
</p>