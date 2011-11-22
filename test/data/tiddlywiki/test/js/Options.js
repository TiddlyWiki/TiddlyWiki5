jQuery(document).ready(function(){
	var numSaves, _autoSaveChanges;
	module("TiddlyWiki options", {
		setup: function() {
			config.options.chkAutoSave = true;
			systemSettingSave = 0;
			_autoSaveChanges = autoSaveChanges;
			numSaves = 0;
			autoSaveChanges = function() {
				numSaves += 1;
				return _autoSaveChanges.apply(this, arguments);
			}
		},
		teardown: function() {
			numSaves = null;
			config.options.chkAutoSave = false;
			autoSaveChanges = _autoSaveChanges;
		}
	});

	test("save multiple system settings", function() {
		saveSystemSetting("foo", true);
		saveSystemSetting("foo", false);
		saveSystemSetting("foo", true);
		strictEqual(numSaves, 0, "The save is asynchronous so no saves have yet been made");
		strictEqual(systemSettingSave > 0, true, "However there should be a timeout in progress");
	});
	
});