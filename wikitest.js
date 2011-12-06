/*
Wikifier test rig
*/


var Tiddler = require("./js/Tiddler.js").Tiddler,
	WikiStore = require("./js/WikiStore.js").WikiStore,
	utils = require("./js/Utils.js"),
	util = require("util");

var wikiTest = function(spec) {
//console.error(util.inspect(spec,false,99));
	var t,
		store = new WikiStore(),
		w;
	for(t=0; t<spec.tiddlers.length; t++) {
		var tid = new Tiddler(spec.tiddlers[t]);
		store.addTiddler(tid);
	}
	for(t=0; t<spec.tests.length; t++) {
		w = store.getTiddler(spec.tests[t].tiddler).getParseTree();
		if(JSON.stringify(w.tree) !== JSON.stringify(spec.tests[t].output.tree)) {
			console.error("Failed at tiddler: " + spec.tests[t].tiddler + " with JSON:\n" + util.inspect(w.tree,false,50) + "\nTarget was:\n" + util.inspect(spec.tests[t].output.tree,false,50));
		}
		var r = w.render("text/html",store,spec.tests[t].tiddler);
		if(r !== spec.tests[t].output.html) {
			console.error("Failed at tiddler: " + spec.tests[t].tiddler + " with HTML:\n" + r + "\nTarget was:\n" + spec.tests[t].output.html);
		}
		var r = w.render("text/plain",store,spec.tests[t].tiddler);
		if(r !== spec.tests[t].output.plain) {
			console.error("Failed at tiddler: " + spec.tests[t].tiddler + " with plain text:\n" + r + "\nTarget was:\n" + spec.tests[t].output.plain);
		}
	}
};

wikiTest(
{ tiddlers: 
   [ { title: 'FirstTiddler',
       text: 'This is the \'\'text\'\' of the first tiddler, with a @@font-size:8em;color:red;link@@ to the SecondTiddler, too.' },
     { title: 'SecondTiddler',
       text: '!!Heading\nThis is the second tiddler. It has a list:\n* Item one\n* Item two\n* Item three\nAnd a <<macro invocation>>\n' },
     { title: 'ThirdTiddler',
       text: 'An explicit link [[Fourth Tiddler]] and [[a pretty link|Fourth Tiddler]]' },
     { title: 'Fourth Tiddler',
       text: 'An image [img[Something.jpg]]' },
     { title: 'Fifth Tiddler',
       text: '|A caption above the table|c\n| Left | Middle | Right |h\n|North West|North|North East|\n|West|Here|East|\n|South West|South|South East|' } ],
  tests: 
   [ { tiddler: 'FirstTiddler',
       output: 
        { tree: 
           [ { type: 'text', value: 'This is the ' },
             { type: 'strong',
               children: [ { type: 'text', value: 'text' } ] },
             { type: 'text', value: ' of the first tiddler, with a ' },
             { type: 'span',
               children: [ { type: 'text', value: 'link' } ],
               attributes: { style: { 'font-size': '8em', color: 'red' } } },
             { type: 'text', value: ' to the ' },
             { type: 'a',
               children: [ { type: 'text', value: 'SecondTiddler' } ],
               attributes: { href: 'SecondTiddler', className: 'tiddlyLink' } },
             { type: 'text', value: ', too.' } ],
          html: 'This is the <strong>text</strong> of the first tiddler, with a <span style="font-size:8em;color:red;">link</span> to the <a href="SecondTiddler" className="tiddlyLink">SecondTiddler</a>, too.',
          plain: 'This is the text of the first tiddler, with a link to the SecondTiddler, too.' } },
     { tiddler: 'SecondTiddler',
       output: 
        { tree: 
           [ { type: 'h2', children: [ { type: 'text', value: 'Heading' } ] },
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
             { type: 'br' } ],
          html: '<h2>Heading</h2>This is the second tiddler. It has a list:<br /><ul><li> Item one</li><li> Item two</li><li> Item three</li></ul>And a <macro></macro><br />',
          plain: 'HeadingThis is the second tiddler. It has a list: Item one Item two Item threeAnd a ' } },
     { tiddler: 'ThirdTiddler',
       output: 
        { tree: 
           [ { type: 'text', value: 'An explicit link ' },
             { type: 'a',
               children: [ { type: 'text', value: 'Fourth Tiddler' } ],
               attributes: { href: 'Fourth Tiddler', className: 'tiddlyLink' } },
             { type: 'text', value: ' and ' },
             { type: 'a',
               children: [ { type: 'text', value: 'a pretty link' } ],
               attributes: { href: 'Fourth Tiddler', className: 'tiddlyLink' } } ],
          html: 'An explicit link <a href="Fourth Tiddler" className="tiddlyLink">Fourth Tiddler</a> and <a href="Fourth Tiddler" className="tiddlyLink">a pretty link</a>',
          plain: 'An explicit link Fourth Tiddler and a pretty link' } },
     { tiddler: 'Fourth Tiddler',
       output: 
        { tree: 
           [ { type: 'text', value: 'An image ' },
             { type: 'img', attributes: { src: 'Something.jpg' } } ],
          html: 'An image <img src="Something.jpg" />',
          plain: 'An image ' } },
     { tiddler: 'Fifth Tiddler',
       output: 
        { tree: 
           [ { type: 'table',
               attributes: { className: 'twtable' },
               children: 
                [ { type: 'caption',
                    children: [ { type: 'text', value: 'A caption above the table' } ],
                    attributes: { align: 'top' } },
                  { type: 'thead',
                    children: 
                     [ { type: 'tr',
                         children: 
                          [ { type: 'td',
                              children: [ { type: 'text', value: 'Left' } ],
                              attributes: { align: 'center' } },
                            { type: 'td',
                              children: [ { type: 'text', value: 'Middle' } ],
                              attributes: { align: 'center' } },
                            { type: 'td',
                              children: [ { type: 'text', value: 'Right' } ],
                              attributes: { align: 'center' } } ],
                         attributes: { className: 'evenRow' } } ],
                    attributes: {} },
                  { type: 'tbody',
                    children: 
                     [ { type: 'tr',
                         children: 
                          [ { type: 'td',
                              children: [ { type: 'text', value: 'North West' } ] },
                            { type: 'td', children: [ { type: 'text', value: 'North' } ] },
                            { type: 'td',
                              children: [ { type: 'text', value: 'North East' } ] } ],
                         attributes: { className: 'oddRow' } },
                       { type: 'tr',
                         children: 
                          [ { type: 'td', children: [ { type: 'text', value: 'West' } ] },
                            { type: 'td', children: [ { type: 'text', value: 'Here' } ] },
                            { type: 'td', children: [ { type: 'text', value: 'East' } ] } ],
                         attributes: { className: 'evenRow' } },
                       { type: 'tr',
                         children: 
                          [ { type: 'td',
                              children: [ { type: 'text', value: 'South West' } ] },
                            { type: 'td', children: [ { type: 'text', value: 'South' } ] },
                            { type: 'td',
                              children: [ { type: 'text', value: 'South East' } ] } ],
                         attributes: { className: 'oddRow' } } ],
                    attributes: {} } ] } ],
          html: '<table className="twtable"><caption align="top">A caption above the table</caption><thead><tr className="evenRow"><td align="center">Left</td><td align="center">Middle</td><td align="center">Right</td></tr></thead><tbody><tr className="oddRow"><td>North West</td><td>North</td><td>North East</td></tr><tr className="evenRow"><td>West</td><td>Here</td><td>East</td></tr><tr className="oddRow"><td>South West</td><td>South</td><td>South East</td></tr></tbody></table>',
          plain: 'A caption above the tableLeftMiddleRightNorth WestNorthNorth EastWestHereEastSouth WestSouthSouth East' } } ] }
);
