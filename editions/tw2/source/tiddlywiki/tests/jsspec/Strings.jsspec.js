// <![CDATA[
describe('Strings', {
	'String right': function() {
		var actual = "abcdef".right(3);
		var expected = "def";
		value_of(actual).should_be(expected);
	},
	'String trim': function() {
		var actual = " abcdef ".trim();
		var expected = "abcdef";
		value_of(actual).should_be(expected);
	},
	'String undash': function() {
		var actual = "background-color".unDash();
		var expected = "backgroundColor";
		value_of(actual).should_be(expected);
	},
	'String format with an empty substring array should return input string': function() {
		var actual = "hello %0, is your favourite colour red?".format([]);
		var expected = "hello , is your favourite colour red?";
		value_of(actual).should_be(expected);
	},
	'String format with a substrings array of correct size (1) should add substrings in the right places': function() {
		var actual = "hello %0, is your favourite colour red?".format(["Jon"]);
		var expected = "hello Jon, is your favourite colour red?";
		value_of(actual).should_be(expected);
	},
	'String format with a substrings array of more than enough substrings (1 needed) should add substrings in the right places': function() {
		var actual = "hello %0, is your favourite colour red?".format(["Jon","rhubarb","rhubarb"]);
		var expected = "hello Jon, is your favourite colour red?";
		value_of(actual).should_be(expected);
	},
	'String format with an empty substring array and no %1-type specifiers should return input string': function() {
		var actual = "hello Jon, is your favourite colour red?".format([]);
		var expected = "hello Jon, is your favourite colour red?";
		value_of(actual).should_be(expected);
	},
	'String format with a substrings array of non-zero size (1) and no %1-type specifiers should return input string': function() {
		var actual = "hello Jon, is your favourite colour red?".format(["rhubarb"]);
		var expected = "hello Jon, is your favourite colour red?";
		value_of(actual).should_be(expected);
	},
	'String.encodeTiddlyLinkList with null parameter should return null string': function() {
		var actual = String.encodeTiddlyLinkList();
		var expected = "";
		value_of(actual).should_be(expected);
	},
	'String.encodeTiddlyLinkList with empty array as parameter should return null string': function() {
		var actual = String.encodeTiddlyLinkList([]);
		var expected = "";
		value_of(actual).should_be(expected);
	},
	'String "abcdefghijklmnopqrstuvwxyz" startsWith "abc"': function() {
		value_of("abcdefghijklmnopqrstuvwxyz".startsWith("abc")).should_be(true);
	},
	'String "abcdefghijklmnopqrstuvwxyz" does not startsWith "def"': function() {
		value_of("abcdefghijklmnopqrstuvwxyz".startsWith("def")).should_be(false);
	},
	'String "abcdefghijklmnopqrstuvwxyz" startsWith ""': function() {
		value_of("abcdefghijklmnopqrstuvwxyz".startsWith("")).should_be(true);
	}
});

describe('Strings: html encoding/decoding', {
	'String should correctly htmlEncode &<>"': function() {
		var actual = '&<>"'.htmlEncode();
		var expected = '&amp;&lt;&gt;&quot;';
		value_of(actual).should_be(expected);
	},
	'String should correctly htmlDecode &amp;&lt;&gt;&quot;': function() {
		var actual = '&amp;&lt;&gt;&quot;'.htmlDecode();
		var expected = '&<>"';
		value_of(actual).should_be(expected);
	},
	'htmlEncode followed by htmlDecode of complex string should leave string unchanged': function() {
		var s = '&&&""<">>&>&"';
		var actual = s.htmlEncode().htmlDecode();
		value_of(actual).should_be(s);
	}
	// NO IT SHOULDN'T! YOU CAN'T DECODE SOMETHING THAT IS NOT ENCODED
	//'htmlDecode followed by htmlEncode of complex string should leave string unchanged': function() {
	//	var s = '&&&""<">>&>&"';
	//	var actual = s.htmlDecode().htmlEncode();
	//	value_of(actual).should_be(s);
	//}
});

describe('Strings: parseParams', {
	'String should correctly parseParams for single name value pair': function() {
		var actual = "aName:aValue".parseParams();
		var expected = [{"aName":["aValue"]},{name:"aName",value:"aValue"}];
		value_of(actual).should_be(expected);
	},
	'String should correctly parseParams for two name value pairs': function() {
		var actual = "aName:'aValue' aName2:'aValue2'".parseParams();
		var expected = [{"aName":["aValue"], "aName2":["aValue2"]},{name:"aName",value:"aValue"},{name:"aName2",value:"aValue2"}];
		value_of(actual).should_be(expected);
	}
});

describe('Strings: encodeTiddlyLink', {
	'String should correctly encodeTiddlyLink with no spaces': function() {
		var actual = String.encodeTiddlyLink("title");
		var expected = "title";
		value_of(actual).should_be(expected);
	},
	'String should correctly encodeTiddlyLink with spaces': function() {
		var actual = String.encodeTiddlyLink("the title");
		var expected = "[[the title]]";
		value_of(actual).should_be(expected);
	}
});
// ]]>
