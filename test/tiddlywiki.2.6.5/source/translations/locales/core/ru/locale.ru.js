/***
|''Name:''|RussianTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Russian|
|''Author:''|VitalyPetrov (v31337 (at) gmail (dot) com)|
|''Author:''|Demid Lupin (v31337 (at) gmail (dot) com)|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/ru/locale.ru.js |
|''Version:''|0.0.3|
|''Date:''|Nov 12, 2009|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.5.2|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "ru"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "ÈìÿÏîëüçîâàòåëÿ"});

merge(config.tasks,{
	save: {text: "ñîõðàíèòü", tooltip: "Ñîõðàíèòü èçìåíåíèÿ â òåêóùåé TiddlyWiki", action: saveChanges},
	sync: {text: "ñèíõðîíèçèðîâàòü", tooltip: "Ñèíõðîíèçèðîâàòü âñå èçìåíåíèÿ ñ äðóãèìè ôàéëàìè è ñåðâåðàìè TiddlyWiki", content: '<<sync>>'},
	importTask: {text: "èìïîðò", tooltip: "Èìïîðò çàïèñåé è äîïîëíåíèé èç äðóãèõ ôàéëîâ è ñåðâåðîâ TiddlyWiki", content: '<<importTiddlers>>'},
	tweak: {text: "íàñòðîêè", tooltip: "Íàñòðîèòü âíåøíèé âèä è ïîâåäåíèå TiddlyWiki", content: '<<options>>'},
	upgrade: {text: "îáíîâèòü", tooltip: "Îáíîâèòü îñíîâíîé êîä TiddlyWiki", content: '<<upgrade>>'},
	plugins: {text: "äîïîëíåíèÿ", tooltip: "Óïðàâëåíèå óñòàíîâëåííûìè äîïîëíåíèÿìè", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Èìÿ ïîëüçîâàòåëÿ äëÿ ïîäïèñè âàøèõ çàïèñåé",
	chkRegExpSearch: "Ðàçðåøèòü èñïîëüçîâàíèå ðåãóëÿðíûõ âûðàæåíèé â ïîèñêå",
	chkCaseSensitiveSearch: "Ïîèñê ñ ó÷¸òîì ðåãèñòðà",
	chkIncrementalSearch: "Ïîèñê ïî ìåðå íàáîðà òåêñòà",
	chkAnimate: "Ðàçðåøèòü àíèìàöèþ",
	chkSaveBackups: "Ñîõðàíÿòü ðåçåðâíóþ êîïèþ ôàéëà ïðè ñîõðàíåíèè èçìåíåíèé",
	chkAutoSave: "Àâòî-ñîõðàíåíèå èçìåíåíèé",
	chkGenerateAnRssFeed: "Ãåíåðèðîâàòü äàííûå RSS-êàíàëà ïðè ñîõðàíåíèè èçìåíåíèé",
	chkSaveEmptyTemplate: "Ãåíåíðèðîâàòü ïóñòîé øàáëîí ïðè ñîõðàíåíèè èçìåíåíèé",
	chkOpenInNewWindow: "Îòêðûâàòü âíåøíèå ññûëêè â íîâîì îêíå",
	chkToggleLinks: "Íàæèìàÿ íà ññûëêó äëÿ îòêðûòèÿ çàïèñè óêàçûâàòü ïðè÷èíû å¸ çàêðûòèÿ (Íå ïîíÿë êàê ïðàâèëüíî ïåðåâåñòè)",
	chkHttpReadOnly: "Çàïðåùàòü ðåäàêòèðîâàíèå ïðè äîñòóïå ÷åðåç HTTP",
	chkForceMinorUpdate: "íå îáíîâëÿòü èìÿ ïîëüçîâàòåëÿ è äàòó ïðè èçìåíåíèè çàïèñè",
	chkConfirmDelete: "Âûäàâàòü çàïðîñ íà ïîäòâåðæäåíèå ïåðåä óäàëåíèåì çàïèñè",
	chkInsertTabs: "Èñïîëüçîâàòü êëàâèøó tab äëÿ âñòàâêè ñèìâîëà òàáóëÿöèè âìåñòî ïåðåõîäà ìåæäó ïîëÿìè",
	txtBackupFolder: "Êàòàëîã äëÿ ñîõðàíåíèÿ ðåçåðâíûõ êîïèé",
	txtMaxEditRows: "Ìàêñèìàëüíîå êîëè÷åñòâî ñòðîê â ïîëÿõ ðåäàêòèðîâàíèÿ",
    txtTheme: "Èìÿ èñïîëüçîâàííîé òåìû",
	txtFileSystemCharSet: "Êîäèðîâêà ïî óìîë÷àíèþ (òîëüêî äëÿ Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Ïîÿâèëèñü ïðîáëåìû ïðè çàãðóçêå ïëàãèíîâ. Ñìîòðèòå ðàçäåë PluginManager äëÿ áîëåå ïîäðîáíûõ ñâåäåíèé",
	pluginError: "Îøèáêà: %0",
	pluginDisabled: "Äîïîëíåíèå íå áóäåò âûïîëíÿòüñÿ ïîòîìó êàê óñòàíîâëåíà ìåòêà 'systemConfigDisable'",
	pluginForced: "Äîïîëíåíèå áóäåò âûïîëíÿòüñÿ ïðèíóäèòåëüíî ïîòîìó êàê óñòàíîâëåíà ìåòêà 'systemConfigForce'",
	pluginVersionError: "Äîïîëíåíèå íå áóäåò âûïîëíÿòüñÿ òàê êàê òðåáóåò äðóãîé âåðñèè TiddlyWiki",
	nothingSelected: "Íè÷åãî íå âûäåëåíî. Ñíà÷àëà âû äîëæíû âûäåëèòü îäíî èëè íåñêîëüêî çíà÷åíèé",
	savedSnapshotError: "Ïîõîæå, ÷òî TiddlyWiki áûë ñîõðàíåí íåêîððåêòíî. Ñìîòðèòå http://www.tiddlywiki.com/#DownloadSoftware äëÿ áîëåå ïîäðîáíûõ ñâåäåíèé",
	subtitleUnknown: "(íåèçâåñòíî)",
	undefinedTiddlerToolTip: "Çàïèñü '%0' íå ñóùåñòâóåò",
	shadowedTiddlerToolTip: "Çàïèñü '%0' íå ñóùåñòâóåò, íî èìååò ïðåäîïðåäåë¸ííîå ñêðûòîå çíà÷åíèå",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Âíåøíÿÿ ññûëêà íà %0",
	noTags: "Íåò çàïèñåé ñ ïîäîáíîé ìåòêîé",
	notFileUrlError: "Âû äîëæíû çàïèñàòü òåêóùóþ TiddlyWiki â ôàéë ïåðåä ñîõðàíåíèåì èçìåíåíèé",
	cantSaveError: "Íåâîçìîæíî ñîõðàíèòü èçìåíåíèÿ. Âîçìîæíûå ïðè÷èíû:\n- Âàø áðàóçåð íå ïîääåðæèâàåò ñîõðàíåíèÿ (Â Firefox, Internet Explorer, Safari è â Opera åñòü ïîääåðæêà ñîõðàíåíèÿ)\n- Ïóòü ê âàøåìó ôàéëó TiddlyWiki ñîäåðæèò íåäîïóñòèìûå ñèìâîëû\n- HTML ôàéë TiddlyWiki áûë ïåðåìåù¸í èëè ïåðåèìåíîâàí",
	invalidFileError: "Ôàéë '%0' íå ÿâëÿåòñÿ ñòàíäàðòíûì TiddlyWiki ôàéëîì",
	backupSaved: "Ðåçåðâíàÿ êîïèÿ ñîõðàíåíà",
	backupFailed: "Îøèáêà ñîõðàíåíèÿ ðåçåðâíîé êîïèè",
	rssSaved: "Ôàéë RSS-êàíàëà ñîõðàí¸í",
	rssFailed: "Îøèáêà ñîõðàíåíèÿ ôàéëà ñ RSS êàíàëîì",
	emptySaved: "Ïóñòîé øàáëîí ñîõðàí¸í",
	emptyFailed: "Îøèáêà ñîõðàíåíèÿ ïóñòîãî øàáëîíà",
	mainSaved: "Îñíîâíîé ôàéë TiddlyWiki ñîõðàí¸í",
	mainFailed: "Îøèáêà ñîõðàíåíèÿ îñíîâíîãî ôàéëà TiddlyWiki. Âàøè èçìåíåíèÿ íå áóäóò ñîõðàíåíû",
	macroError: "Îøèáêà â ìàêðîñå <<\%0>>",
	macroErrorDetails: "îøèáêà èñïîëíåíèÿ ìàêðîñà <<\%0>>:\n%1",
	missingMacro: "Íåò ïîäîáíîãî ìàêðîñà",
	overwriteWarning: "Çàïèñü ñ èìåíåì '%0' óæå ñóùåñòâóåò. Íàæìèòå OK äëÿ å¸ çàìåíû",
	unsavedChangesWarning: "ÂÍÈÌÀÍÈÅ! Ñóùåñòâóþò íåñîõðàí¸ííûå èçìåíåíèÿ â TiddlyWiki\n\nÍàæìèòå OK äëÿ ñîõðàíåíèÿ\nÍàæìèòå CANCEL äëÿ îòìåíû",
	confirmExit: "--------------------------------\n\nÑóùåñòâóþò íåñîõðàí¸ííûå èçìåíåíèÿ â TiddlyWiki. Ïðè ïðîäîëæåíèè áóäóò ïîòåðÿíû âñå íåñîõðàí¸ííûå èçìåíåíèÿ\n\n--------------------------------",
	saveInstructions: "ÑîõðàíèòüÈçìåíåíèÿ",
	unsupportedTWFormat: "Ôîðìàò '%0' íå ïîääåðæèâàåòñÿ TiddlyWiki",
	tiddlerSaveError: "Îøèáêà ñîõðàíåíèÿ çàïèñè '%0'",
	tiddlerLoadError: "Îøèáêà çàãðóçêè çàïèñè '%0'",
	wrongSaveFormat: "Íå óäà¸òñÿ ñîõðàíèòü â ôîðìàòå '%0'. Èñïîëüçóéòå ñòàíäàðòíûé ôîðìàò äëÿ ñîõðàíåíèÿ.",
	invalidFieldName: "Íåâåðíîå çíà÷åíèå â ïîëå %0",
	fieldCannotBeChanged: "Ïîëå '%0' íå ìîæåò áûòü èçìåíåíî",
	loadingMissingTiddler: "Ïûòàþñü ïîëó÷èòü çàïèñü '%0' ñ ñåðâåðà '%1':\n\n'%2' â ðàáî÷åé îáëàñòè '%3'",
	upgradeDone: "Îáíîâëåíèå äî âåðñèè %0 çàâåðøåíî\n\nÍàæìèòå 'OK' äëÿ çàãðóçêè îáíîâë¸ííîé âåðñèè TiddlyWiki"});

merge(config.messages.messageClose,{
	text: "çàêðûòü",
	tooltip: "çàêðûòü äàííóþ èíôîðìàöèîííóþ îáëàñòü"});

config.messages.backstage = {
	open: {text: "äîïîëíèòåëüíî", tooltip: "Îòêðûòü äîïîëíèòåëüíóþ îáëàñòü ðåäàêòèðîâàíèÿ"},
	close: {text: "ñêðûòü", tooltip: "Çàêðûòü äîïîëíèòåëüíóþ îáëàñòü"},
	prompt: "äîïîëíèòåëüíî: ",
	decal: {
		edit: {text: "ðåäàêòèðîâàòü", tooltip: "Ðåäàêòèðîâàòü çàïèñü '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Íàæìèòå äëÿ ïðîñòîòðà çàïèñè öåëèêîì",
	previewUnavailable: "(ïðåäïðîñìîòð íå ïîääåðæèâàåòñÿ)"
};

config.messages.dates.months = ["ßíâàðü", "Ôåâðàëü", "Ìàðò", "Àïðåëü", "Ìàÿ", "Èþíü", "Èþëü", "Àâãóñò", "Ñåíòÿáðü", "Îêòÿáðü", "Íîÿáðü","Äåêàáðü"];
config.messages.dates.days = ["Âîñêðåñåíüå", "Ïîíåäåëüíèê", "Âòîðíèê", "Ñðåäà", "×åòâåðã", "Ïÿòíèöà", "Ñóááîòà"];
config.messages.dates.shortMonths = ["ßíâ", "Ôåâ", "Ìàð", "Àïð", "Ìàé", "Èþí", "Èþë", "Àâã", "Ñåí", "Îêò", "Íîÿ", "Äåê"];
config.messages.dates.shortDays = ["Âñê", "Ïîí", "Âòð", "Ñðä", "×òâ", "Ïòí", "Ñáò"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["îå","îå","üå","îå","îå","îå","îå","îå","îå","îå",
		"îå","îå","îå","îå","îå","îå","îå","îå","îå","îå",
		"îå","îå","üå","îå","îå","îå","îå","îå","îå","îå",
		"st"];
config.messages.dates.am = "óò";
config.messages.dates.pm = "â÷";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "íåò ìåòîê",
	labelTags: "ìåòêè: ",
	openTag: "Îòêðûòü ìåòêó '%0'",
	tooltip: "Ïîêàçàòü çàïèñè ïîìå÷åííûå êàê '%0'",
	openAllText: "Îòêðûòü âñ¸",
	openAllTooltip: "Îòêðûòü âñå ýòè çàïèñè",
	popupNone: "Íåò çàïèñåé ñ ìåòêîé '%0'"});

merge(config.views.wikified,{
	defaultText: "Çàïèñü '%0' íå ñóùåñòâóåò. Ù¸ëêíèòå äâà ðàçà äëÿ å¸ ñîçäàíèÿ",
	defaultModifier: "(ïîòåðÿíî)",
	shadowModifier: "(ñîçäàíèå ñêðûòîé çàïèñè)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "ñîçäàíî"});

merge(config.views.editor,{
	tagPrompt: "Ââåäèòå ìåòêè, ðàçäåëÿÿ èõ ïðîáåëàìè, [[èñïîëüçóÿ òàêèå êàâû÷êè]] ïðè íåîáõîäèìîñòè, èëè äîáàâüòå ñóùåñòâóþùèå",
	defaultText: "Ââåäèòå òåêñò äëÿ '%0'"});

merge(config.views.editor.tagChooser,{
	text: "ìåòêè",
	tooltip: "Âûáðàòü ñóùåñòâóþùèå ìåòêè, äëÿ äîáàâëåíèÿ ê òåêóùåé çàïèñè",
	popupNone: "Íåò îïðåäåë¸ííûõ ìåòîê",
	tagTooltip: "Äîáàâèòü ìåòêó '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "ïîèñê",
	prompt: "Ïîèñê â òåêóùåé TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 çàïèñè ñîîòâåòñâóþò %1",
	failureMsg: "Íåò çàïèñåé ñîîòâåòñâóþùèõ %0"});

merge(config.macros.tagging,{
	label: "ïîìå÷åíî: ",
	labelNotTag: "íåò ìåòîê",
	tooltip: "Ñïèñîê çàïèñåé ñ ìåòêîé '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Ïîêàçàòü çàïèñè ñ ìåòêîé '%0'",
	noTags: "Íåò ïîìå÷åííûõ çàïèñåé"});

config.macros.list.all.prompt = "Âñå çàïèñè â àëôàâèòíîì ïîðÿäêå";
config.macros.list.missing.prompt = "Çàïèñè íà êîòîðûå ññûëàþòñÿ äðóãèå çàïèñè, íî îíè íå áûëè îïðåäåëåíû";
config.macros.list.orphans.prompt = "Çàïèñè íà êîòîðûå íå ññûëàþòñÿ äðóãèå çàïèñè";
config.macros.list.shadowed.prompt = "Ñêðûòûå çàïèñè ñ ñîäåðæèìûì ïî óìîë÷àíèþ";
config.macros.list.touched.prompt = "Çàïèñè, èçìåí¸ííûå ëîêàëüíî";

merge(config.macros.closeAll,{
	label: "çàêðûòü âñ¸",
	prompt: "Çàêðûòü âñå îòîáðàæàþùèåñÿ çàïèñè (èñêëþ÷àÿ ðåäàêòèðóåìûå â äàííûé ìîìåíò)"});

merge(config.macros.permaview,{
	label: "ïðÿìàÿ ññûëêà",
	prompt: "URL-ññûëêà. îòîáðàæàþùàÿ âñå îòêðûòûå â äàííûé ìîìåíò çàïèñè"});

merge(config.macros.saveChanges,{
	label: "ñîõðàíèòü èçìåíåíèÿ",
	prompt: "Ñîõðàíèòü âñå çàïèñè äëÿ ñîçäàíèÿ íîâîé TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "íîâàÿ çàïèñü",
	prompt: "Ñîçäàòü íîâóþ çàïèñü",
	title: "Íîâàÿ çàïèñü",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "íîâàÿ çàïèñü â æóðíàëå",
	prompt: "Ñîçäàòü íîâóþ çàïèñü ñ èñïîëüçîâàíèåì òåêóùèõ äàòû è âðåìåíè",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Íàñòðîèòü ðàñøèðåííûå îïöèè",
	step1Title: "Äàííûå îïöèè áóäóò ñîõðàíåíû â cookies âàøåãî áðàóçåðà",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Ïîêàçàòü íåèçâåñòíûå îïöèè</input>",
	unknownDescription: "//(íåèçâåñòíî)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Îïöèÿ", type: 'String'},
			{name: 'Description', field: 'description', title: "Îïèñàíèå", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Èìÿ", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Óïðàâëåíèå äîïîëíåíèÿìè",
	step1Title: "Çàãðóæåííûå ñåé÷àñ äîïîëíåíèÿ",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(äàííîå äîïîëíåíèå íå ìîæåò áûòü âûïîëíåíûì, òàê êàê áûëî äîáàâëåíî ïîñëå çàïóñêà)",
	noPluginText: "íåò óñòàíîâëåííûõ äîïîëíåíèé",
	confirmDeleteText: "Ïîäòâåðäèòå óäàëåíèå ñëåäóþùèå äîïîëíåíèÿ:\n\n%0",
	removeLabel: "óäàëèòü ìåòêó systemConfig",
	removePrompt: "Óäàëèòü ìåòêó systemConfig",
	deleteLabel: "óäàëèòü",
	deletePrompt: "Óäàëèòü ýòè çàïèñè íàâñåãäà",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Description", type: 'String'},
			{name: 'Version', field: 'Version', title: "Version", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Size", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Forced", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Disabled", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Loaded", type: 'Boolean', trueText: "Yes", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Startup Time", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Error", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "áîëüøå",
	morePrompt: "Ïîêàçàòü áîëüøå êîìàíä",
    lessLabel: "ìåíüøås",
	lessPrompt: "Ñïðÿòàòü äîïîëíèòåëüíûå êîìàíäû",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "îáíîâèòü",
	prompt: "Îáíîâèòü âñþ TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Çàïðåùí èìïîðò â ôàéë TiddlyWiki äîñòóïíûé òîëüêî äëÿ ÷òåíèÿ. Ïîïðîáóéòå îòêðûòü ôàéë ÷åðåç ïðîòîêîë file://",
	wizardTitle: "Èìïîðò çàïèñåé èç äðóãîãî ôàéëà èëè ñåðâåðà",
	step1Title: "Øàã 1: Óêàæèòå ñåðâåð èëè ôàéë TiddlyWiki",
	step1Html: "Óêàæèòå òèï ñåðâåðà: <select name='selTypes'><option value=''>Âûáîð...</option></select><br>Ââåäèòå URL èëè ïóòü çäåñü: <input type='text' size=50 name='txtPath'><br>...èëè âûáåðèòå ôàéë: <input type='file' size=50 name='txtBrowse'><br><hr>...èëè âûáåðèòå ïðåäîïðåäåë¸ííûé êàíàë: <select name='selFeeds'><option value=''>Âûáîð...</option></select>",
	openLabel: "îòêðûòü",
	openPrompt: "Îòêðûòü ñîåäèíåíèå ñ äàííûì ôàéëîì èëè ñåðâåðîì",
	openError: "Ïðîèçîøëè ïðîáëåìû ïðè îòêðûòèè tiddlywiki ôàéëà",
	statusOpenHost: "Îòêðûâàåì õîñò",
	statusGetWorkspaceList: "Ïîëó÷àåì ñïèñîê äîñòóïíûõ ðàáî÷èõ îáëàñòåé",
	step2Title: "Øàã 2: Âûáîð ðàáî÷èõ îáëàñòåé",
	step2Html: "Ââåäèòå èìÿ ðàáî÷åé îáëàñòè: <input type='text' size=50 name='txtWorkspace'><br>...èëè âûáåðèòå ðàáî÷óþ îáëàñòü: <select name='selWorkspace'><option value=''>Âûáîð...</option></select>",
	cancelLabel: "îòìåíà",
	cancelPrompt: "Îòìåíà èìïîðòà",
	statusOpenWorkspace: "Îòêðûâàåì ðàáî÷óþ îáëàñòü",
	statusGetTiddlerList: "Ïîëó÷àåì ñïèñîê äîñòóïíûõ çàïèñåé",
	errorGettingTiddlerList: "Îøèáêà ïðè ïîëó÷åíèè ñïèñêà äîñòóïíûõ çàïèñåé, íàæìèòå Îòìåíà äëÿ ïîâòîðíîé ïîïûòêè",
	step3Title: "Øàã 3: Âûáåðèòå çàïèñè äëÿ èìïîðòà",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Ñîõðàíèòü ñâÿçü äàííûõ çàïèñåé ñ ýòèì ñåðâåðîì, äëÿ ïîñëåäóþùåé ñèíõðîíèçàöèè</input><br><input type='checkbox' name='chkSave'>Ñîõðàíèòü èíôîðìàöèþ îá ýòîì ñåðâåðå â çàïèñè 'systemServer' âûçîâîì:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "èìïîðò",
	importPrompt: "Èìïîðò âûáðàííûõ çàïèñåé",
	confirmOverwriteText: "Ïîääòâåðäèòå ïåðåçàïèñü ñëåäóþùèõ çàïèñåé:\n\n%0",
	step4Title: "Øàã 4: Èìïîðò çàïèñè %0",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "ãîòîâî",
	donePrompt: "Çàêðûòü ìàñòåð",
	statusDoingImport: "Èìïîðò çàïèñåé",
	statusDoneImport: "Âñå çàïèñè èìïîðòèðîâàíû",
	systemServerNamePattern: "%2 íà %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Çàïèñü '%0' óæå ñóùåñòâóåò. Íàæìèòå 'OK' äëÿ ïåðåçàïèñè å¸ âìåñòå ñ èíôîðìàöèé îá ýòîì ñåðâåðå, èëè 'Îòìåíà' äëÿ âûõîäà áåç ñîõðàíåíèÿ èçìåíåíèé",
	serverSaveTemplate: "|''Òèï:''|%0|\n|''URL:''|%1|\n|''Ðàáî÷àé îáëàñòü:''|%2|\n\nÄàííàÿ çàïèñü ñîçäàíà àâòîìàòè÷åñêè, äëÿ ñîõðàíåíèÿ èíôîðìàöèè î ñåðâåðå",
	serverSaveModifier: "(Ñèñòåìà)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Çàïèñü", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Ðàçìåð", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Ìåòêè", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Îáíîâèòü îñíîâíîé êîä TiddlyWiki",
	step1Title: "Îáíîâèòü èëè âîññòàíîâèòü TiddlyWiki äî ïîñëåäíåãî âûïóñêà",
	step1Html: "Âû ñîáèðàåòåñü îáíîâèòü îñíîâíîé êîä TiddlyWiki äî ïîñëåäíåãî âûïóñêà (èç <a href='%0' class='externalLink' target='_blank'>%1</a>). Âàøè äàííûå áóäóò ñîõðàíåíû ïðè îáíîâëåíèè<br><br>Çàìåòèì, ÷òî ïðè îáíîâëåíèè îñíîâíîãî êîäà áóäóò ó÷òåíû óñòàíîâëåííûå ïðåæäå äîïîëíåíèÿ. Åñëè ó Âàñ ïîÿâèëèñü ïðîáëåìû ñ îáíîâë¸ííûì ôàéëîì, ñìîòðèòå <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "Íåâîçìîæíî îáíîâèòü òåêóùóþ TiddlyWiki. Âû ìîæäåòå îáíîâèòü òîëüêî TiddlyWiki ôàéëû êîòîðûõ õðàíÿòñÿ ó âàñ ëîêàëüíî",
	errorNotSaved: "Âû äîëæíû ñîõðàíèòü âñå èçìåíåíèÿ ïåðåä îáíîâëåíèåì",
	step2Title: "Ïîäòâåðæäåíèå ïîäðîáíîñòåé îáíîâëåíèÿ",
	step2Html_downgrade: "Âû æåëàåòå ïîíèçèòü âåðñèþ TiddlyWiki äî %0 ñ %1.<br><br>Ñíèæåíèå âåðñèè îñíîâíîãî êîäà íå ðåêîìåíäóåòñÿ",
	step2Html_restore: "Äàííàÿ TiddlyWiki óæå èñïîëüçóåò ïîñëåäíþþ âåðñèþ îñíîâíîãî êîäà (%0).<br><br>Òåì íå ìåíåå âû ìîæåòå ïðîäîëæèòü îáíîâëåíèå, äëÿ îáåñïå÷åíèÿ òîãî, ÷òîáû îñíîâíîé êîä íå áûë ïîâðåæä¸í",
	step2Html_upgrade: "Âû æåëàåòå îáíîâèòü TiddlyWiki äî âåðñèè %0 ñ %1",
	upgradeLabel: "îáíîâèòü",
	upgradePrompt: "Ïîäãîòîâêà ê ïðîöåññó îáíîâëåíèÿ",
	statusPreparingBackup: "Ïîäãîòîâêà ê ñîçäàíèþ ðåçåðâíîé êîïèè",
	statusSavingBackup: "Ñîõðàíåíèå ôàéëà ðåçåðâíîé êîïèè",
	errorSavingBackup: "Ïîÿâèëèñü ïðîáëåìû ïðè ñîõðàíåíèè ôàéë ñ ðåçåðâíîé êîïèåé",
	statusLoadingCore: "çàãðóçêà îñíîâíîãî êîäà",
	errorLoadingCore: "Îøèáêà çàãðóçêè îñíîâíîãî êîäà",
	errorCoreFormat: "Îøèáêà â îáíîâë¸ííîì îñíîâíîì êîäå",
	statusSavingCore: "Ñîõðàíåíèå îáíîâëåííîãî îñíîâíîãî êîäà",
	statusReloadingCore: "Ïåðåçàãðóçêà îáíîâëåííîãî îñíîâíîãî êîäà",
	startLabel: "ñòàðò",
	startPrompt: "Íà÷àòü ïðîöåññ îáíîâëåíèÿ",
	cancelLabel: "îòìåíà",
	cancelPrompt: "Îòìåíà îáíîâëåíèÿ",
	step3Title: "Îáíîâëåíèå îòìåíåíî",
	step3Html: "Âû îòìåíèëè îáíîâëåíèå ïðîãðàììû"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Çàïèñü", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Òèï ñåðâåðà", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Èìÿ ñåðâåðà", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Ðàáî÷àÿ îáëàñòü ñåðâåðà", type: 'String'},
			{name: 'Status', field: 'status', title: "Ñòàòóñ ñèíõðîíèçàöèè", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "URL ñåðâåðà", text: "Âèä", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Ñèíõðîíèçèðîâàòü âûáðàííûå çàïèñè", name: 'sync'}
			]},
	wizardTitle: "Ñèíõðîíèçàöèÿ ñ âíåøíèìè ñåðâåðàìè è ôàéëàìè",
	step1Title: "Âûáåðèòå çàïèñè, êîòîðûå âû æåëàåòå ñèíõðîíèçèðîâàòü",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "ñèíõðîíèçèðîâàòü",
	syncPrompt: "Ñèíõðîíèçèðîâàòü âûáðàííûå çàïèñè",
	hasChanged: "Èçìåíåíî ëîêàëüíî",
	hasNotChanged: "Áåç èçìåíåíèÿ ëîêàëüíî",
	syncStatusList: {
		none: {text: "...", color: "ïðîçðà÷íîñòü", display:null},
		changedServer: {text: "Èçìåíåíèÿ íà ñåðâåðå", color: '#8080ff', display:null},
		changedLocally: {text: "Èçìåíåíî ëîêàëüíî", color: '#80ff80', display:null},
		changedBoth: {text: "Èçìåíåíî ëîêàëüíî è íà ñåðâåðå", color: '#ff8080', display:null},
		notFound: {text: "Ñåðâåð íå íàéäåí", color: '#ffff80', display:null},
		putToServer: {text: "Îáíîâë¸ííàÿ âåðñèÿ ñîõðàíåíà íà ñåðâåðå", color: '#ff80ff', display:null},
		gotFromServer: {text: "Ïîëó÷åíèå îáíîâëåíèÿ ñ ñåðâåðà", color: '#80ffff', display:null}
		}
	});

merge(config.commands.closeTiddler,{
	text: "çàêðûòü",
	tooltip: "Çàêðûòü äàííóþ çàïèñü"});

merge(config.commands.closeOthers,{
	text: "çàêðûòü îñòàëüíûå",
	tooltip: "Çàêðûòü âñå çàïèñè êðîìå äàííîé"});

merge(config.commands.editTiddler,{
	text: "ðåäàêòèðîâàòü",
	tooltip: "Ðåäàêòèðîâàòü çàïèñü",
	readOnlyText: "âèä",
	readOnlyTooltip: "Ïðîñìîòðåòü èñõîäíèê çàïèñè"});

merge(config.commands.saveTiddler,{
	text: "ãîòîâî",
	tooltip: "Ñîõðàíèòü çàïèñü"});

merge(config.commands.cancelTiddler,{
	text: "îòìåíà",
	tooltip: "îòìåíèòü âñå èçìåíåíèÿ çàïèñè",
	warning: "Âû äåéñòâèòåëüíî õîòèòå îòêàçàòüñÿ îò èçìåíåíèÿ '%0'?",
	readOnlyText: "ãîòîâî",
	readOnlyTooltip: "Ïðîñìîòð çàïèñè â íîðìàëüíîì ðåæèìå"});

merge(config.commands.deleteTiddler,{
	text: "óäàëèòü",
	tooltip: "Óäàëèòü òåêóùóþ çàïèñü",
	warning: "Âû äåéñòâèòåëüíî æåëàåòå óäàëèòü çàïèñü '%0'?"});

merge(config.commands.permalink,{
	text: "ïðÿìàÿ ññûëêà",
	tooltip: "Ïðÿìàÿ ññûëêà íà äàííóþ çàïèñü"});

merge(config.commands.references,{
	text: "ññûëêè",
	tooltip: "Ïîêàçàòü çàïèñè ññûëàþùèåñÿ íà äàííóþ",
	popupNone: "Íåò ññûëîê"});

merge(config.commands.jump,{
	text: "ïåðåõîä",
	tooltip: "Ïåðåéòè ê äðóãîé îòêðûòîé çàïèñè"});

merge(config.commands.syncing,{
	text: "ñèíõðîíèçàöèÿ",
	tooltip: "Êîíòðîëèðîâàòü ñèíõðîíèçàöèþ äàííîé çàïèñè ñ âíåøíèìè ñåðâåðàìè è çàïèñÿìè",
	currentlySyncing: "<div>Â íàñòîÿùåå âðåìÿ ñèíõðîíèçèðîâàíî ñ <span class='popupHighlight'>'%0'</span> to:</"+"div><div>host: <span class='popupHighlight'>%1</span></"+"div><div>ðàáî÷àÿ îáëàñòü: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Íå ñèíõðîíèçèðîâàíî â íàñòîÿùåå âðåìÿ",
	captionUnSync: "Îòñàâíîèòü ñèíõðîíèçàöèþ äàííîé çàïèñè",
	chooseServer: "Ñèíõðîíèçèðîâàòü äàííóþ çàïèñü ñ äðóãèì ñåðâåðîì:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "ïîëÿ",
	tooltip: "Ïîêàçàòü äîïîëíèòåëüíûå ïîëÿ äàííîé çàïèñè",
	emptyText: "íåò ðàñøèðåííûõ ïîëåé äëÿ äàííîé çàïèñè",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Ïîëå", type: 'String'},
			{name: 'Value', field: 'value', title: "Çíà÷åíèå", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[Ñ÷åãîÍà÷àòü]]",
	MainMenu: "[[Ñ÷åãîÍà÷àòü]]\n\n\n^^~TiddlyWiki âåðñèÿ <<version>>\n© 2009 [[UnaMesa|http://www.unamesa.org/]]^^",
	Ñ÷åãîÍà÷àòü: "×òîáû íà÷àòü ðàáîòó ñ ïóñòîé TiddlyWiki, âû äîëæíû èçìåíèòü íåêîòîðûå çàïèñè:\n* SiteTitle & SiteSubtitle: Çàãîëîâîê è ïîäçàãîëîâîê ñàéòà, êàê ïîêàçàíî âûøå (ïîñëå ñîõðàíåíèÿ îíè òàêæå áóäóò ïîêàçàíû â çàãîëîâêå ñàéòà)\n* MainMenu: Ãëàâíîå ìåíþ (Îáû÷íî ðàñïîëîæåíî ñëåâà)\n* DefaultTiddlers: Çàïèñè êîòîðûå âû áû õîòåëè âèäåòü ïðè çàïóñêå TiddlyWiki\nÂû äîëæíû ââåñòè âàøå èìÿ äëÿ îáîçíà÷åíèÿ àâòîðà çàïèñåé: <<option txtUserName>>",
	SiteTitle: "Ìîÿ TiddlyWiki",
	SiteSubtitle: "íåëèíåéíûé ïåðñîíàëüíûé WEB-áëîêíîò",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Äàííûé èíòåðôåéñ ïîñçâîëÿåò èçìåíÿòü íàñòðîéêè TiddlyWiki ñîõðàíÿåìûå â âàøåì áðàóçåðå\n\nÂàøèì èìåíåì áóäóò ïîäïèñàíû âàøè çàïèñè. Çàïèøèòå åãî, êàê â WikiWord (íàïðèìåð JoeBloggs)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Ñîõðàíÿòü ðåçåðâíûå êîïèè\n<<option chkAutoSave>> Àâòî ñîõðàíåíèå\n<<option chkRegExpSearch>> Ïîèñê ñ èñïîëüçîâàíèåì ðåãóëÿðíûõ âûðàæåíèé\n<<option chkCaseSensitiveSearch>> Ïîèñê ñ ó÷¸òîì ðåãèñòðà\n<<option chkAnimate>> Ðàçðåøèòü àíèìàöèþ\n\n----\nÑìîòðèòå òàêæå [[ðàñøèðåííûå îïèöèè|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY" "æóðíàë">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "îïöèè \u00bb" "Èçìåíèòü ðàñøèðåííûå îïöèè TiddlyWiki">>',
	SideBarTabs: '<<tabs txtMainTab "Õðîíîëîãèÿ" "Õðîíîëîãèÿ" TabTimeline "Âñå" "Âñå çàïèñè" TabAll "Ìåòêè" "Âñå ìåòêè" TabTags "Åù¸" "Åù¸ ñïèñêè" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Ïîòåðÿííûå" "Ïîòåðÿííûå çàïèñè" TabMoreMissing "Ñèðîòû" "Îñèðîòåâøèå çàïèñè" TabMoreOrphans "Ñêðûòûå" "Ñêðûòûå çàïèñè" TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "Äàííàÿ çàïèñü ïðåäîñòàâëÿåò äîñòóï ê ðàñøèðåííûì íàñòðîéêàì",
	ColorPalette: "Èçìåíÿÿ çíà÷åíèÿ äàííîé çàïèñè âû ñìîæåòå èçìåíÿòü öâåòîâóþ ñõåìó îôîðìëåíèÿ ~TiddlyWiki",
	DefaultTiddlers: "Çàïèñè ïåðå÷èñëåííûå çäåñü àâòîìàòè÷åñêè ïîêàçûâàþòñÿ ïðè çàïóñêå ~TiddlyWiki",
	EditTemplate: "HTML øàáëîí â ýòîé çàïèñè îïðåäåëÿåò êàê áóäóò âûãëÿäåòü çàïèñè ïðè èõ ðåäàêòèðîâàíèè",
	GettingStarted: "Çäåñü ïåðå÷èñëåíû áàçîâûå èíñòðóêöèè ïî èñïîëüçîâàíèþ ïðîãðàììû",
	ImportTiddlers: "Èñïîëüçóÿ ýòó çàïèñü âû ñìîæåòå èìïîðòèðîâàòü äðóãèå çàïèñè",
	MainMenu: "Çäåñü ïåðå÷èñëåíî ñîäåðæèìîå ãëàâíîãî ìåíþ, îòîáðàæàåìîãî ñëåâà íà ýêðàíå",
	MarkupPreHead: "Ýòà çàïèñü áóäåò âñòàâëåíà â âåðøèíó ñåêöèè <head> HTML ôàéëà TiddlyWiki",
	MarkupPostHead: "Ýòà çàïèñü áóäåò âñòàâëåíà ñíèçó ñåêöèè <head> HTML ôàéëà TiddlyWiki",
	MarkupPreBody: "Ýòà çàïèñü áóäåò âñòàâëåíà â âåðøèíó ñåêöèè <body> HTML ôàéëà TiddlyWiki",
	MarkupPostBody: "Ýòà çàïèñü áóäåò âñòàâëåíà ñíèçó ñåêöèè <body> HTML ôàéëà TiddlyWiki ïîñëå áþëîêà ñêðèïòîâ",
	OptionsPanel: "Çäåñü îïðåäåëíî ñîäåðæèìîå âûïàäàþùåé ñïðàâà ïàíåëè íàñòðîåê",
	PageTemplate: "HTML øàáëîí âíóòðè ýòîé çàïèñè îïðåäåëÿåò îáùèé ìàêåò ~TiddlyWiki",
	PluginManager: "Äîñòóï ê ïàíåëè óïðàâëåíèÿ äîïîëíåíèÿìè",
	SideBarOptions: "Ïîçâîëÿåò îòðåäàêòèðîâàòü ñîäåðæèìîå ïàíåëè îïöèé ñïðàâà",
	SideBarTabs: "Ñîäåðæèìîå ïàíåëè çàêëàäîê ñïðàâà",
	SiteSubtitle: "Ñîäåðæèìîå ïîäçàãîëîâêà ñàéòà",
	SiteTitle: "Ñîäåðæèìîå çàãîëîâêà ñàéòà",
	SiteUrl: "URL ñàéòà äëÿ ïóáëèêàöèè",
	StyleSheetColors: "Ñîäåðæèìîå CSS îïðåäåëÿþùèé öâåòà ýëåìåíòîâ ñòðàíèöû. ''ÍÅ ÐÅÄÀÊÒÈÐÓÉÒÅ ÝÒÓ ÇÀÏÈÑÜ'', âíîñèòå ñâîè èçìåíåíèÿ â ñêðûòóþ çàïèñü StyleSheet",
	StyleSheet: "Ýòà çàïèñü îïðåäåëÿåò ïîëüçîâàòåëñêèé CSS",
	StyleSheetLayout: "Ñîäæåðæèò CSS îïðåäåëÿþùèé ðàñïîëîæåíèå ýëåìåíòîâ íà ñòðàíèöå. ''ÍÅ ÐÅÄÀÊÒÈÐÓÉÒÅ ÝÒÓ ÇÀÏÈÑÜ'', âíîñèòå ñâîè èçìåíåíèÿ â ñêðûòóþ çàïèñü StyleSheet",
	StyleSheetLocale: "Ñîäåðæèò CSS îïðåäåëÿþùèé îñîáåííîñòè ïåðâîäà",
	StyleSheetPrint: "Ñîäåðæèò CSS îïðåäåëÿþùèé ïàðààìåòðû ïå÷àòè",
	TabAll: "Ñîäåðæèìîå âêëàäêè 'Âñ¸' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabMore: "Ñîäåðæèìîå âêëàäêè 'Åù¸' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabMoreMissing: "Ñîäåðæèìîå âêëàäêè 'Ïîòåðÿííûå' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabMoreOrphans: "Ñîäåðæèìîå âêëàäêè 'Ñèðîòû' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabMoreShadowed: "Ñîäåðæèìîå âêëàäêè 'Ñêðûòûå' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabTags: "Ñîäåðæèìîå âêëàäêè 'Ìåòêè' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	TabTimeline: "Ñîäåðæèìîå âêëàäêè 'Õðîíîëîãèÿ' íà ïðàâîé íà ïðàâîé áîêîâé ïàíåëè",
	ToolbarCommands: "Îïðåäåëÿåò êîìàíäû ïàíåëè èíñòðóìåíòîâ",
	ViewTemplate: "HTML øàáëîí â ýòîé çàïèñè îïðåäåëÿåò êàê áóäóò îòîáðàæàòüñÿ çàïèñè"
	});

//}}}
