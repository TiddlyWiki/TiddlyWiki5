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
		store.addTiddler(new Tiddler(spec.tiddlers[t]));
	}
	for(t=0; t<spec.tests.length; t++) {
		w = store.getTiddler(spec.tests[t].tiddler).getParseTree().tree;
		if(JSON.stringify(w) !== JSON.stringify(spec.tests[t].output)) {
			console.error("Failed at tiddler: " + spec.tests[t].tiddler + " with JSON:\n" + util.inspect(w,false,8));
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
          { type: 'tiddlerLink',
            href: 'SecondTiddler',
            children: [ { type: 'text', value: 'SecondTiddler' } ] },
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
		  { type: 'tiddlerLink',
		    href: 'Fourth Tiddler',
		    children: [ { type: 'text', value: 'Fourth Tiddler' } ] },
		  { type: 'text', value: ' and ' },
		  { type: 'tiddlerLink',
		    href: 'Fourth Tiddler',
		    children: [ { type: 'text', value: 'a pretty link' } ] } ] },
     { tiddler: 'Fourth Tiddler',
       output: 
        [ { type: 'text', value: 'An image ' },
		  { type: 'img', src: 'Something.jpg' } ] } ] }
);
