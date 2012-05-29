jQuery(document).ready(function(){

	module("Wizard.js");

	test("Wizard: construction", function() {
		expect(1);

		var w = new Wizard();
		var actual = w.formElem===null && w.bodyElem===null && w.footElem===null;
		ok(actual==true,'properties should be null when constructed with no parameters');

	});

	test("Wizard: setValue / getValue (no formEl)", function() {
		var w = new Wizard();
		var val1 = w.getValue("test");
		w.setValue("test", "foo");
		var val2 = w.getValue("test");
		strictEqual(val1, null, "no value set");
		strictEqual(val2, null, "value could not be set as no formEl");
	});

	test("Wizard: setValue / getValue (formEl)", function() {
		var w = new Wizard();
		w.createWizard($("<div />")[0], "My Title");
		var val1 = w.getValue("test1");
		var elem = $("<div />").addClass("foo")[0];
		w.setValue("test1", "foo");
		w.setValue("test2", ["a list", "of items"]);
		w.setValue("test3", { name: "data", val: "foo" });
		w.setValue("test4", elem);
		var val2 = w.getValue("test1");
		var val3 = w.getValue("test2");
		var val4 = w.getValue("test3");
		var val5 = w.getValue("test4");

		strictEqual(val1, undefined, "no value set but returns undefined if formEl exists");
		strictEqual(val2, "foo", "value should be set in this situation");
		strictEqual(val3.length, 2, "array set successfully (1/2)");
		strictEqual(val3[0], "a list", "array set successfully (2/2)");
		strictEqual(val4.name, "data", "object set successfully");
		strictEqual($(val5).hasClass("foo"), true, "element set successfully");
	});

	test("Wizard: createWizard", function() {
		var elem = $(place)[0];
		var wizard = new Wizard();
		wizard.createWizard(place, 'Import a TiddlyWiki');
		strictEqual(wizard.formElem.nodeName, "FORM", "a form element set.");
	});
	
	test("Wizard: setValue of existing property name on node", function() {
		var w = new Wizard();
		w.createWizard($("<div />")[0], "My Title");
		w.setValue("nodeName", "foo");
		var mode = w.getValue("nodeName");
		strictEqual(mode, "foo", "reserved names should be possible to set.")
	});
});
