(function($) {

var makeTestNode = function() {
	var ele = $('<div id="testElement" class="testClass"></div>');
	ele.appendTo('body');
	return ele.get(0);
};

var removeTestNode = function() {
	$('#testElement').remove();
};

$(document).ready(function(){

	module("DOM.js");

	test("resolveTarget", function() {
		expect(1);
		var ele = makeTestNode();

		var target;
		$(ele).click(function(ev){
			target = $(ev.target)[0];
		});
		$(ele).click();
		equals(target, ele, "resolveTarget correctly identifies the target of a click event");

		removeTestNode();
	});


	test('getPlainText', function(){
		expect(1);

		$('body').append("<div id='text_test'>foo bar baz</div>");
		var d = $('#text_test').get(0);
		equals(getPlainText(d), "foo bar baz", "getPlainText() returns the plain text of an element.");
		$("#text_test").remove();
	});


	test("findWindowHeight", function() {
			expect(2);
			equals(typeof findWindowHeight(), "number", "returns a number value");
			equals($(window).height(), findWindowHeight(), "return the current height of the display window");
	});

	test("findWindowWidth", function() {
			expect(1);
			equals(typeof findWindowWidth(), "number", "returns a number value");
			// XXX: following test does not work
			// equals($(window).width(), findWindowWidth(), "return the current width of the display window");
	});


	test("findScrollX", function() {

		var scroll = 10;

		$('<div id="wiiide">wide</div>').css({width: '9999px'}).appendTo('body');
		$().scrollLeft(scroll);

		equals(typeof findScrollX(), "number", "returns a number value");
		//equals(findScrollX(), scroll, "returns the correct horizontal scroll position of the window");

		$('#wiiide').remove();
	});

	test("findScrollY", function() {
		expect(1);
		var scroll = 200;
		$().scrollTop(scroll);

		equals(typeof findScrollY(), "number", "returns a number value");
		// XXX: following test does not work
		// equals(findScrollY(), scroll, "returns the correct vertical scroll position of the window");

	});
}); // document ready.

})(jQuery);
