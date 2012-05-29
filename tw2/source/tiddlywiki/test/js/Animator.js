jQuery(document).ready(function(){

	module("Animator");

	test("Animator : constructor", function() {

	var a = new Animator();

	same(typeof a,'object','the Animator() constructor should return an object');

	same(a.running,0,'the object returned by the Animator() constructor should contain a \'running\' integer with a value of 0 ');

	same(a.timerID,0,'the object returned by the Animator() constructor should contain a \'timerID\' integer with a value of 0 ');

	same(a.animations.length,0,'the object returned by the Animator() constructor should contain an empty \'animations\' array');

	});

	test("Animator : functions", function() {

	var expected = ".2061";
	var actual = Animator.slowInSlowOut(0.3);
	actual = actual.toString().substr(1,5);
	same(actual,expected,'given a float value, Animator.slowInSlowOut() returns the result of the correct mathematical transformation.');

	expected = 0;
	actual = Animator.slowInSlowOut(2);
	same(actual,expected,'given a value above the max of valid input, Animator.slowInSlowOut() clamps its output appropriately.');

	});
});

