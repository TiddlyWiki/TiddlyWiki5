<p>Welcome to <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a>, a non-linear personal web notebook that anyone can use and keep forever, independently of any corporation.</p><p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> is a complete interactive wiki in <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/JavaScript.html">JavaScript</a>. It can be used as a single HTML file in the browser or as a powerful Node.js application. It is highly customisable: the entire user interface is itself implemented in hackable <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/WikiText.html">WikiText</a>.</p><p>Learn more and see it in action at <a class="tc-tiddlylink-external" href="http://tiddlywiki.com/" target="_blank">http://tiddlywiki.com/</a></p><p>Developer documentation is in progress at <a class="tc-tiddlylink-external" href="http://tiddlywiki.com/dev/" target="_blank">http://tiddlywiki.com/dev/</a></p><h1 class="">Installing <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><ol><li>Install <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Node.js.html">Node.js</a> from <a class="tc-tiddlylink-external" href="http://nodejs.org" target="_blank">http://nodejs.org</a></li><li>Open a command line terminal and type:<blockquote><p><code>npm install -g tiddlywiki</code></p><p>If it fails with an error you may need to re-run the command as an administrator:</p><p><code>sudo npm install -g tiddlywiki</code> (Mac/Linux)</p></blockquote></li><li>Check <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> is installed by typing:<blockquote><p><code>tiddlywiki --version</code></p></blockquote></li><li>In response, you should see <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> report its current version (eg &quot;5.1.10&quot;; you may also see other debugging information reported)</li><li>Try it out:<ol><li><code>tiddlywiki mynewwiki --init server</code> to create a folder for a new wiki that includes server-related components</li><li><code>tiddlywiki mynewwiki --server</code> to start <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a></li><li>Visit <a class="tc-tiddlylink-external" href="http://127.0.0.1:8080/" target="_blank">http://127.0.0.1:8080/</a> in your browser</li><li>Try editing and creating tiddlers</li></ol></li></ol><p>The <code>-g</code> flag causes <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> to be installed globally. Without it, <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> will only be available in the directory where you installed it.</p><p>If you are using Debian or Debian-based Linux and you are reciving a <code>node: command not found</code> error though node.js package is installed, you may need to create a symbolic link between <code>nodejs</code> and <code>node</code>. Consult your distro's manual and <code>whereis</code> to correctly create a link. See github <a class="tc-tiddlylink-external" href="http://github.com/Jermolene/TiddlyWiki5/issues/1434" target="_blank">issue 1434</a></p><p>Example Debian v8.0: <code>sudo ln -s /usr/bin/nodejs /usr/bin/node</code></p><h1 class="">Using <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki5.html">TiddlyWiki5</a> can be used on the command line to perform an extensive set of operations based on <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWikiFolders.html">TiddlyWikiFolders</a>, <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlerFiles.html">TiddlerFiles</a> and <a class="tc-tiddlylink tc-tiddlylink-missing" href="http://tiddlywiki.com/static/TiddlyWikiFiles.html">TiddlyWikiFiles</a>.</p><p>For example, the following command loads the tiddlers from a <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> HTML file and then saves one of them in static HTML:</p><pre><code>tiddlywiki --verbose --load mywiki.html --rendertiddler ReadMe ./readme.html</code></pre><p>Running <code>tiddlywiki</code> from the command line boots the <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> kernel, loads the core plugins and establishes an empty wiki store. It then sequentially processes the command line arguments from left to right. The arguments are separated with spaces.</p><p>The first argument is the optional path to the <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWikiFolders.html">TiddlyWikiFolder</a> to be loaded. If not present, then the current directory is used.</p><p>The commands and their individual arguments follow, each command being identified by the prefix <code>--</code>.</p><pre><code>tiddlywiki [&lt;wikipath&gt;] [--&lt;command&gt; [&lt;arg&gt;[,&lt;arg&gt;]]]</code></pre><p>The available commands are:</p><p><ul class="">

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/BuildCommand.html">
build
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/ClearPasswordCommand.html">
clearpassword
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/EditionsCommand.html">
editions
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/HelpCommand.html">
help
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/InitCommand.html">
init
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/LoadCommand.html">
load
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/MakeLibraryCommand.html">
makelibrary
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/OutputCommand.html">
output
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/PasswordCommand.html">
password
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/RenderTiddlerCommand.html">
rendertiddler
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/RenderTiddlersCommand.html">
rendertiddlers
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/SaveTiddlerCommand.html">
savetiddler
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/SaveTiddlersCommand.html">
savetiddlers
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/ServerCommand.html">
server
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/SetFieldCommand.html">
setfield
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/UnpackPluginCommand.html">
unpackplugin
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/VerboseCommand.html">
verbose
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/VersionCommand.html">
version
</a>
</li>

</ul></p><h1 class="">Upgrading <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><p>If you've installed <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki%2520on%2520Node.js.html">TiddlyWiki on Node.js</a> on the usual way, when a new version is released you can upgrade it with this command:</p><pre><code>npm update -g tiddlywiki</code></pre><p>On Mac or Linux you'll need to add <strong>sudo</strong> like this:</p><pre><code>sudo npm update -g tiddlywiki</code></pre><h1 class="">Also see</h1><p><ul class="">

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWikiFolders.html">

TiddlyWikiFolders

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/MultiTiddlerFileSyntax.html">

MultiTiddlerFileSyntax

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/MultiTiddlerFiles.html">

MultiTiddlerFiles

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlerFiles.html">

TiddlerFiles

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Generating%2520Static%2520Sites%2520with%2520TiddlyWiki.html">

Generating Static Sites with TiddlyWiki

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/How%2520to%2520build%2520a%2520TiddlyWiki5%2520from%2520individual%2520tiddlers.html">

How to build a TiddlyWiki5 from individual tiddlers

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Using%2520TiddlyWiki%2520for%2520GitHub%2520project%2520documentation.html">

Using TiddlyWiki for GitHub project documentation

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Using%2520a%2520custom%2520path%2520prefix%2520with%2520the%2520client-server%2520edition.html">

Using a custom path prefix with the client-server edition

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Building%2520TiddlyWikiClassic.html">

Building TiddlyWikiClassic

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Environment%2520Variables%2520on%2520Node.js.html">

Environment Variables on Node.js

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Scripts%2520for%2520TiddlyWiki%2520on%2520Node.js.html">

Scripts for TiddlyWiki on Node.js

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/Working%2520with%2520the%2520TiddlyWiki5%2520repository.html">

Working with the TiddlyWiki5 repository

</a>
</li>

</ul></p><p><em>This readme file was automatically generated by <a class="tc-tiddlylink tc-tiddlylink-resolves" href="http://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a></em></p>