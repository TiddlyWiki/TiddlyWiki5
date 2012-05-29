// <![CDATA[

function __main() 
{
	store = new TiddlyWiki();
	loadShadowTiddlers();
	formatter = new Formatter(config.formatters);
        story = new Story("tiddlerDisplay","tiddler");
}

__title = {
	en: {
	    all: "All tiddlers in alphabetical order",
	    missing: "Tiddlers that have links to them but are not defined",
	    orphans: "Tiddlers that are not linked to from any other tiddlers",
	    shadowed: "Tiddlers shadowed with default contents",
	    touched: "Tiddlers that have been modified locally",
	    closeAll: "Close all displayed tiddlers (except any that are being edited)",
	    permaview: "Link to an URL that retrieves all the currently displayed tiddlers",
	    saveChanges: "Save all tiddlers to create a new TiddlyWiki",
	    tagChooser: "Choose existing tags to add to this tiddler",
	    refreshDisplay: "Redraw the entire TiddlyWiki display"
	}
}

function __re_escape(s) 
{
	s = "" + s;
	return s.replace('(','\\(').replace(')','\\)');
}

function testing_check_button(name,text,accesskey) 
{
	var t = wikifyStatic("<<"+name+">>");
	var title = __re_escape(__title.en[name]);
	var r = new RegExp('<a(( accesskey="'+accesskey+'")|( class="button")|( title="' + title + '")|( href="javascript:;")){3,4}>'+text+'<\/a>$');
	value_of(t).should_match(r);
	value_of(t).should_match(/class="/);
	value_of(t).should_match(/title="/);
	value_of(t).should_match(/href="/);
	if (accesskey)
	    value_of(t).should_match(/accesskey="/);
}

function testing_check_button_onclick(name,func) 
{
	tests_mock.before(func);
	config.macros[name].onClick();
	value_of(tests_mock.after(func).called).should_be(1);
}

describe('Macros: macro errors', {
	before_each : function() {
		__main();
	},
	'missing macro should produce errortext' : function() { 	
		value_of(wikifyStatic('<<NOEXISTANTMACRO>>')).should_match(/errortext/);
	}
});

describe('Macros: version macro', {
	before_each : function() {
		__main();
	},
	'version macro should expand to the version string' : function() { 
		version.major = "123";
		version.minor = "456";
		version.revision = "789";
		version.beta = "123456789";
		value_of(wikifyStatic("<<version>>")).should_match(/^<(span|SPAN)>123.456.789 \(beta 123456789\)<\/(span|SPAN)>$/);
	}
});

describe('Macros: today macro', {
	before_each : function() {
		__main();
	},
	'today macro should return a date-shaped string [known to fail]' : function() { 
		value_of(wikifyStatic("<<today>>")).should_match(/^<(span|SPAN)>[A-Z][a-z]+\s[A-Z][a-z]+\s+[0-9]{1,2}\s[0-9]{2}:[0-9]{2}:[0-9]{2} 2[0-9]{3}<\/(span|SPAN)>$/);
	}
});

describe('Macros: list macro', {
	before_each : function() {
		__main();
	},
	'list all by default expands to the listTitle and an empty list' : function() { 
		value_of(wikifyStatic("<<list>>")).should_be('<ul><li class="listTitle">' + __title.en.all + '</li></ul>');
	},
	'list missing by default expands to the listTitle and an empty list' : function() { 
		value_of(wikifyStatic("<<list missing>>")).should_be('<ul><li class="listTitle">' + __title.en.missing + '</li></ul>');
	},
	'list orphans by default expands to the listTitle and an empty list' : function() { 
		value_of(wikifyStatic("<<list orphans>>")).should_be('<ul><li class="listTitle">' + __title.en.orphans + '</li></ul>');
	},
	'list shadowed by default expands to the listTitle and a list of tiddlers' : function() { 
		var pattern = new RegExp('^<ul><li class="listTitle">' + __title.en.shadowed + '</li><li>.*<\/li><\/ul>');
		value_of(wikifyStatic("<<list shadowed>>")).should_match(pattern);
	},
	'list touched by default expands to the listTitle and empty list' : function() { 
		value_of(wikifyStatic("<<list touched>>")).should_be('<ul><li class="listTitle">' + __title.en.touched + '</li></ul>');
	},
	'list filter by default expands to an empty list' : function() { 
		value_of(wikifyStatic("<<list filter>>")).should_be('<ul></ul>');
	}
});

describe('Macros: closeAll macro', {
	before_each : function() {
		__main();
	},
	'closeAll macro expands to button' : function() { 
		testing_check_button("closeAll","close all");
	},
	'closeAll.onClick calls the story.closeAllTiddlers function' : function() { 
		testing_check_button_onclick("closeAll","story.closeAllTiddlers");
	}

});

describe('Macros: permaview macro', {
	before_each : function() {
		__main();
	},
	'permaview macro expands to button' : function() { 
		testing_check_button("permaview","permaview");
	},
	'permaview.onClick calls the story.permaView function' : function() { 
		testing_check_button_onclick("permaview","story.permaView");
	}
});

describe('Macros: saveChanges macro', {
	before_each : function() {
		__main();
	},
	'saveChanges macro doesn\'t expand to button when readOnly' : function() { 
		readOnly = true;
		value_of(wikifyStatic("<<saveChanges>>")).should_be("");
	},
	'saveChanges macro expands to button when not readOnly' : function() { 
		readOnly = false;
		testing_check_button("saveChanges","save changes","S");
	},
	'saveChanges.onClick calls the saveChanges function' : function() { 
		testing_check_button_onclick("saveChanges","saveChanges");
	}
});

describe('Macros: message macro', {
	before_each : function() {
		__main();
		tests_mock.save('config.options.txtUserName');
	},
	after_each : function() {
		tests_mock.restore();
	},
	'message with no parameters returns an empty string' : function() { 
		value_of(wikifyStatic("<<message>>")).should_be('');
	},
	'message with returns an empty string' : function() { 
		var username = "MyAssertedUserName";
		config.options.txtUserName = username;
		value_of(wikifyStatic("<<message config.options.txtUserName>>")).should_be(username);
	},
});

describe('Macros: tagChooser macro', {
	before_each : function() {
		__main();
		tests_mock.save('config.options.txtUserName');
	},
	after_each : function() {
		tests_mock.restore();
	},
	'tagChooser with no parameters returns an empty string' : function() { 
		var t = wikifyStatic("<<tagChooser>>");
		var title = __title.en.tagChooser;
		var text = "tags";
		var r = new RegExp('<a(( tiddler="temp")|( class="button")|( title="' + title + '")|( href="javascript:;")){4,4}>'+text+'<\/a>$');
		value_of(t).should_match(r);
		value_of(t).should_match(/tiddler="/);
		value_of(t).should_match(/class="/);
		value_of(t).should_match(/title="/);
		value_of(t).should_match(/href="/);
	}
});

describe('Macros: refreshDisplay macro', {
	before_each : function() {
		__main();
	},
	'refreshDisplay macro expands to button' : function() { 
		testing_check_button("refreshDisplay","refresh");
	},
	'refreshDisplay.onClick calls the refreshAll function' : function() { 
		testing_check_button_onclick("refreshDisplay","refreshAll");
	}
});

describe('Macros: annotations macro', {
	before_each : function() {
		store = new TiddlyWiki();
		loadShadowTiddlers();
		store.saveTiddler("t","t","text");
		formatter = new Formatter(config.formatters);
	},
	'annotations macro for a non-tiddler expands the empty string' : function() { 
		value_of(wikifyStatic("<<annotations>>")).should_be('');
	},
	'annotations macro expands to empty string for tiddler not in config.annotations' : function() { 
		value_of(wikifyStatic("<<annotations>>",null,new Tiddler("temp"))).should_be('');
	},
	'annotations macro expands to config.annotations defined text' : function() { 
		var title = "This is the title text";
		config.annotations.temp = title;
		value_of(wikifyStatic("<<annotations>>",null,new Tiddler("temp"))).should_be('<div class="annotation">'+title+'</div>');
	}
});

// ]]>
