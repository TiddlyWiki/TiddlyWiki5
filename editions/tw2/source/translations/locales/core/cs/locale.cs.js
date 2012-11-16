/***
|''Name:''|CzechTranslationPlugin|
|''Description:''|Czech Translation of TiddlyWiki|
|''Author of translation:''|PetrChlebek (pchlebek (at) gmail (dot) com)|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/cs/locale.cs.js |
|''Version:''|0.3.7|
|''Date:''|Jul 6, 2007|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.4.0|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "cs"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "VašeJméno"});

merge(config.tasks,{
	save: {text: "Ulož", tooltip: "Ulož změny do TiddlyWiki", action: saveChanges},
	sync: {text: "Synch", tooltip: "Synchronizuj změny s jinými TiddlyWiki soubory a servery", content: '<<sync>>'},
	importTask: {text: "Import", tooltip: "Importuj příspěvky a pluginy z jiných TiddlyWiki souborů a pluginů", content: '<<importTiddlers>>'},
	tweak: {text: "Uprav", tooltip: "Uprav vzhled a chování TiddlyWiki", content: '<<options>>'},
	upgrade: {text: "Upgrade", tooltip: "Aktualizace TW kódu", content: '<<upgrade>>'},
     plugins: {text: "Pluginy", tooltip: "Proveď instalaci pluginů", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Jméno pro podepsání editace",
	chkRegExpSearch: "Vhodné a správné vyjádření pro vyhledávání",
	chkCaseSensitiveSearch: "Podrobnější vyhledávání",
	chkAnimate: "Možnost animace",
	chkSaveBackups: "Vytvoření zálohy při ukládání souboru",
	chkAutoSave: "Automatické ukládání změn",
	chkGenerateAnRssFeed: "Vytvoření RSS souboru při ukládání změn",
	chkSaveEmptyTemplate: "Vytvoření prázdné šablony při ukládání změn",
	chkOpenInNewWindow: "Otevření externího odkazu do nového okna",
	chkToggleLinks: "Kliknutím na odkaz otevřeného příspěvku se zavře",
	chkHttpReadOnly: "Skrytí možnosti editace přes HTTP",
	chkForceMinorUpdate: "Neaktualizuje změnu jména a data při úpravě příspěvků",
	chkConfirmDelete: "Požadavek potvrzení před smazáním příspěvků",
	chkInsertTabs: "Použití tabulkového klíče k vložení tabulových znaků kromě změn v polích",
	txtBackupFolder: "Jméno adresáře pro zálohy",
	txtMaxEditRows: "Nejvyšší počet řádků v textovém poli",
	txtFileSystemCharSet: "Výchozí naastavení pro uložení změn (pouze Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Problém při nahrávání nebo běhu pluginu. Podívej se do PluginManageru na podrobnosti",
	pluginError: "Chyba: %0",
	pluginDisabled: "Neproběhlo, neobjevila se cesta k 'systemConfigDisable' tagu",
	pluginForced: "Proběhlo, jde o nutný 'systemConfigForce' tag",
	pluginVersionError: "Neproběhlo, plugin vyžaduje novější verzi TiddlyWiki",
	nothingSelected: "Nic není vybráno, nejdříve vyber jednu nebo více možností",
	savedSnapshotError: "TiddlyWiki nebyl pravděpodobně správně uložen. Podívej se na http://www.tiddlywiki.com/#DownloadSoftware na podrobnosti",
	subtitleUnknown: "(neznámý)",
	undefinedTiddlerToolTip: "Příspěvek '%0' neexistuje",
	shadowedTiddlerToolTip: "Příspěvek '%0' zatím neexistuje, ale je již předdefinován",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Vnější odkaz na %0",
	noTags: "Žádné propojené příspěvky",
	notFileUrlError: "Nejdříve ulož TiddlyWiki do souboru (do počítače) než provedeš změny",
	cantSaveError: "Není možné uložit změny. Možné důvody zahrnují:\n- váš prohlížeč neumožňuje uložení (Firefox, Internet Explorer, Safari a Opera fungují, jestliže jsou správně nastaveny)\n- cesta k souboru obsahuje nepovolené znaky\n- TiddlyWiki HTML soubor byl přemístěn nebo přejmenován",
	invalidFileError: "Původní soubor '%0' asi neodpovídá podmínkám TiddlyWiki",
	backupSaved: "Záloha uložena",
	backupFailed: "Chyba při ukládání souboru",
	rssSaved: "RSS soubor uložen",
	rssFailed: "Chyba při ukládání RSS souboru",
	emptySaved: "Prázdná šablona uložena",
	emptyFailed: "Chyba při ukládání prázdné šablony",
	mainSaved: "Hlavní TiddlyWiki soubor uložen",
	mainFailed: "Chyba při ukládání hlavního TiddlyWiki souboru. Vaše změny nebyly uloženy",
	macroError: "Chyba v makru <<\%0>>",
	macroErrorDetails: "Chyba při běhu makra <<\%0>>:\n%1",
	missingMacro: "Chybějící makro",
	overwriteWarning: "Příspěvek '%0' již existuje. Vyber OK pro přepsání",
	unsavedChangesWarning: "Varování! Neuložené změny v TiddlyWiki\n\nVyber OK pro uložení\nVyber CANCEL pro zrušení změn",
	confirmExit: "--------------------------------\n\nNeuložené změny v TiddlyWiki. Pokud chceš pokračovat, ztratíš provedené změny\n\n--------------------------------",
	saveInstructions: "Uložit změny",
	unsupportedTWFormat: "Nepodporovaný formát v TiddlyWiki '%0'",
	tiddlerSaveError: "Chyba při ukládání příspěvku '%0'",
	tiddlerLoadError: "Chyba při nahrávání příspěvku '%0'",
	wrongSaveFormat: "Nejde uložit do vašeho formátu '%0'. Použij standardní formát pro uložení.",
	invalidFieldName: "Chybný název pole %0",
	fieldCannotBeChanged: "Pole '%0' nemůže být změněno",
	loadingMissingTiddler: "Nové nahrání příspěvku '%0' ze '%1' serveru na:\n\n'%2' pracovní místo '%3'"});

merge(config.messages.messageClose,{
	text: "Zavřít",
	tooltip: "Zavřít textové pole"});

config.messages.backstage = {
	open: {text: "Příkazy", tooltip: "Otevři oblast příkazů pro autorizaci a editaci úkolů"},
	close: {text: "Zavřít", tooltip: "Zavři oblast příkazů"},
	prompt: "Příkazy: ",
	decal: {
		edit: {text: "Uprav", tooltip: "Edituj příspěvek '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klikni pro zobrazení celého příspěvku",
	previewUnavailable: "(bez náhledu)"
};

config.messages.dates.months = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad","prosinec"];
config.messages.dates.days = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
config.messages.dates.shortMonths = ["led", "úno", "bře", "dub", "kvě", "čer", "červ", "srp", "zář", "říj", "lis", "pro"];
config.messages.dates.shortDays = ["ne", "po", "út", "st", "čt", "pá", "so"];
// suffixes for dates, eg "1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"
config.messages.dates.daySuffixes = [".",".",".",".",".",".",".",".",".",".",
		".",".",".",".",".",".",".",".",".",".",
		".",".",".",".",".",".",".",".",".",".",
		"."];
config.messages.dates.am = "dop";
config.messages.dates.pm = "odp";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "Bez tagu",
	labelTags: "Tagy: ",
	openTag: "Otevřený tag '%0'",
	tooltip: "Ukaž příspěvky propojené tagem s '%0'",
	openAllText: "Otevři vše",
	openAllTooltip: "Otevři všechny tyto příspěvky",
	popupNone: "Žádné další příspěvky nejsou tagem propojeny s '%0'"});

merge(config.views.wikified,{
	defaultText: "Příspěvek '%0' zatím neexistuje. Dvojklikem jej vytvoř",
	defaultModifier: "(Chybějící)",
	shadowModifier: "(Systémový příspěvek)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "Vytvořeno"});

merge(config.views.editor,{
	tagPrompt: "Vytvoř tag, [[použijte dvojité hranaté závorky]] pokud ještě neexistuje, nebo přiřaď k existujícímu tagu",
	defaultText: "Zapiš text '%0'"});

merge(config.views.editor.tagChooser,{
	text: "Tagy",
	tooltip: "Vyber tag pro příspěvek",
	popupNone: "Tag není definován",
	tagTooltip: "Přidej tag '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "Vyhledat",
	prompt: "Prohledej TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 nalezené příspěvky %1",
	failureMsg: "Nenalezené příspěvky %0"});

merge(config.macros.tagging,{
	label: "Propojeno: ",
	labelNotTag: "Nepropojeno",
	tooltip: "Seznam příspěvků propojených tagem '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Ukaž propojené příspěvky '%0'",
	noTags: "Nejsou zde žádné propojené příspěvky"});

config.macros.list.all.prompt = "Řazení podle abecedy";
config.macros.list.missing.prompt = "Příspěvky s neexistujícími nebo nepropojenými odkazy";
config.macros.list.orphans.prompt = "Příspěvky neobsahují odkazy na jiné zápisy";
config.macros.list.shadowed.prompt = "Příspěvky pro úpravu systému";
config.macros.list.touched.prompt = "Příspěvky mohou být dočasně změněny";

merge(config.macros.closeAll,{
	label: "Zavřít vše",
	prompt: "Zapři všechny zobrazené příspěvky (kromě právě upravovaných)"});

merge(config.macros.permaview,{
	label: "Stálý odkaz",
	prompt: "Stálý odkaz na zobrazové příspěvky"});

merge(config.macros.saveChanges,{
	label: "Uložit změny",
	prompt: "Ulož všechny změny před vytvořením nového TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "Nový příspěvek",
	prompt: "Vytvoř nový příspěvek",
	title: "Nový příspěvek",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "Nový příspěvek podle data",
	prompt: "Vytvoř časově určený příspěvek",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Tweak - pokročilá nastavení",
	step1Title: "Tato nastavení jsou uložena v cookies vašeho prohlížeče",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Ukaž skrytá nastavení</input>",
	unknownDescription: "//(neznámý)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Nastavení", type: 'String'},
			{name: 'Description', field: 'description', title: "Popis", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Název", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Řízení pluginů",
	step1Title: "Aktuálně nahrané pluginy",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Plugin již byl spuštěn při startu webu)",
	noPluginText: "Pluginy nejsou nainstalovány",
	confirmDeleteText: "Opravdu chceš smazat tyto pluginy?:\n\n%0",
	removeLabel: "Odstranění systemConfig",
	removePrompt: "Odstranění systemConfig",
	deleteLabel: "Odstranit",
	deletePrompt: "Smaž tyto příspěvky navždy",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Příspěvek", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Velikost", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Nezbytné", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Vyřazeno", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Nahráno", type: 'Boolean', trueText: "Ano", falseText: "Ne"},
			{name: 'Startup Time', field: 'startupTime', title: "Čas zahájení", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Chyba", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Výpis", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "Více",
	morePrompt: "Další příkazy"
	});

merge(config.macros.refreshDisplay,{
	label: "Obnovit",
	prompt: "Aktualizuj původní zobrazení"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Nemůžeš importovat do souboru, který je pouze pro čtení. Otevři jej ze souboru:// URL",
	wizardTitle: "Import příspevků z jiného souboru nebo serveru",
	step1Title: "Krok 1: Vyber server nebo soubor s TiddlyWiki",
	step1Html: "Upřesni server: <select name='selTypes'><option value=''>Vyber...</option></select><br>Zapiš URL nebo cestu: <input type='text' size=50 name='txtPath'><br>...nebo najdi soubor: <input type='file' size=50 name='txtBrowse'><br><hr>...nebo vyber nadefinovaný zdroj: <select name='selFeeds'><option value=''>Choose...</option></select>",
	openLabel: "Otevři",
	openPrompt: "Otevři spojení k souboru nebo serveru",
	openError: "Problém s připojením souboru",
	statusOpenHost: "Otevři jako host",
	statusGetWorkspaceList: "Seznam pracovních polí",
	step2Title: "Krok 2: Vyber pracovní pole",
	step2Html: "Otevři pracovní pole: <input type='text' size=50 name='txtWorkspace'><br>...nebo vyber jiné umístění: <select name='selWorkspace'><option value=''>Vybrat...</option></select>",
	cancelLabel: "Zrušit",
	cancelPrompt: "Zruš import",
	statusOpenWorkspace: "Otevři pracovní pole",
	statusGetTiddlerList: "Seznam možných příspěvků",
	step3Title: "Krok 3: Vyber příspěvky k importu",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Nechej cestu k příspěvkům pro případnou změnu</input><br><input type='checkbox' name='chkSave'>Ulož změny na serveru 'systemServer' volané příspěvkem:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "Import",
	importPrompt: "Import těchto příspěvků",
	confirmOverwriteText: "Chceš přepsat tyto příspěvky?:\n\n%0",
	step4Title: "Krok 4: Import %0 příspěvků",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "Hotovo",
	donePrompt: "Zavři průvodce",
	statusDoingImport: "Importované příspěvky",
	statusDoneImport: "Všechny příspěvky naimportovány",
	systemServerNamePattern: "%2 on %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Příspěvek '%0' již existuje. Vyber 'OK' pro přepsání, nebo 'Cancel' bez provedení změn",
	serverSaveTemplate: "|''Type:''|%0|\n|''URL:''|%1|\n|''Workspace:''|%2|\n\nTento příspěvek byl automaticky vytvořen s provedením změn",
	serverSaveModifier: "(Systém)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Příspěvek", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Velikost", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Tagy", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Upgrade TiddlyWiki kód",
	step1Title: "Update or oprav TiddlyWiki podle poslední verze",
	step1Html: "Poslední verze je používána. (z <a href='%0' class='externalLink' target='_blank'>%1</a>). Obsah je chráněn před upgrade.<br>Pamatuj, že může dojít ke kolizi nové verze a starších pluginů. V případě problémů se podívej na: <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "Nelze provést upgrade. Musíš použít sobor na lokálním počítači",
	errorNotSaved: "Před upgrade musíš uložit změny",
	step2Title: "Detaily upgrade",
	step2Html_downgrade: "Jdeš do nižší verze TiddlyWiki %0 from %1.<br><br>Nedoporučuje se",
	step2Html_restore: "TiddlyWiki již pravděpodobně užívá poslední verzi (%0).<br><br>Zkus to příště - pozor na poškození souboru",
	step2Html_upgrade: "Máž hotov upgrade TiddlyWiki %0 z %1",
	upgradeLabel: "Upgrade",
	upgradePrompt: "Příprava na upgrade",
	statusPreparingBackup: "Příprava zálohy",
	statusSavingBackup: "Uložení zálohy",
	errorSavingBackup: "Problém při ukládání zálohy",
	statusLoadingCore: "Nahrávání kódu",
	errorLoadingCore: "Chyba při nahrávání kódu",
	errorCoreFormat: "Chyba v novém kódu",
	statusSavingCore: "Nový kód uložen",
	statusReloadingCore: "Nový kód přehrán",
	startLabel: "Start",
	startPrompt: "Start upgrade",
	cancelLabel: "Zruš",
	cancelPrompt: "Zruš upgrade",
	step3Title: "Upgrade zrušen",
	step3Html: "Upgrade již byl zrušen"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Příspěvek", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Typ serveru", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Hostování na serveru", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Pracovní místo na serveru", type: 'String'},
			{name: 'Status', field: 'status', title: "Nastavení synchronizace", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Server URL", text: "Náhled", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Synchronizuj tyto příspěvky", name: 'sync'}
			]},
	wizardTitle: "Synchronizuj z externího zdroje",
	step1Title: "Vyber příspěvky k synchronizaci",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "Synchronizuj",
	syncPrompt: "Synchronizuj tyto příspěvky",
	hasChanged: "Změny během odpojení",
	hasNotChanged: "Žádné změny během odpojení",
	syncStatusList: {
		none: {text: "...", color: "žádná"},
		changedServer: {text: "Změněno na serveru", color: '#80ff80'},
		changedLocally: {text: "Změna během odpojení", color: '#80ff80'},
		changedBoth: {text: "Změna během odpojení vinou serveru", color: '#ff8080'},
		notFound: {text: "Server nenalezen", color: '#ffff80'},
		putToServer: {text: "Uložit aktualizaci na serveru", color: '#ff80ff'},
		gotFromServer: {text: "Získat aktualizaci ze serveru", color: '#80ffff'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "Zavřít",
	tooltip: "Zavři příspěvek"});

merge(config.commands.closeOthers,{
	text: "Zavřít ostatní",
	tooltip: "Zavři ostatní příspěvky"});

merge(config.commands.editTiddler,{
	text: "Upravit",
	tooltip: "Uprav tento příspěvek",
	readOnlyText: "Náhled",
	readOnlyTooltip: "Náhled příspěvku"});

merge(config.commands.saveTiddler,{
	text: "Hotovo",
	tooltip: "Ulož změny v příspěvku"});

merge(config.commands.cancelTiddler,{
	text: "Zrušit",
	tooltip: "Změny v příspěvku se neprovedou",
	warning: "Opravdu nechceš změny '%0'?",
	readOnlyText: "Hotovo",
	readOnlyTooltip: "Správný náhled příspěvku"});

merge(config.commands.deleteTiddler,{
	text: "Odstranit",
	tooltip: "Smaž tento příspěvek",
	warning: "Opravdu chceš odstranit '%0'?"});

merge(config.commands.permalink,{
	text: "Stálý odkaz",
	tooltip: "Stálý odkaz k příspěvku"});

merge(config.commands.references,{
	text: "Reference",
	tooltip: "Příspěvky, které jsou propojeny s vybraným příspěvkem",
	popupNone: "Žádné reference"});

merge(config.commands.jump,{
	text: "Skočit",
	tooltip: "Skoč na jiný otevřený příspěvek"});

merge(config.commands.syncing,{
	text: "Synchronizovat",
	tooltip: "Kontrola synchronizace na soubory z jiných serverů",
	currentlySyncing: "<div>Aktuální cesta <span class='popupHighlight'>'%0'</span> do:</"+"div><div>hosta: <span class='popupHighlight'>%1</span></"+"div><div>pracovního místa: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Není aktuální synchronizace",
	captionUnSync: "Zastavení synchronizace příspěvků",
	chooseServer: "Synchronizuj příspěvek s jiným serverem:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "Pole",
	tooltip: "Ukaž rozšiřující pole pro příspěvek",
	emptyText: "Nejsou žádná rozšiřující pole pro příspěvek",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Pole", type: 'String'},
			{name: 'Value', field: 'value', title: "Hodnota", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

// Mnou upravený úsek

merge(config.shadowTiddlers,{
	DefaultTiddlers: "GettingStarted",
	MainMenu: "GettingStarted",
	GettingStarted: "Při startu TiddlyWiki musíš upravit tyto příspěvky:\n* SiteTitle & SiteSubtitle: Titul a podtitul webu, který je v záhlaví (po uložení se objeví v modrém pruhu)\n* MainMenu: Navigace (zpravidla vlevo)\n* DefaultTiddlers: Příspěvky, které jsou vidět při otevření stránky\nVlož také své jméno pro podpis příspěvků: <<option txtUserName>>",
	SiteTitle: "Moje TiddlyWiki",
	SiteSubtitle: "nelineární osobní publikační zápisník",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Výchozí rozhraní je defaultně určeno z TiddlyWiki\n\nTvé jméno pro podpis. Zapiš jej jako WikiWord (VašeJméno)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Uložit zálohu\n<<option chkAutoSave>> Automatické uložení\n<<option chkRegExpSearch>> Vyhledání\n<<option chkCaseSensitiveSearch>> Upřesnění vyhledávání\n<<option chkAnimate>> Možnost animace\n\n----\nTaké ukaž [[AdvancedOptions|AdvancedOptions]]",
     SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY" "journal">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "Nastavení \u00bb" "Pokročilá nastavení">>',
	SideBarTabs: '<<tabs txtMainTab "Čas" "Čas" TabTimeline "Vše" "Všechny příspěvky" TabAll "Tagy" "Všechny tagy" TabTags "Více" "Další seznam" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Nepropojené" "Nepropojené příspěvky" TabMoreMissing "Osamocené" "Osamocené příspěvky" TabMoreOrphans "Systém" "Systémové příspěvky" TabMoreShadowed>>',
	ToolbarCommands: "|~ViewToolbar|closeTiddler closeOthers +editTiddler > fields syncing permalink references jump|\n|~EditToolbar|+saveTiddler -cancelTiddler deleteTiddler|"});

merge(config.annotations,{
	AdvancedOptions: "Systémový příspěvek pro přístup k dalšímu nastavení",
	ColorPalette: "Hodnoty pro určení barvy ~TiddlyWiki prostředí",
	DefaultTiddlers: "Tyto příspěvky budou viditelné při startu ~TiddlyWiki",
	EditTemplate: "HTML šablona určuje, jak vypadají příspěvky, které se upravují",
	GettingStarted: "Příspěvek poskytuje základní instrukce",
	ImportTiddlers: "Příspěvek poskytuje přístup k importovaným příspěvkům",
	MainMenu: "Příspěvek ukazuje navigaci, nejčastěji v levém sloupci",
	MarkupPreHead: "Příspěvek je vložen na <head> začátek TiddlyWiki HTML kódu",
	MarkupPostHead: "Příspěvek je vložen na <head> konec TiddlyWiki HTML kódu",
	MarkupPreBody: "Příspěvek je vložen na <body> začátek TiddlyWiki HTML kódu",
	MarkupPostBody: "Příspěvek je vložen na <body> konec TiddlyWiki HTML kódu okamžitě před blokováním",
	OptionsPanel: "Příspěvek je použit pro nastavení (nejčastěji v pravém slouci)",
	PageTemplate: "HTML šablona ukazuje celkový layout ~TiddlyWiki",
	PluginManager: "Příspěvek umožňuje přístup k plugin manažeru",
	SideBarOptions: "Příspěvek je použit pro celkové nastavení (nejčastěji v pravém slouci)",
	SideBarTabs: "Obsah příspěvků v pravém sloupci",
	SiteSubtitle: "Podtitul webu",
	SiteTitle: "Titul webu",
	SiteUrl: "Adresa pro umístění webu",
	StyleSheetColours: "Příspěvek definuje barvy v CSS",
	StyleSheet: "Příspěvek obsahuje nastavení CSS",
	StyleSheetLayout: "Příspěvek obsahuje CSS ve vazbě na layout stránky",
	StyleSheetLocale: "Příspěvek obsahuje CSS v lokalizaci stránek",
	StyleSheetPrint: "Příspěvek obsahuje CSS pro tisk",
	TabAll: "V příspěvku je seznam 'All' z pravého sloupce",
	TabMore: "V příspěvku je seznam 'More' z pravého sloupce",
	TabMoreMissing: "V příspěvku je seznam 'Missing' z pravého sloupce",
	TabMoreOrphans: "V příspěvku je seznam 'Orphans' z pravého sloupce",
	TabMoreShadowed: "V příspěvku je seznam 'Shadowed' z pravého sloupce",
	TabTags: "V příspěvku je seznam 'Tags' z pravého sloupce",
	TabTimeline: "V příspěvku je seznam 'Timeline' z pravého sloupce",
	ViewTemplate: "HTML šablona ukazuje, jak bude příspěvek vypadat"
	});

//}}}
