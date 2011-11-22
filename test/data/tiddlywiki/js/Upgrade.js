//--
//-- Upgrade macro
//--

config.macros.upgrade.handler = function(place)
{
	var w = new Wizard();
	w.createWizard(place,this.wizardTitle);
	w.addStep(this.step1Title,this.step1Html.format([this.source,this.source]));
	w.setButtons([{caption: this.upgradeLabel, tooltip: this.upgradePrompt, onClick: this.onClickUpgrade}]);
};

config.macros.upgrade.onClickUpgrade = function(e)
{
	var me = config.macros.upgrade;
	var w = new Wizard(this);
	if(window.location.protocol != "file:") {
		alert(me.errorCantUpgrade);
		return false;
	}
	if(story.areAnyDirty() || store.isDirty()) {
		alert(me.errorNotSaved);
		return false;
	}
	var localPath = getLocalPath(document.location.toString());
	var backupPath = getBackupPath(localPath,me.backupExtension);
	w.setValue("backupPath",backupPath);
	w.setButtons([],me.statusPreparingBackup);
	var original = loadOriginal(localPath);
	w.setButtons([],me.statusSavingBackup);
	var backup = copyFile(backupPath,localPath);
	if(!backup)
		backup = saveFile(backupPath,original);
	if(!backup) {
		w.setButtons([],me.errorSavingBackup);
		alert(me.errorSavingBackup);
		return false;
	}
	w.setButtons([],me.statusLoadingCore);
	var options = {
		type:"GET",
		url:me.source,
		processData:false,
		success:function(data,textStatus,jqXHR) {
			me.onLoadCore(true,w,jqXHR.responseText,me.source,jqXHR);
		},
		error:function(jqXHR,textStatus,errorThrown) {
			me.onLoadCore(false,w,null,me.source,jqXHR);
		}
	};
	ajaxReq(options);
	return false;
};

config.macros.upgrade.onLoadCore = function(status,params,responseText,url,xhr)
{
	var me = config.macros.upgrade;
	var w = params;
	var errMsg;
	if(!status)
		errMsg = me.errorLoadingCore;
	var newVer = me.extractVersion(responseText);
	if(!newVer)
		errMsg = me.errorCoreFormat;
	if(errMsg) {
		w.setButtons([],errMsg);
		alert(errMsg);
		return;
	}
	var onStartUpgrade = function(e) {
		w.setButtons([],me.statusSavingCore);
		var localPath = getLocalPath(document.location.toString());
		saveFile(localPath,responseText);
		w.setButtons([],me.statusReloadingCore);
		var backupPath = w.getValue("backupPath");
		var newLoc = document.location.toString() + "?time=" + new Date().convertToYYYYMMDDHHMM() + "#upgrade:[[" + encodeURI(backupPath) + "]]";
		window.setTimeout(function () {window.location = newLoc;},10);
	};
	var step2 = [me.step2Html_downgrade,me.step2Html_restore,me.step2Html_upgrade][compareVersions(version,newVer) + 1];
	w.addStep(me.step2Title,step2.format([formatVersion(newVer),formatVersion(version)]));
	w.setButtons([{caption: me.startLabel, tooltip: me.startPrompt, onClick: onStartUpgrade},{caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel}]);
};

config.macros.upgrade.onCancel = function(e)
{
	var me = config.macros.upgrade;
	var w = new Wizard(this);
	w.addStep(me.step3Title,me.step3Html);
	w.setButtons([]);
	return false;
};

config.macros.upgrade.extractVersion = function(upgradeFile)
{
	var re = /^var version = \{title: "([^"]+)", major: (\d+), minor: (\d+), revision: (\d+)(, beta: (\d+)){0,1}, date: new Date\("([^"]+)"\)/mg;
	var m = re.exec(upgradeFile);
	return m ? {title: m[1], major: m[2], minor: m[3], revision: m[4], beta: m[6], date: new Date(m[7])} : null;
};

function upgradeFrom(path)
{
	var importStore = new TiddlyWiki();
	var tw = loadFile(path);
	if(window.netscape !== undefined)
		tw = convertUTF8ToUnicode(tw);
	importStore.importTiddlyWiki(tw);
	importStore.forEachTiddler(function(title,tiddler) {
		if(!store.getTiddler(title)) {
			store.addTiddler(tiddler);
		}
	});
	refreshDisplay();
	saveChanges(); //# To create appropriate Markup* sections
	alert(config.messages.upgradeDone.format([formatVersion()]));
	window.location = window.location.toString().substr(0,window.location.toString().lastIndexOf("?"));
}

