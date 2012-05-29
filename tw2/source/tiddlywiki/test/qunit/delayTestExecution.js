jQuery(document).ready(function() {
	test("Wait until TiddlyWiki starts", function() {
		stop();
	});
});

jQuery().bind("startup", function() {
	start();
});
