/*
Wikifier test rig
*/


var Tiddler = require("./js/Tiddler.js").Tiddler,
	TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	utils = require("./js/Utils.js"),
	util = require("util");

var wikiTest = function(spec) {
	var t,
		store = new TiddlyWiki(),
		w;
	for(t=0; t<spec.tiddlers.length; t++) {
		var tid = new Tiddler(spec.tiddlers[t]);
		store.addTiddler(tid);

console.error("%s in HTML:\n%s\nAnd in plain:\n%s",
			tid.fields.title,
			tid.getParseTree().render("text/html",store,tid.fields.title),
			tid.getParseTree().render("text/plain",store,tid.fields.title));


	}
	for(t=0; t<spec.tests.length; t++) {
		w = store.getTiddler(spec.tests[t].tiddler).getParseTree().tree;
		if(JSON.stringify(w) !== JSON.stringify(spec.tests[t].output)) {
			console.error("Failed at tiddler: " + spec.tests[t].tiddler + " with JSON:\n" + util.inspect(w,false,8) + "\nTarget was:\n" + util.inspect(spec.tests[t].output,false,8));
		}
	}
};

wikiTest({ tiddlers: 
   [ { title: 'FirstTiddler',
       text: 'This is the \'\'text\'\' of the first tiddler, with a link to the SecondTiddler, too.' },
     { title: 'SecondTiddler',
       text: '!!Heading\nThis is the second tiddler. It has a list:\n* Item one\n* Item two\n* Item three\nAnd a <<macro invocation>>\n' },
     { title: 'ThirdTiddler',
       text: 'An explicit link [[Fourth Tiddler]] and [[a pretty link|Fourth Tiddler]]' },
     { title: 'Fourth Tiddler',
       text: 'An image [img[Something.jpg]]' } ],
  tests:
   [ { tiddler: 'FirstTiddler',
       output: 
        [ { type: 'text', value: 'This is the ' },
          { type: 'strong',
            children: [ { type: 'text', value: 'text' } ] },
          { type: 'text',
            value: ' of the first tiddler, with a link to the ' },
          { type: 'a',
            children: [ { type: 'text', value: 'SecondTiddler' } ],
          	attributes: {href: 'SecondTiddler', className: 'tiddlyLink' } },
          { type: 'text', value: ', too.' } ] },
     { tiddler: 'SecondTiddler',
       output: 
        [ { type: 'h2',
            children: [ { type: 'text', value: 'Heading' } ] },
          { type: 'text',
            value: 'This is the second tiddler. It has a list:' },
          { type: 'br' },
          { type: 'ul',
            children: 
             [ { type: 'li',
                 children: [ { type: 'text', value: ' Item one' } ] },
               { type: 'li',
                 children: [ { type: 'text', value: ' Item two' } ] },
               { type: 'li',
                 children: [ { type: 'text', value: ' Item three' } ] } ] },
          { type: 'text', value: 'And a ' },
          { type: 'macro', name: 'macro', params: 'invocation' },
          { type: 'br' } ] },
     { tiddler: 'ThirdTiddler',
       output: 
		[ { type: 'text', value: 'An explicit link ' },
		  { type: 'a',
		    children: [ { type: 'text', value: 'Fourth Tiddler' } ],
		    attributes: { href: 'Fourth Tiddler', className: 'tiddlyLink' } },
		  { type: 'text', value: ' and ' },
		  { type: 'a',
		    children: [ { type: 'text', value: 'a pretty link' } ],
		    attributes: { href: 'Fourth Tiddler', className: 'tiddlyLink' } } ] },
     { tiddler: 'Fourth Tiddler',
       output: 
        [ { type: 'text', value: 'An image ' },
		  { type: 'img',  attributes: {src: 'Something.jpg' } } ] } ] }
);
