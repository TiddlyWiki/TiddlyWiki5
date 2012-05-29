jQuery(document).ready(function() {

	function makeTestNode() {
		return $("<div />")[0];
	}

	function removeTestNode() {}

	module("Utilities");

	test("Utilities: formatVersion", function() {

	var actual, expected;

		v = {
			major:1,
			minor:2,
			revision:3
		};
		v_beta = {
			major:1,
			minor:2,
			revision:3,
			beta:true
		};
		v_alpha = {
			major:1,
			minor:2,
			revision:3,
			alpha:true
		};

		actual = formatVersion(v);
		expected = v.major+"."+v.minor+"."+v.revision;
		same(actual, expected, "it should use a version object if one is passed as a parameter, which has properties: major, minor, revision, beta (optional) and format the output as 'major.minor.revision'");

		actual = formatVersion();
		expected = version.major+"."+version.minor+"."+version.revision+(version.beta?" (beta "+version.beta+")" : "")+(version.alpha?" (alpha "+version.alpha+")" : "");
		same(actual, expected, 'it doesn\'t need to take an argument, in which case it will use the global "version" variable');

	actual = typeof formatVersion();
	expected = "string";
	same(actual, expected, 'it should return a string');

	actual = formatVersion(v_beta).indexOf("beta "+v_beta.beta) != -1;
	same(actual, true, 'it should append the string " (beta #)", where # is the beta number if the beta number is set');

	actual = formatVersion(v_alpha).indexOf("alpha "+v_alpha.alpha) != -1;
	same(actual, true, 'it should append the string " (alpha #)", where # is the alpha number if the alpha number is set');

  });


	test("Utilities functions: compareVersions", function() {

	var v1, v1_beta, v2, message;
	function setUp(_message) {
	  message = _message;
	  v1 = {
		major:1,
		minor:2,
		revision:3
	  };
	  v1_beta = {
		major:1,
		minor:2,
		revision:3,
		beta:true
	  };
	  v2 = {
		major:v1.major,
		minor:v1.minor,
		revision:v1.revision
	  };
	}

	setUp('it should return +1 if the second version is later than the first');
		v2.major = v1.major+1;
		var actual = compareVersions(v1,v2);
		var expected = 1;
		same(actual,expected,message);
		v2.major--;
		v2.minor = v1.minor+1;
		actual = compareVersions(v1,v2);
		expected = 1;
		same(actual,expected,message);
		v2.minor--;
		v2.revision = v1.revision+1;
		actual = compareVersions(v1,v2);
		expected = 1;
		same(actual,expected,message);

	setUp('it should return 0 if the second version is the same as the first');
		actual = compareVersions(v1,v2);
		expected = 0;
		same(actual,expected,message);

	setUp('it should return -1 if the second version is earlier than the first');
		v2.major = v1.major-1;
		actual = compareVersions(v1,v2);
		expected = -1;
		same(actual,expected,message);
		v2.major++;
		v2.minor = v1.minor-1;
		actual = compareVersions(v1,v2);
		expected = -1;
		same(actual,expected,message);
		v2.minor++;
		v2.revision = v1.revision-1;
		actual = compareVersions(v1,v2);
		expected = -1;
		same(actual,expected,message);

	setUp('it should treat versions without a beta number as later than a version without a beta number');
		actual = compareVersions(v1,v1_beta);
		expected = -1;
		same(actual,expected,message);

	});


	test("createTiddlyText", function() {
		expect(1);

		var parent = makeTestNode();
		createTiddlyText(parent, "<div>");
		createTiddlyText(parent, "a");
		createTiddlyText(parent, "</div>");
		equals(parent.innerHTML, "&lt;div&gt;a&lt;/div&gt;", "createTiddlyText should append text node, not html element");

		removeTestNode();
	});


	test("createTiddlyElement", function() {
		expect(4);

		ok(createTiddlyElement(null,"div"), "Element creation should create the DOM element");

		createTiddlyElement( makeTestNode(),"div");
		ok($('#testElement div'), 'Setting the parent parameter should append the new DOM element to the parent');
		removeTestNode();

		createTiddlyElement(null,"div",'testID');
		ok($('#testID'), 'Setting the element id parameter should set the id on the DOM element');

		createTiddlyElement(null,"div", null, 'testClass');
		ok($('div.testClass'), 'Setting the element class parameter should set the class on the DOM element');

	});


	test("Utilities: createTiddlyButton(parent,text,tooltip,action,className,id,accessKey,attribs)", function() {

	function setUp(_message) {
	  message = _message;
	  parent = document.body;
	  text = "hi!";
	  tooltip = "a tooltip";
	  action = function() { alert('clicked!'); };
	  className = "testButton";
	  id = "testButtonId";
	  accessKey = "b";
	  attribs = {
		style:"display:none;"
	  };
	  btn = createTiddlyButton(parent,text,tooltip,action,className,id,accessKey,attribs);
	}

	setUp('it should create an anchor element as a child of the parent element provided');
	var before = document.body.childNodes.length;
	btn = createTiddlyButton(parent,text,tooltip,action,className,id,accessKey,attribs);
	var after = document.body.childNodes.length;
	var actual = after-before;
	var expected = 1;
	same(actual,expected,message);
	actual = document.body.childNodes[after-1].nodeName;
	expected = "A";
	same(actual,expected,message);

	setUp('it should set the onclick function to the provided action parameter');
		actual = btn.onclick;
		expected = action;
		same(actual,expected,message);

	setUp('it should set the anchor href to null if no action parameter is provided');
		actual = btn.href;
		expected = "javascript:;";
		same(actual,expected,message);

	setUp('it should set the anchor title to the provided tooltip paramater');
		actual = btn.title;
		expected = tooltip;
		same(actual,expected,message);

	setUp('it should set the contained text to the provided text parameter');
		actual = btn.innerText || btn.textContent;
		expected = text;
		same(actual,expected,message);

	setUp('it should set the anchor class to the provdided className parameter');
		actual = btn.className;
		expected = className;

	setUp('it should set the anchor class to "button" if no className parameter is provided');
		var btn2 = createTiddlyButton(parent,text,tooltip,action,null,id,accessKey,attribs);
		actual = btn2.className;
		expected = "button";
		same(actual,expected,message);

	setUp('it should set the anchor id to the provided id parameter');
		actual = btn.id;
		expected = id;
		same(actual,expected,message);

	setUp('it should set any attributes on the anchor that are provided in the attribs object');
		for(i in attribs) {
			same(btn.i, attribs.i, message);
	  }

  // No tests in jsspec
	// 'it should set the anchor accessKey attribute to the provided accessKey parameter': function() {}

	setUp('it should return the anchor element');
		actual = btn.nodeName;
		expected = "A";
		same(actual,expected,message);

	setUp('it should not require any parameters and still return an anchor element');
		actual = createTiddlyButton().nodeName;
		expected = "A";
		same(actual,expected,message);
  });

	test("Utilities: createTiddlyLink trailing whitespace", function() {
		var place = $("<div />")[0]
		var link = createTiddlyLink(place," testTiddler1 ");
		strictEqual($(link).attr("tiddlylink"), "testTiddler1", "attribute has been set without leading or trailing whitespace");
		strictEqual($(link).hasClass("tiddlyLinkExisting"), true,
			"has matched testTiddler1 not a tiddler with leading and trailing whitespace")
	});

	test("Utilities: createTiddlyLink(place,title,includeText,className,isStatic,linkedFromTiddler,noToggle)", function() {

	function setUp(_message) {
	  message = _message;
	  store = new TiddlyWiki();
	  title = "test";
	  t = new Tiddler(title);
	  t_linked_from = new Tiddler("linkedFrom");
	  t_linked_from.fields = {
		"server.host":"host",
		"server.workspace":"workspace",
		"wikiformat":"wikiformat",
		"server.type":"type"
	  };
	  place = document.body;
	  includeText = true;
	  className = "testLink";
	  isStatic = "true";
	  linkedFromTiddler = t_linked_from;
	  noToggle = "true";
	  btn = createTiddlyLink(place,title,includeText,className,false,linkedFromTiddler,noToggle);
	  btn_external = createTiddlyLink(place,title,includeText,className,isStatic,linkedFromTiddler,noToggle);
	}

	  setUp('it should add a link as child of the "place" DOM element (internal)');
		var before = place.childNodes;
		var expected = before.length+1;
		createTiddlyLink(place,title);
		var actual = place.childNodes.length;
		same(actual,expected,message);
		actual = place.childNodes[place.childNodes.length-1].nodeName;
		expected = "A";
		same(actual,expected,message);

	  setUp('it should set the "tiddlyLink" attribute on the link to the provided "title" parameter (internal)');
		actual = btn.getAttribute("tiddlyLink");
		expected = title;
		same(actual,expected,message);

	  setUp('it should set the "tiddlyLink" attribute on the link to the provided "title" parameter (external)');
		actual = btn_external.getAttribute("tiddlyLink");
		expected = title;
		same(actual,expected,message);

	  setUp('it should include the title as the text of this link if the "includeText" parameter is set to true (internal)');
		actual = btn.innerText || btn.textContent;
		expected = title;
		same(actual,expected,message);

	  setUp('it should include the title as the text of this link if the "includeText" parameter is set to true (external)');
		actual = btn_external.innerText || btn.textContent;
		expected = title;
		same(actual,expected,message);

	  setUp('it should not include any text in the link if the "includeText" parameter is not set or false');
		btn = createTiddlyLink(place,title);
		actual = btn.innerText || btn.textContent;
		expected = "";
		same(actual,expected,message);

	  setUp('it should add the provided "className" parameter to the class of the link (internal)');
		actual = btn.className.indexOf(className) != -1;
		same(actual,true,message);

	/* BUG IN DOCS: THIS IS ONLY TRUE IF THE LINK IS INTERNAL */
	/* see http://groups.google.com/group/TiddlyWikiDev/browse_thread/thread/3e8c2de8d7b0fbfa */
	  setUp('it should add the provided "className" parameter to the class of the link (external)');
		actual = btn_external.className.indexOf(className) != -1;
		same(actual,true,message);

	  setUp('it should set the "tiddlyFields" attribute on the link to be the fields from any tiddler referred to in the provided "linkedFromTiddler" parameter (internal)');
		actual = btn.getAttribute("tiddlyFields");
		expected = linkedFromTiddler.getInheritedFields();
		same(actual,expected,message);

	  setUp('it should set the "tiddlyFields" attribute on the link to be the fields from any tiddler referred to in the provided "linkedFromTiddler" parameter (external)');
		actual = btn_external.getAttribute("tiddlyFields");
		expected = linkedFromTiddler.getInheritedFields();
		same(actual,expected,message);

	  setUp('it should set the "noToggle" attribute on the link to "true" if the provided "noToggle" parameter is set (internal)');
		actual = btn.getAttribute("noToggle");
		expected = "true";
		same(actual,expected,message);

	  setUp('it should set the "noToggle" attribute on the link to "true" if the provided "noToggle" parameter is set (external)');
		actual = btn_external.getAttribute("noToggle");
		expected = "true";
		same(actual,expected,message);

	  setUp('it should set the "refresh" attribute on the link to "link" (internal)');
		actual = btn.getAttribute("refresh");
		expected = "link";
		same(actual,expected,message);

	  setUp('it should set the "refresh" attribute on the link to "link" (external)');
		actual = btn_external.getAttribute("refresh");
		expected = "link";
		same(actual,expected,message);

	// BROKEN
	  // setUp('it should create a permalink if the "isStatic" parameter is set (internal)');
		// actual = btn.href.indexOf("#") != -1;
		// same(actual,true,message);

	  setUp('it should create a permalink if the "isStatic" parameter is set (external)');
		actual = btn_external.href.indexOf("#") != -1;
		same(actual,true,message);

	  setUp('it should return a reference to the link (internal)');
		actual = btn.nodeName;
		expected = "A";
		same(actual,expected,message);

	  setUp('it should return a reference to the link (external)');
		actual = btn_external.nodeName;
		expected = "A";
		same(actual,expected,message);

  });


  test('Utilities: refreshTiddlyLink(e,title)', function() {

	function setUp(_message) {
	  message = _message;
	  store = new TiddlyWiki();
	  loadShadowTiddlers();
	  not_a_tiddler = null;
	  store.saveTiddler("a_tiddler","a_tiddler");
	  store.saveTiddler("another_tiddler","another_tiddler");
	  place = document.body;
	  btn = createTiddlyLink(place,"a_tiddler");
	}

	  setUp('it should update the className attribute of the "e" element if "title" is the name of a non-existant tiddler');
		refreshTiddlyLink(btn,not_a_tiddler);
		expected = ["tiddlyLink","tiddlyLinkNonExisting"];
		actual = btn.className.readBracketedList();
		for(var i=0;i<expected.length;i++) {
			same(actual.contains(expected[i]), true, message);
		}
		same(actual.length, expected.length, message);

	  setUp('it should update the className attribute of the "e" element if "title" is the name of a tiddler');
		refreshTiddlyLink(btn,"another_tiddler");
		expected = ["tiddlyLink","tiddlyLinkExisting"];
		actual = btn.className.readBracketedList();
		for(i=0;i<expected.length;i++) {
			same(actual.contains(expected[i]), true, message);
		}
		same(actual.length, expected.length, message);

	  setUp('it should update the className attribute of the "e" element if "title" is the name of a shadow tiddler');
		same(store.isShadowTiddler("SiteTitle"), true, message);
		refreshTiddlyLink(btn,"SiteTitle");
		expected = ["tiddlyLink", "tiddlyLinkNonExisting", "shadow"];
		actual = btn.className.readBracketedList();
		for(i=0;i<expected.length;i++) {
			same(actual.contains(expected[i]), true, message);
		}
		same(actual.length, expected.length);

	  setUp('it should update the title attribute of the "e" element if "title" is the name of a non-existant tiddler');
		refreshTiddlyLink(btn,"not_a_tiddler");
		expected = config.messages.undefinedTiddlerToolTip.format(["not_a_tiddler"]);
		actual = btn.title;
		same(actual,expected,message);

	// BROKEN
	  // setUp('it should update the title attribute of the "e" element if "title" is the name of a tiddler');
		// expected = store.getTiddler("another_tiddler").getSubtitle();
		// actual = btn.title;
		// same(actual,expected,message);

	  setUp('it should update the title attribute of the "e" element if "title" is the name of a shadow tiddler with an annotation');
		var title = "SiteTitle";
		same(store.isShadowTiddler(title), true, message);
		refreshTiddlyLink(btn,title);
		expected = config.annotations[title];
		actual = btn.title;
		same(actual,expected,message);

	  setUp('it should update the title attribute of the "e" element if "title" is the name of a shadow tiddler without an annotation');
		merge(config.shadowTiddlers,{
			testShadow: "some test text"
		});
		title = "testShadow";
		same(store.isShadowTiddler(title), true, message);
		refreshTiddlyLink(btn,title);
		var expected = config.messages.shadowedTiddlerToolTip.format([title]);
		var actual = btn.title;
		same(actual,expected,message);
		delete config.shadowTiddlers.testShadow;

  });


  test('Utilities: getTiddlyLinkInfo(title,currClasses)', function() {

	function setUp(_message) {
	  message = _message;
	  store = new TiddlyWiki();
	  loadShadowTiddlers();
	  title = "test";
	  store.createTiddler(title);
	  currClasses = "test test2";
	  obj = getTiddlyLinkInfo(title,currClasses);
	}

	setUp('it should return an object with two named properties - the first a string named "classes" and the second a string named "subTitle"');
	var expected = "string";
	var actual = typeof obj["classes"];
	same(actual,expected,message);

	setUp('it should add "shadow" to the classes string if the tiddler is a shadow tiddler');
	title = "SiteTitle";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ").contains("shadow");
	same(actual, true, message);

	setUp('it should add "tiddlyLinkExisting" to the classes string if the tiddler is in the store');
	actual = obj.classes.split(" ").contains("tiddlyLinkExisting");
	same(actual, true, message);

	setUp('it should add "tiddlyLinkNonExisting" to the classes string if the tiddler is not in the store');
	title = "not_in_the_store";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ").contains("tiddlyLinkNonExisting");
	same(actual, true, message);

	setUp('it should add "tiddlyLink" to the classes string whether the tiddler is a shadow, in the store or not');
	actual = obj.classes.split(" ").contains("tiddlyLink");
	same(actual, true, message);
	title = "not_in_the_store";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ").contains("tiddlyLink");
	same(actual, true, message);
	title = "SiteTitle";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ").contains("tiddlyLink");
	same(actual, true, message);

	setUp('it should maintain any classes passed in, through the currClasses string, in the classes string');
	actual = currClasses.split(" ");
	expected = obj.classes.split(" ");
	for(var i=0;i<actual.length;i++) {
	  same(expected.contains(actual[i]) != -1, true, message);
	}
	title = "not_in_the_store";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ");
	for(i=0;i<actual.length;i++) {
	  same(expected.contains(actual[i]) != -1, true, message);
	}
	title = "SiteTitle";
	obj = getTiddlyLinkInfo(title,null);
	actual = obj.classes.split(" ");
	for(i=0;i<actual.length;i++) {
	  same(expected.contains(actual[i]) != -1, true, message);
	}

	setUp('it should get subTitle from config.annotations if there is an entry there for the title parameter');
	title = "SiteTitle";
	obj = getTiddlyLinkInfo(title,null);
	expected = config.annotations["SiteTitle"];
	actual = obj.subTitle;
	same(actual,expected,message);

	setUp('it should get subTitle by calling tiddler.getSubtitle() if there is no entry in config.annotations');
	// tests_mock.before(funcToMock);
		var getSubtitleMock = new jqMock.Mock(Tiddler.prototype, "getSubtitle");
	getSubtitleMock.modify().args().multiplicity(1);
	obj = getTiddlyLinkInfo(title,currClasses);
	getSubtitleMock.verifyAll();
	getSubtitleMock.restore();
	// same(actual, true, message);

  });


  test('Utilities: createExternalLink(place,url)', function() {

	function setUp(_message) {
	  message = _message;
	  place = document.body;
	  url = "http://www.tiddlywiki.com";
	  link = createExternalLink(place,url);
	}

	setUp('it should return an anchor element');
	var expected = "A";
	var actual = link.nodeName;
	same(actual,expected,message);

	setUp('it should set the anchor href to the "url" argument with a "/" on the end if one is missing');
	expected = url + "/";
	actual = link.href;
	same(actual,expected,message);

	setUp('it should set the anchor className to "externalLink"');
	expected = "externalLink";
	actual = link.className;
	same(actual,expected,message);

	setUp('it should append the anchor as a child element of the "place" argument');
	actual = place.childNodes.length;
	link = createExternalLink(place,url);
	actual = place.childNodes.length - actual;
	expected = 1;
	same(actual,expected,message);

	setUp('it should set the anchor title to config.messages.externalLinkTooltip.format([url]');
	expected = config.messages.externalLinkTooltip.format([url]);
	actual = link.title;
	same(actual,expected,message);

	setUp('it should set the anchor target to "_blank" if config.options.chkOpenInNewWindow is true');
	expected = "_blank";
	var oldOption = config.options.chkOpenInNewWindow;
	config.options.chkOpenInNewWindow = true;
	link = createExternalLink(place,url);
	actual = link.target;
	config.options.chkOpenInNewWindow = oldOption; // restore public variable
	same(actual,expected,message);

  });

});

