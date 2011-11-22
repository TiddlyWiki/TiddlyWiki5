jQuery(document).ready(function(){

	module("TiddlyWiki core");

	test("RGB tests", function() {
		expect(4);

		var actual = new RGB(1,0,1).toString();
		var expected = "#ff00ff";
		ok(actual==expected,'RGB(1,0,1) is the same as #ff00ff');

		actual = new RGB("#f00").toString();
		expected = "#ff0000";
		ok(actual==expected,'#ff0000 is the same as #f00');

		actual = new RGB("#123").toString();
		console.log("actual",actual);
		expected = "#112233";
		ok(actual==expected,'#112233 is the same as #123');

		actual = new RGB("#abc").toString();
		console.log("actual",actual);
		expected = "#aabbcc";
		ok(actual==expected,'#aabbcc is the same as #abc');

		actual = new RGB("#123456").toString();
		expected = "#123456";
		ok(actual==expected,'#123456 is the same as #123456');

		actual = new RGB("rgb(0,255,0)").toString();
		expected = "#00ff00";
		ok(actual==expected,'RGB object created from rgb value > toString method gives hex');

		actual = new RGB("rgb(120,0,0)").mix(new RGB("#00ff00"),0.5).toString();

		//120 + (0 - 120) *0.5 and 0 + (255-0) * 0.5
		expected = new RGB("rgb(60,127,0)").toString();
		ok(actual==expected,'RGB mix function proportion 0.5');

	});


});
