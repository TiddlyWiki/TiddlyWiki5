jQuery(document).ready(function(){

	module("Wikifier.js");

	test("getParser()", function() {
		expect(7);

		formatter = new Formatter(config.formatters);

		var actual = getParser(null,null);
		var expected = formatter;
		deepEqual(actual, expected, 'it should return the default formatter if no tiddler argument is provided');

		var t = new Tiddler("t");
		actual = getParser(t,null);
		expected = formatter;
		deepEqual(actual, expected, 'it should return the default formatter if no format argument is provided and the tiddler has no "wikiformat" field and is not tagged with the value of formatTag of a member of config.parsers');

		actual = getParser(t,"nomatch");
		expected = formatter;
		deepEqual(actual, expected, 'it should return the default formatter if a format argument is provided, but does not appear as a value of formatTag of a member of config.parsers; the tiddler has no "wikiformat" field and is not tagged with the value of formatTag from a member of config.parsers');

		t.fields.wikiformat = "nomatch";
		actual = getParser(t,null);
		expected = formatter;
		deepEqual(actual, expected, 'it should return the default formatter if the tiddler has a "wikiformat" field that does not appear as a value of formatTag of a member of config.parsers; no format argument is provided and the tiddler is not tagged with the value of formatTag from a member of config.parsers');

		t.fields.wikiformat = "format_field";
		t.tags.push("format_tag");
		config.parsers.field = {
			format: "format_field"
		};
		config.parsers.tag = {
			formatTag: "format_tag"
		};
		actual = getParser(t,null);
		expected = config.parsers.field;
		equals(actual, expected, 'it should return the formatter specified by the "wikiformat" field even if a format tag is provided; no format parameter is provided');
		config.parsers.field = {};
		config.parsers.tag = {};

		t = new Tiddler("t");
		t.tags.push("format_tag");
		config.parsers.tag = {
			formatTag: "format_tag"
		};
		actual = getParser(t,null);
		expected = config.parsers.tag;
		equals(actual, expected, 'it should return the formatter specified by the format tag; the tiddler has no "wikiformat" field and no format parameter is provided');

		t = new Tiddler("t");
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
		actual = getParser(t,"format_parameter");
		expected = config.parsers.parameter;
		equals(actual, expected, 'it should return the formatter specified by the format parameter even if a format tag and a "wikiformat" field are provided');
		config.parsers.field = {};
		config.parsers.tag = {};
		config.parsers.parameter = {};
	});

	test('wikify(): it should not call subWikify() if the "source" parameter is not provided', function() {
		expect(1);

		var place = document.createElement("div");
		var d = document.body.appendChild(place);
		d.style.display = "none";

		var subWikifyMock = new jqMock.Mock(Wikifier.prototype, "subWikify");
		subWikifyMock.modify().args().multiplicity(0);
		wikify();
		subWikifyMock.verifyAll();
		subWikifyMock.restore();
	});

	test('Wikifier: wikifyStatic()', function() {
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
			equals(actual,expected,'testing input strings for Formatter.characterFormat'+wikifier_input_strings[i]);
		}

		formatter = new Formatter(config.formatters);
		expected = '<table class="twtable"><tbody><tr class="evenrow"><td>a</td><td>b</td></tr><tr class="oddrow"><td>c</td><td>d</td></tr></tbody></table>';
		actual = wikifyStatic("|a|b|\n|c|d|").toLowerCase();
		equals(actual,expected,'testing table formatting');
	});

	test('Wikifier: wikifyStatic() 2', function() {
		var expected = "";
		var actual = wikifyStatic(null);
		equals(actual,expected,'it should return an empty string if source does not exist');
		actual = wikifyStatic("");
		equals(actual,expected,'it should return an empty string if source is an empty string');

		source = "some text";
		actual = wikifyStatic(source);
		ok(actual,'it should not require a tiddler to work');

	/*'it should call subWikify() with the pre block as the only parameter': function() {
		var funcToMock = 'Wikifier.prototype.subWikify';
		tests_mock.before(funcToMock,function() {
			tests_mock.frame[funcToMock].funcArgs = arguments;
		});
		wikifyStatic(source);
		var tests_mock_return = tests_mock.after(funcToMock);
		var expected = "PRE";
		equals(tests_mock_return.called,true);
		equals(tests_mock_return.funcArgs.length,1);
		equals(tests_mock_return.funcArgs[0].nodeName,expected);
	},*/

		expected = "string";
		actual = typeof wikifyStatic(source);
		equals(actual,expected,'it should return a text string');

		place = document.createElement("div");
		d = document.body.appendChild(place);
		d.style.display = "none";
		expected = document.body.childNodes.length;
		var html = wikifyStatic(source);
		actual = document.body.childNodes.length;
		equals(actual,expected,'it should not leave any elements attached to the document body after returning');
		removeNode(d);
	});

	test('Wikifier: wikifyStatic() 3 htmlEntitiesEncoding', function() {
		wikifier_input_strings = {
			illegal01:"&a#x0301;",
			e160:"&#160;",
			e161:"&#161;",
			e162:"&#162;",
			e163:"&#163;",
			e255:"&#255;",
			e8800:"&#8800;",
			e0x300:"&#x300;",
			e0x0300:"&#x0300;"
		};

		wikifier_output_strings = {
			illegal01:"&amp;a#x0301;",
			e160:"<span>&nbsp;</span>",
			e161:"<span>¡</span>",
			e162:"<span>¢</span>",
			e163:"<span>£</span>",
			e255:"<span>ÿ</span>",
			e8800:"<span>≠</span>",
			e0x300:"<span>̀</span>",
			e0x0300:"<span>̀</span>"
		};

		formatter = new Formatter(config.formatters);
		var actual = "";
		var expected = "";
		for (var i in wikifier_input_strings) {
			actual = wikifyStatic(wikifier_input_strings[i]).toLowerCase();
			expected = wikifier_output_strings[i];
			equals(actual,expected,'testing input strings for Formatter.htmlEntitiesEncoding'+wikifier_input_strings[i]);
		}
	});
});
