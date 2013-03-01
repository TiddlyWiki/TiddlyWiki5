<h1 class=''>
Welcome to <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a></h1><div class='tw-transclude'>
<p>
Welcome to <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a>, a reboot of <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a>, the reusable non-linear personal web notebook <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='History'>
first released in 2004</a>. It is a complete interactive wiki in <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-missing' href='JavaScript'>
JavaScript</a> that can be run from a single HTML file in the browser or as a powerful <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='node.js'>
node.js application</a>.</p><p>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> is designed to fit around your brain, giving you a better way of managing information than traditional documents and emails. The fundamental idea is that information is more useful and reusable if we cut it up into the smallest semantically meaningful chunks &ndash; <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='Tiddlers'>
tiddlers</a> &ndash; and give them titles so that they can be structured with links, tags and macros.  <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> aims to provide a fluid interface for working with tiddlers, allowing them to be aggregated and composed into longer narratives.</p><p>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a> has many <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='Improvements'>
improvements</a> over the original. It is currently labelled alpha, meaning it is working but incomplete. It is the best possible time to get involved and support its future development. You can:</p><ul>
<li>
Explore its features online at <a class='tw-tiddlylink tw-tiddlylink-external' href='http://five.tiddlywiki.com/'>
http://five.tiddlywiki.com/</a></li><li>
Get involved in the <a class='tw-tiddlylink tw-tiddlylink-external' href='https://github.com/Jermolene/TiddlyWiki5'>
development on GitHub</a></li><li>
Join the discussions on <a class='tw-tiddlylink tw-tiddlylink-external' href='http://groups.google.com/group/TiddlyWikiDev'>
the TiddlyWikiDev Google Group</a></li><li>
Follow <a class='tw-tiddlylink tw-tiddlylink-external' href='http://twitter.com/#!/TiddlyWiki'>
@TiddlyWiki on Twitter</a> for the latest news</li></ul></div><h1 class=''>
Usage</h1><div class='tw-transclude'>
<p>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a> can be used on the command line to perform an extensive set of operations based on tiddlers, <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlerFiles'>
TiddlerFiles</a> and <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-missing' href='TiddlyWikiFiles'>
TiddlyWikiFiles</a>. For example, this loads the tiddlers from a <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> HTML file and then saves one of them in HTML:</p><pre>
node tiddlywiki.js --verbose --load mywiki.html --savetiddler ReadMe ./readme.html</pre><h2 class=''>
Usage</h2><p>
Running <code>
tiddlywiki.js</code> from the command line boots the <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> kernel, loads the core plugins and establishes an empty wiki store. It then sequentially processes the command line arguments from left to right. The arguments are separated with spaces.</p><p>
The first argument is the optional path to the wiki directory to be loaded. If not present, then the current directory is used.</p><p>
The commands and their individual arguments follow, each command being identified by the prefix <code>
--</code>.</p><pre>
node tiddlywiki.js [&lt;wikipath&gt;] [--&lt;command&gt; [&lt;arg&gt;[,&lt;arg&gt;]]]</pre><h2 class=''>
Batch Files</h2><p>
For trying <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a> out under node.js, several batch files are provided:</p><ul>
<li>
<code>
bld.sh</code> builds the new <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> 5 HTML file</li><li>
<code>
2bld.sh</code> builds <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki'>
TiddlyWiki</a> 2.6.5 from its original source</li></ul><h2 class=''>
Commands</h2><p>
The following commands are available:</p><div class='tw-list-frame'>
<div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='DumpCommand'>
DumpCommand</a></span></span></div><div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='LoadCommand'>
LoadCommand</a></span></span></div><div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='SaveTiddlerCommand'>
SaveTiddlerCommand</a></span></span></div><div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='ServerCommand'>
ServerCommand</a></span></span></div><div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='VerboseCommand'>
VerboseCommand</a></span></span></div><div class='tw-list-element'>
<span class='tw-transclude'>
<span class='tw-view-link'>
<a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='VersionCommand'>
VersionCommand</a></span></span></div></div></div><p>
<em>
This <code>
readme</code> file was automatically generated by <a class='tw-tiddlylink tw-tiddlylink-internal tw-tiddlylink-resolves' href='TiddlyWiki5'>
TiddlyWiki5</a></em>
</p>