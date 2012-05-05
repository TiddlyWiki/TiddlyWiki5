// <![CDATA[
describe('Wikifier: getParser()', {

	before_each: function(){
		formatter = new Formatter(config.formatters);
	},
	
	after_each: function() {
		formatter = null;
	},

	'it should return the default formatter if no tiddler argument is provided': function() {
		var actual = getParser(null,null);
		console.log(actual);
		var expected = formatter;
		console.log(expected);
		value_of(actual).should_be(expected);
	},

	'it should return the default formatter if no format argument is provided and the tiddler has no "wikiformat" field and is not tagged with the value of formatTag of a member of config.parsers': function() {
		var t = new Tiddler("t");
		var actual = getParser(t,null);
		var expected = formatter;
		value_of(actual).should_be(expected);
	},

	'it should return the default formatter if a format argument is provided, but does not appear as a value of formatTag of a member of config.parsers; the tiddler has no "wikiformat" field and is not tagged with the value of formatTag from a member of config.parsers': function() {
		var t = new Tiddler("t");
		var actual = getParser(t,"nomatch");
		var expected = formatter;
		value_of(actual).should_be(expected);
	},

	'it should return the default formatter if the tiddler has a "wikiformat" field that does not appear as a value of formatTag of a member of config.parsers; no format argument is provided and the tiddler is not tagged with the value of formatTag from a member of config.parsers': function() {
		var t = new Tiddler("t");
		t.fields.wikiformat = "nomatch";
		var actual = getParser(t,null);
		var expected = formatter;
		value_of(actual).should_be(expected);
	},

	'it should return the formatter specified by the "wikiformat" field even if a format tag is provided; no format parameter is provided': function() {
		var t = new Tiddler("t");
		t.fields.wikiformat = "format_field";
		t.tags.push("format_tag");
		config.parsers.field = {
			format: "format_field"
		};
		config.parsers.tag = {
			formatTag: "format_tag"
		};
		var actual = getParser(t,null);
		var expected = config.parsers.field;
		value_of(actual).should_be(expected);
	},

	'it should return the formatter specified by the format tag; the tiddler has no "wikiformat" field and no format parameter is provided': function() {
		var t = new Tiddler("t");
		t.tags.push("format_tag");
		config.parsers.tag = {
			formatTag: "format_tag"
		};
		var actual = getParser(t,null);
		var expected = config.parsers.tag;
		value_of(actual).should_be(expected);
	},

	'it should return the formatter specified by the format parameter even if a format tag and a "wikiformat" field are provided': function() {
		var t = new Tiddler("t");
		t.fields.wikiformat = "format_field";
		t.tags.push("format_tag");
		config.parsers.field = {
			format: "format_field"
		};
		config.parsers.tag = {
			formatTag: "format_tag"
		};
		config.parsers.parameter = {
			format: "format_parameter"
		};
		var actual = getParser(t,"format_parameter");
		var expected = config.parsers.parameter;
		value_of(actual).should_be(expected);
	}
});

describe('Wikifier: wikify()', {

	before_each: function() {
		place = document.createElement("div");
		d = document.body.appendChild(place);
		d.style.display = "none";
	},

	after_each: function() {
		removeNode(d);
	},

	'it should not call subWikify() if the "source" parameter is not provided': function() {
		var funcToMock = 'Wikifier.prototype.subWikify';
		tests_mock.before(funcToMock);
		wikify();
		var actual = tests_mock.after(funcToMock).called;
		value_of(actual).should_be_false();
	},

	'it should not call subWikify() if the "source" parameter is an empty string': function() {
		var funcToMock = 'Wikifier.prototype.subWikify';
		tests_mock.before(funcToMock);
		var source = "";
		wikify(source);
		value_of(tests_mock.after(funcToMock).called).should_be_false();
	},

	'it should call subWikify()': function() {
		var funcToMock = 'Wikifier.prototype.subWikify';
		tests_mock.before(funcToMock);
		var source = "hello";
		wikify(source);
		value_of(tests_mock.after(funcToMock).called).should_be(true);
	}
});

describe('Wikifier: wikifyStatic()', {
	'testing input strings for Formatter.characterFormat': function() {
		wikifier_input_strings = {
			bold:"''bold''",
			italic:"//italic//",
			underline:"__underline__",
			superscript:"^^superscript^^",
			subscript:"~~subscript~~",
			strikeout:"--strikeout--",
			code:"{{{code}}}"
		};

		wikifier_output_strings = {
			bold:"<strong>bold</strong>",
			italic:"<em>italic</em>",
			underline:"<u>underline</u>",
			superscript:"<sup>superscript</sup>",
			subscript:"<sub>subscript</sub>",
			strikeout:"<strike>strikeout</strike>",
			code:"<code>code</code>"
		};

		formatter = new Formatter(config.formatters);
		var actual = "";
		var expected = "";
		for (var i in wikifier_input_strings) {
			actual = wikifyStatic(wikifier_input_strings[i]).toLowerCase();
			expected = wikifier_output_strings[i];
			value_of(actual).should_be(expected);
		}
	},
	'testing table formatting': function() {
		formatter = new Formatter(config.formatters);
		var expected = '<table class="twtable"><tbody><tr class="evenrow"><td>a</td><td>b</td></tr><tr class="oddrow"><td>c</td><td>d</td></tr></tbody></table>';
		var actual = wikifyStatic("|a|b|\n|c|d|").toLowerCase();
		value_of(actual).should_be(expected);
	}
	/*'table surrounded by character formatting should not cause infinite loop': function() {
		formatter = new Formatter(config.formatters);
		var actual = wikifyStatic("''|a|b|\n|c|d|''").toLowerCase();
		value_of(true).should_be_true(); // just check that above line did not cause infinite loop
	}*/
});

describe('Wikifier: wikifyStatic()', {
	before_each: function() {
		place = document.createElement("div");
		d = document.body.appendChild(place);
		d.style.display = "none";
		source = "some text";
	},

	after_each: function() {
		removeNode(d);
	},

	'it should return an empty string if source does not exist or is an empty string': function() {
		var expected = "";
		var actual = wikifyStatic(null);
		value_of(actual).should_be(expected);
		actual = wikifyStatic("");
		value_of(actual).should_be(expected);
	},

	'it should not require a tiddler to work': function() {
		var actual = wikifyStatic(source);
		value_of(actual).should_not_be_null();
	},

	'it should call subWikify() with the pre block as the only parameter': function() {
		var funcToMock = 'Wikifier.prototype.subWikify';
		tests_mock.before(funcToMock,function() {
			tests_mock.frame[funcToMock].funcArgs = arguments;
		});
		wikifyStatic(source);
		var tests_mock_return = tests_mock.after(funcToMock);
		var expected = "PRE";
		value_of(tests_mock_return.called).should_be(true);
		value_of(tests_mock_return.funcArgs.length).should_be(1);
		value_of(tests_mock_return.funcArgs[0].nodeName).should_be(expected);
	},

	'it should return a text string': function() {
		var expected = "string";
		var actual = typeof wikifyStatic(source);
	},

	'it should not leave any elements attached to the document body after returning': function() {
		var expected = document.body.childNodes.length;
		var html = wikifyStatic(source);
		var actual = document.body.childNodes.length;
		value_of(actual).should_be(expected);
	}
});

describe('Wikifier: wikifyPlain', {

	before_each: function() {
		store = new TiddlyWiki();
		loadShadowTiddlers();
		store.saveTiddler("t","t","text");
		formatter = new Formatter(config.formatters);
	},

	'it should use the store if only a title parameter is provided': function() {
		var actual = wikifyPlain("t");
		value_of(actual).should_not_be_null();
	},

	'it should call wikifyPlainText() if the tiddler exists in the store or is a shadow tiddler': function() {
		tests_mock.before('wikifyPlainText');
		wikifyPlain("t");
		var actual = tests_mock.after('wikifyPlainText').called;
		value_of(actual).should_be_true();
	},

	'it should call wikifyPlainText() if the tiddler is a shadow tiddler': function() {

		var t = store.isShadowTiddler("SiteTitle");
		value_of(t).should_be_true();
		mockVars = tests_mock.before('wikifyPlainText');
		wikifyPlain("SiteTitle");
		var actual = tests_mock.after('wikifyPlainText').called;
		value_of(actual).should_be_true();
	},

	'it should return an empty string if the tiddler is not in the store or a shadow tiddler': function() {
		var tiddler = store.getTiddler("foo");
		value_of(tiddler).should_be(null);
		var actual = wikifyPlain("foo");
		var expected = "";
		value_of(actual).should_be(expected);
	}
});

describe('Wikifier: wikifyPlainText', {

	before_each: function() {
		store = new TiddlyWiki();
		loadShadowTiddlers();
		formatter = new Formatter(config.formatters);
	},

	'if a limit parameter is provided and the input text is greater in length than the limit, the number of characters generated should equal the limit': function() {
		var limit = 5;
		var	source = "aphraseof21characters";
		var actual = wikifyPlainText(source,limit).length;
		var expected = limit;
		value_of(actual).should_be(expected);
	},

	'it should call Wikifier.prototype.wikifyPlain()': function() {
		tests_mock.before('Wikifier.prototype.wikifyPlain');
		wikifyPlainText("hello",1,new Tiddler("temp"));
		var actual = tests_mock.after('Wikifier.prototype.wikifyPlain').called;
		value_of(actual).should_be_true();
	},

	'it should take an optional tiddler parameter that sets the context for the wikification': function() {
		var tiddler = new Tiddler("temp");
		var source = "<<view text>>";
		tiddler.text = "the text of a tiddler";
		var expected = tiddler.text;
		store.saveTiddler("temp","temp",tiddler.text);
		var actual = wikifyPlainText(source,null,tiddler);
		value_of(actual).should_be(expected);
	}
});

describe('Wikifier: highlightify', {

	before_each: function() {
		output = document.body.appendChild(document.createElement("div"));
		source = "test text";
		highlightregexp = new RegExp("text","img");
		tiddler = new Tiddler("temp");
	},

	'it should not add anything to the "output" element if the source parameter is empty': function() {
		var actual = highlightify(null,output);
		value_of(actual).shoufld_be_null;
	},

	'it should highlight output text by wrapping with a span of class "highlight"': function() {
		var expected = 'test <span class="highlight">text</span>';
		highlightify(source,output,highlightregexp,tiddler);
		// value in IE is: test <SPAN class=highlight>text</SPAN>
		// note SPAN is capitals and no quotes
		actual = output.innerHTML;
		value_of(actual).should_be(expected);
	},

	after_each: function() {
		removeNode(output);
	}

});

describe('Wikifier: Wikifier()', {

	'it should return a Wikifier object': function() {
		var actual = new Wikifier();
		value_of(actual instanceof Wikifier).should_be_true();
	},

	'it should return an object with properties source, output, formatter, nextMatch, autoLinkWikiWords, highlightRegExp, highlightMatch, isStatic, tiddler': function() {
		var actual = new Wikifier();
		value_of(actual.hasOwnProperty("source")).should_be_true();
		value_of(actual.hasOwnProperty("output")).should_be_true();
		value_of(actual.hasOwnProperty("formatter")).should_be_true();
		value_of(actual.hasOwnProperty("nextMatch")).should_be_true();
		value_of(actual.hasOwnProperty("autoLinkWikiWords")).should_be_true();
		value_of(actual.hasOwnProperty("highlightRegExp")).should_be_true();
		value_of(actual.hasOwnProperty("highlightMatch")).should_be_true();
		value_of(actual.hasOwnProperty("isStatic")).should_be_true();
		value_of(actual.hasOwnProperty("tiddler")).should_be_true();

	}

});

describe('Wikifier: wikifyPlain', {

	'it should return the plain text value of the return value of this.subWikify()': function() {
		store = new TiddlyWiki();
		formatter = new Formatter(config.formatters);
		var source = "a StringWith some [[wikitext]] ''inside''";
		var w = new Wikifier(source,formatter);
		var actual = w.wikifyPlain();
		var expected = "a StringWith some wikitext inside";
		value_of(actual).should_be(expected);
	}
});

describe('Wikifier: subWikify', {

	before_each: function() {
		formatter = new Formatter(config.formatters);
		output = document.body.appendChild(document.createElement("div"));
		terminator = "";
		w = new Wikifier("test",formatter);
	},

	'it should call this.subWikifyUnterm if second parameter is not provided': function() {
		tests_mock.before('Wikifier.prototype.subWikifyUnterm');
		w.subWikify(output);
		var actual = tests_mock.after('Wikifier.prototype.subWikifyUnterm').called;
		value_of(actual).should_be_true;
	},

	'it should call this.subWikifyTerm if a second parameter is provided': function() {
		tests_mock.before('Wikifier.prototype.subWikifyTerm');
		w.subWikify(output,terminator);
		var actual = tests_mock.after('Wikifier.prototype.subWikifyTerm').called;
		value_of(actual).should_be_true;
	},

	after_each: function() {
		removeNode(output);
		delete formatter;
		delete terminator;
		delete w;
	}
});

describe('Wikifier: subWikifyUnterm', {

	before_each: function() {
		formatter = new Formatter([{
			name: "test",
			match: "test",
			handler: function(w)
			{
				createTiddlyText(w.output,w.matchText);
			}
		}]);

		output = document.body.appendChild(document.createElement("div"));
		source = "some test input for a test of a function";
		w = new Wikifier(source,formatter);
	},

	'it should pass any text that matches the formatter\'s regexp to the correct handler in the formatter': function() {
		w.subWikifyUnterm(output);
		var actual = output.innerHTML;
		var expected = source;
		value_of(actual).should_be(expected);
	},

	'it should output any text before, between or after a match': function() {
		tests_mock.before('Wikifier.prototype.outputText');
		w.subWikifyUnterm(output);
		var actual = tests_mock.after('Wikifier.prototype.outputText').called;
		value_of(actual).should_be(3);
		actual = output.innerHTML;
		var expected = "testtest";
		value_of(actual).should_be(expected);
	},

	after_each: function() {
		removeNode(output);
		delete formatter;
		delete source;
		delete w;
	}
});

describe('Wikifier: subWikifyTerm', {

	before_each: function() {
		formatter = new Formatter([{
			name: "test",
			match: "test",
			handler: function(w)
			{
				createTiddlyText(w.output,w.matchText);
			}
		}]);

		termRegExp = /(\n)/mg;
		output = document.body.appendChild(document.createElement("div"));
		source = "some test multi-line test input \n for a test of a function";
		w = new Wikifier(source,formatter);
	},

	'it should ignore all input after a match with termRegExp': function() {
		w.subWikifyTerm(output,termRegExp);
		var actual = output.innerHTML;
		var expected = source.substring(0,source.indexOf("\n"));
		value_of(actual).should_be(expected);
	},

	'it should pass any text that matches the formatter\'s regexp to the correct handler in the formatter': function() {
		tests_mock.before('formatter.formatters[0].handler');
		w.subWikifyTerm(output,termRegExp);
		var actual = tests_mock.after('formatter.formatters[0].handler').called;
		value_of(actual).should_be(2);
	},

	'it should output any text before, between or after a formatter match': function() {
		tests_mock.before('Wikifier.prototype.outputText');
		w.subWikifyTerm(output,termRegExp);
		var actual = tests_mock.after('Wikifier.prototype.outputText').called;
		value_of(actual).should_be(3);
		actual = output.innerHTML;
		var expected = "testtest";
		value_of(actual).should_be(expected);
	},

	after_each: function() {
		removeNode(output);
		delete formatter;
		delete termRegExp;
		delete source;
		delete w;
	}
});

describe('Wikifier: outputText', {

	before_each: function() {
		formatter = new Formatter(config.formatters);
		source = "some test input";
		highlightRegExp = /test/g;
		output = document.body.appendChild(document.createElement("div"));
	},

	'it should output all the input text if the Wikifier object\'s highlightRegExp property is null': function() {
		w = new Wikifier(source,formatter);
		w.outputText(output,0,source.length);
		var actual = output.innerHTML;
		value_of(actual).should_be(source);
	},

	'it should wrap any text that matched by the Wikifier object\'s highlightRegExp in <span> tags with a class of "highlight"': function() {
		w = new Wikifier(source,formatter,highlightRegExp);
		w.outputText(output,0,source.length);
		var actual = output.innerHTML;
		var match = actual.match("<span");
		if(!match)
			match = actual.match("<SPAN");
		var length = match ? match.length : -1;
		value_of(length).should_be(1);
	},

	after_each: function() {
		removeNode(output);
		delete formatter;
		delete source;
		delete highlightRegExp;
	}

});

// ]]>

