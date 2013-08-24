<h1 class=''>
Building classic <span>
TiddlyWiki</span> with <span>
TiddlyWiki5</span></h1><div class='tw-tiddler'>
<div class='tw-transclude'>
<p>
<span>
TiddlyWiki5</span> can be used to build older 2.x.x versions of <span>
TiddlyWiki</span> from their constituent components. Doing so involves these additional features over and above those used for building <span>
TiddlyWiki5</span>:</p><ul>
<li>
The <code>
tiddlywiki2/loadrecipe</code> plugin, containing a deserializer module which allows tiddlers to be loaded from <span>
TiddlyWiki</span> 2.x.x <code>
.recipe</code> files</li><li>
The <code>
tiddlywiki2/stripcomments</code> plugin, containing a new viewer format for the <code>
&lt;$view&gt;</code> widget that strips single line <span>
JavaScript</span> comments starting <code>
//#</code></li><li>
The <code>
stripTitlePrefix='yes'</code> attribute of the <code>
&lt;$fields&gt;</code> widget, which removes prefixes wrapped in curly braces from the <code>
title</code> attribute<ul>
<li>
For example, <code>
{tiddler}HelloThere</code> would be transformed to <code>
HelloThere</code></li></ul></li></ul><h1 class=''>
Usage</h1><p>
<span>
TiddlyWikiClassic</span> is built from the command line by running <span>
TiddlyWiki5</span> under node.js. A typical usage would be:</p><pre>
node ../../tiddlywiki.js \
	--verbose \
	--load &lt;path_to_recipe_file&gt; \
	--rendertiddler $:/core/templates/tiddlywiki2.template.html &lt;path_to_write_index_file&gt; text/plain \
	|| exit 1</pre></div></div>