jQuery(document).ready(function(){

	module("Zoomer");

	test("Zoomer functions", function() {

	var zoomer_elem = document.body.appendChild(document.createElement("div"));
	var zoomer_text = "hi!";
	var actual = new Zoomer(zoomer_text,zoomer_elem,zoomer_elem);

	ok(actual,'it should return a Morpher object');

	delete zoomer_elem;
	delete zoomer_text;

	zoomer_elem = document.body.appendChild(document.createElement("div"));
	zoomer_text = "hi!";

	var before = document.body.childNodes.length;
	var z = new Zoomer(zoomer_text,zoomer_elem,zoomer_elem);
	var after = document.body.childNodes.length;
	actual = after - before;
	var expected = 1;
	same(actual,expected,'it should create a div as child of the body');
	actual = document.body.childNodes[document.body.childNodes.length-1].nodeName;
	expected = "DIV";
	same(actual,expected,'it should create a div with the class of "zoomer"');

	delete zoomer_elem;
	delete zoomer_text;
	});
});
