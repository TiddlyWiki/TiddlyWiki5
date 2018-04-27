<p>Welcome to <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a>, a non-linear personal web notebook that anyone can use and keep forever, independently of any corporation.</p><p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> is a complete interactive wiki in <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/JavaScript.html">JavaScript</a>. It can be used as a single HTML file in the browser or as a powerful Node.js application. It is highly customisable: the entire user interface is itself implemented in hackable <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/WikiText.html">WikiText</a>.</p><p>Learn more and see it in action at <a class="tc-tiddlylink-external" href="https://tiddlywiki.com/" rel="noopener noreferrer" target="_blank">https://tiddlywiki.com/</a></p><p>Developer documentation is in progress at <a class="tc-tiddlylink-external" href="https://tiddlywiki.com/dev/" rel="noopener noreferrer" target="_blank">https://tiddlywiki.com/dev/</a></p><h1 class="">Installing <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><ol><li>Install <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Node.js.html">Node.js</a><ul><li>either from your favourite package manager: typically <code>apt-get install nodejs</code> on Debian/Ubuntu Linux or Termux for Android, or <code>brew install node</code> on a Mac</li><li>or directly from <a class="tc-tiddlylink-external" href="http://nodejs.org" rel="noopener noreferrer" target="_blank">http://nodejs.org</a></li></ul></li><li>Open a command line terminal and type:<blockquote><p><code>npm install -g tiddlywiki</code></p><p>If it fails with an error you may need to re-run the command as an administrator:</p><p><code>sudo npm install -g tiddlywiki</code> (Mac/Linux)</p></blockquote></li><li>Check <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> is installed by typing:<blockquote><p><code>tiddlywiki --version</code></p></blockquote></li><li>In response, you should see <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> report its current version (eg &quot;5.1.14&quot;; you may also see other debugging information reported)</li><li>Try it out:<ol><li><code>tiddlywiki mynewwiki --init server</code> to create a folder for a new wiki that includes server-related components</li><li><code>tiddlywiki mynewwiki --server</code> to start <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a></li><li>Visit <a class="tc-tiddlylink-external" href="http://127.0.0.1:8080/" rel="noopener noreferrer" target="_blank">http://127.0.0.1:8080/</a> in your browser</li><li>Try editing and creating tiddlers</li></ol></li><li>Optionally, make an offline copy:<ul><li>click the <svg class="tc-image-save-button tc-image-button" height="22pt" viewBox="0 0 128 128" width="22pt">
    <g fill-rule="evenodd">
        <path d="M120.78304,34.329058 C125.424287,43.1924006 128.049406,53.2778608 128.049406,63.9764502 C128.049406,99.3226742 99.3956295,127.97645 64.0494055,127.97645 C28.7031816,127.97645 0.0494055385,99.3226742 0.0494055385,63.9764502 C0.0494055385,28.6302262 28.7031816,-0.0235498012 64.0494055,-0.0235498012 C82.8568763,-0.0235498012 99.769563,8.08898558 111.479045,21.0056358 L114.159581,18.3250998 C117.289194,15.1954866 122.356036,15.1939641 125.480231,18.3181584 C128.598068,21.4359957 128.601317,26.5107804 125.473289,29.6388083 L120.78304,34.329058 Z M108.72451,46.3875877 C110.870571,51.8341374 112.049406,57.767628 112.049406,63.9764502 C112.049406,90.4861182 90.5590735,111.97645 64.0494055,111.97645 C37.5397375,111.97645 16.0494055,90.4861182 16.0494055,63.9764502 C16.0494055,37.4667822 37.5397375,15.9764502 64.0494055,15.9764502 C78.438886,15.9764502 91.3495036,22.308215 100.147097,32.3375836 L58.9411255,73.5435552 L41.975581,56.5780107 C38.8486152,53.4510448 33.7746915,53.4551552 30.6568542,56.5729924 C27.5326599,59.6971868 27.5372202,64.7670668 30.6618725,67.8917192 L53.279253,90.5090997 C54.8435723,92.073419 56.8951519,92.8541315 58.9380216,92.8558261 C60.987971,92.8559239 63.0389578,92.0731398 64.6049211,90.5071765 L108.72451,46.3875877 Z"></path>
    </g>
</svg> <strong>save changes</strong> button in the sidebar, <strong>OR</strong></li><li><code>tiddlywiki mynewwiki --build index</code></li></ul></li></ol><p>The <code>-g</code> flag causes <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> to be installed globally. Without it, <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> will only be available in the directory where you installed it.</p><p>If you are using Debian or Debian-based Linux and you are receiving a <code>node: command not found</code> error though node.js package is installed, you may need to create a symbolic link between <code>nodejs</code> and <code>node</code>. Consult your distro's manual and <code>whereis</code> to correctly create a link. See github <a class="tc-tiddlylink-external" href="http://github.com/Jermolene/TiddlyWiki5/issues/1434" rel="noopener noreferrer" target="_blank">issue 1434</a></p><p>Example Debian v8.0: <code>sudo ln -s /usr/bin/nodejs /usr/bin/node</code></p><p>You can also install prior versions like this:</p><blockquote><p>npm install -g tiddlywiki@5.1.13</p></blockquote><h1 class="">Using <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki5.html">TiddlyWiki5</a> can be used on the command line to perform an extensive set of operations based on <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWikiFolders.html">TiddlyWikiFolders</a>, <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlerFiles.html">TiddlerFiles</a> and <a class="tc-tiddlylink tc-tiddlylink-missing" href="https://tiddlywiki.com/static/TiddlyWikiFiles.html">TiddlyWikiFiles</a>.</p><p>For example, the following command loads the tiddlers from a <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> HTML file and then saves one of them in static HTML:</p><pre><code>tiddlywiki --verbose --load mywiki.html --rendertiddler ReadMe ./readme.html</code></pre><p>Running <code>tiddlywiki</code> from the command line boots the <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> kernel, loads the core plugins and establishes an empty wiki store. It then sequentially processes the command line arguments from left to right. The arguments are separated with spaces.</p><p>The first argument is the optional path to the <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWikiFolders.html">TiddlyWikiFolder</a> to be loaded. If not present, then the current directory is used.</p><p>The commands and their individual arguments follow, each command being identified by the prefix <code>--</code>.</p><pre><code>tiddlywiki [&lt;wikipath&gt;] [--&lt;command&gt; [&lt;arg&gt;[,&lt;arg&gt;]]]</code></pre><p>The available commands are:</p><p><ul class="">

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/BuildCommand.html">
build
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/ClearPasswordCommand.html">
clearpassword
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/EditionsCommand.html">
editions
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/FetchCommand.html">
fetch
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/HelpCommand.html">
help
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/ImportCommand.html">
import
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/InitCommand.html">
init
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/LoadCommand.html">
load
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/MakeLibraryCommand.html">
makelibrary
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/OutputCommand.html">
output
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/PasswordCommand.html">
password
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/RenderCommand.html">
render
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/RenderTiddlerCommand.html">
rendertiddler
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/RenderTiddlersCommand.html">
rendertiddlers
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/SaveCommand.html">
save
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/SaveTiddlerCommand.html">
savetiddler
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/SaveTiddlersCommand.html">
savetiddlers
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/ServerCommand.html">
server
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/SetFieldCommand.html">
setfield
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/UnpackPluginCommand.html">
unpackplugin
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/VerboseCommand.html">
verbose
</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/VersionCommand.html">
version
</a>
</li>

</ul></p><h1 class="">Upgrading <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a> on Node.js</h1><p>If you've installed <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki%2520on%2520Node.js.html">TiddlyWiki on Node.js</a> on the usual way, when a new version is released you can upgrade it with this command:</p><pre><code>npm update -g tiddlywiki</code></pre><p>On Mac or Linux you'll need to add <strong>sudo</strong> like this:</p><pre><code>sudo npm update -g tiddlywiki</code></pre><h1 class="">Also see</h1><p><ul class="">

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWikiFolders.html">

TiddlyWikiFolders

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/MultiTiddlerFileSyntax.html">

MultiTiddlerFileSyntax

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/MultiTiddlerFiles.html">

MultiTiddlerFiles

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlerFiles.html">

TiddlerFiles

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Generating%2520Static%2520Sites%2520with%2520TiddlyWiki.html">

Generating Static Sites with TiddlyWiki

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/How%2520to%2520build%2520a%2520TiddlyWiki5%2520from%2520individual%2520tiddlers.html">

How to build a TiddlyWiki5 from individual tiddlers

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Using%2520TiddlyWiki%2520for%2520GitHub%2520project%2520documentation.html">

Using TiddlyWiki for GitHub project documentation

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Using%2520a%2520custom%2520path%2520prefix%2520with%2520the%2520client-server%2520edition.html">

Using a custom path prefix with the client-server edition

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Building%2520TiddlyWikiClassic.html">

Building TiddlyWikiClassic

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Customising%2520Tiddler%2520File%2520Naming.html">

Customising Tiddler File Naming

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Environment%2520Variables%2520on%2520Node.js.html">

Environment Variables on Node.js

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Scripts%2520for%2520TiddlyWiki%2520on%2520Node.js.html">

Scripts for TiddlyWiki on Node.js

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Serving%2520TW5%2520from%2520Android.html">

Serving TW5 from Android

</a>
</li>

<li>
<a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/Working%2520with%2520the%2520TiddlyWiki5%2520repository.html">

Working with the TiddlyWiki5 repository

</a>
</li>

</ul></p><p><em>This readme file was automatically generated by <a class="tc-tiddlylink tc-tiddlylink-resolves" href="https://tiddlywiki.com/static/TiddlyWiki.html">TiddlyWiki</a></em></p>