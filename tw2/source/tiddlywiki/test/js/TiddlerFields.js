jQuery(document).ready(function(){

	module("TiddlerFields");

	test("getValue", function() {
		var val = store.getValue("testTiddler2","fieldvalue");
		var val2 = store.getValue("testTiddler2","modified");
		var val3 = store.getValue("testTiddler2","tags");
		var val4 = store.getValue("testTiddler2","::slice");
		var val5 = store.getValue("testTiddler2","##section");
		var val6 = store.getValue("testTiddler2","##section2");
		var val7 = store.getValue("testTiddler2","##Section3");
		var val8 = store.getValue("testTiddler2","FieldValue");
		strictEqual(val, "two");
		strictEqual(val2, "199512010340");
		strictEqual(val3, "testTag twoTag");
		strictEqual(val4, "4t");
		strictEqual(val5, "bar\n");
		strictEqual(val6, "test\n");
		strictEqual(val7, "welcome\n");
		strictEqual(val8, "two");
	});
});
