/***
|''Name:''|SwedishTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Swedish|
|''Author:''|SebastianRasmussen (sebras (at) hotmail (dot) com)|
|''Source:''|www.example.com |
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/sv/locale.sv.js |
|''Version:''|0.3.7|
|''Date:''|Sep 14, 2008|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.4|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "sv"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "DittNamn"});

merge(config.tasks,{
	save: {text: "spara", tooltip: "Spara dina ändringar för denna TiddlyWiki", action: saveChanges},
	sync: {text: "synka", tooltip: "Synkronisera ändringar med andra TiddlyWiki-filer och servrar", content: '<<sync>>'},
	importTask: {text: "importera", tooltip: "Importera tiddler och insticksprogram från andra Tiddlywiki-filer och servrar", content: '<<importTiddlers>>'},
	tweak: {text: "anpassa", tooltip: "Anpassa TiddlyWikis utseend och beteende", content: '<<options>>'},
	upgrade: {text: "uppgradera", tooltip: "Uppgradera TiddlyWikis kärnkod", content: '<<upgrade>>'},
	plugins: {text: "instick", tooltip: "Hantera installera insticksprogram", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Användarnamn för signering av ändringar",
	chkRegExpSearch: "Slå på reguljärar uttryck för sökningar",
	chkCaseSensitiveSearch: "Skiftlägeskänslig sökning",
	chkIncrementalSearch: "Inkrementell sökning",
	chkAnimate: "Slå på animationer",
	chkSaveBackups: "Skapa en säkerhetskopia när ändringar sparas",
	chkAutoSave: "Spara ändringar automatiskt",
	chkGenerateAnRssFeed: "Generera ett RSS-flöde när ändringar sparas",
	chkSaveEmptyTemplate: "Generera en tomm mall när ändringar sparas",
	chkOpenInNewWindow: "Öppna externa länkar i ett nytt fönster",
	chkToggleLinks: "Klickande på länkar för att öppna tiddler stänger dem",
	chkHttpReadOnly: "Göm ändringsfunktioner vid visning över HTTP",
	chkForceMinorUpdate: "Uppdatera ej modifierande användarnamn och datum vid redigering av tiddler",
	chkConfirmDelete: "Kräv bekräftelse för borttagning av tiddler",
	chkInsertTabs: "Använd tab-tangenten för att tabulera istället för att flytta mellan fält",
	txtBackupFolder: "Katalognamn att använda för säkerhetskopior",
	txtMaxEditRows: "Maximalt antal rader i redigeringsboxar",
	txtFileSystemCharSet: "Standard teckenkodning vid sparning av ändringar (endast Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Problem uppstod vid laddning av insticksprogram. Se PluginManager för detaljer",
	pluginError: "Fel: %0",
	pluginDisabled: "Ej exekverad då det är avslaget via märkordet 'systemConfigDisable'",
	pluginForced: "Påtvingad exekvering på grund av märkordet 'systemConfigForce'",
	pluginVersionError: "Ej exekverad på grund av att detta insticksprogram kräver en nyare version av TiddlyWiki",
	nothingSelected: "Ingenting är valt. Du måste välja ett eller fler alternativ först",
	savedSnapshotError: "It appears that this TiddlyWiki has been incorrectly saved. Please see http://www.tiddlywiki.com/#DownloadSoftware for details",
	subtitleUnknown: "(okänd)",
	undefinedTiddlerToolTip: "Tiddlern '%0' existerar inte ännu",
	shadowedTiddlerToolTip: "Tiddlern '%0' existerar inte ännu, men har ett fördefinierat skugg-värde",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Extern länk till %0",
	noTags: "Det finns inga märkta tiddlers",
	notFileUrlError: "Du måste spara denna TiddlyWiki till en fil innan du kan spara ändringar",
	cantSaveError: "Det är inte möjligt att spara ändringarna. Detta kan bero på:\n- din webbläsare har inte stöd för att spara (Firefox, Internet Explorer, Safari och Opera fungerar om de konfigureras korrekt)\n- sökvägen till din Tiddlywiki innehåller ogiltiga tecken\n- TiddlyWikis HTML-fil har flyttats eller bytat namn",
	invalidFileError: "Originalfilen '%0' är inte en giltig TiddlyWiki",
	backupSaved: "Säkerhetskopia sparad",
	backupFailed: "Misslyckades att spara säkerhetskopia till fil",
	rssSaved: "RSS-flöde sparat",
	rssFailed: "Misslyckades att spara RSS-flödet till fil",
	emptySaved: "Tom mall sparad",
	emptyFailed: "Misslyckades att spara tom mall till fil",
	mainSaved: "TiddlyWikis huvudfil sparad",
	mainFailed: "Misslyckades att spara TiddlyWikis huvudfil. Dina ändringar har inte sparats",
	macroError: "Fel i makro <<\%0>>",
	macroErrorDetails: "Fel vid exekvering av makro <<\%0>>:\n%1",
	missingMacro: "Inget sådant makro finns",
	overwriteWarning: "En tiddler med namn '%0' existerar redan. Välj OK för att ersätta",
	unsavedChangesWarning: "VARNING! Det finns osparade ändringar i TiddlyWiki\n\nVälj OK för att spara\nVälj AVBRYT för att kassera ändringarna",
	confirmExit: "--------------------------------\n\nDet finns osparade ändringar i TiddlyWiki. Om du fortsätter kommer de ändringarna att gå förlorade\n\n--------------------------------",
	saveInstructions: "SparaÄndringar",
	unsupportedTWFormat: "Stöd för TiddlyWiki format '%0' saknas",
	tiddlerSaveError: "Fel vid sparning av tiddler '%0'",
	tiddlerLoadError: "Fel vid laddning av tiddler '%0'",
	wrongSaveFormat: "Kan inte spara med lagringsformat '%0'. Använder standardlagringsformat för sparning.",
	invalidFieldName: "Ogiltigt fältnamn %0",
	fieldCannotBeChanged: "Fältet '%0' kan inte ändras",
	loadingMissingTiddler: "Försöker att hämta tiddlern '%0' från servern '%1':\n\n'%2' i arbetsyta '%3'",
	upgradeDone: "Uppgraderingen till version %0 är nu fullständig\n\nKlicka på 'OK' för att ladda om den uppgraderade TiddlyWiki"});

merge(config.messages.messageClose,{
	text: "stäng",
	tooltip: "stäng denna meddelandearea"});

config.messages.backstage = {
	open: {text: "backstage", tooltip: "Öppnar backstage-arean för att utföra författande och redigering"},
	close: {text: "stäng", tooltip: "Stäng backstage-arean"},
	prompt: "backstage: ",
	decal: {
		edit: {text: "redigera", tooltip: "Redigera tiddlern '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klicka för den här tiddlerns fullständiga text",
	previewUnavailable: "(förhandsgranskning inte tillgänglig)"
};

config.messages.dates.months = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November","December"];
config.messages.dates.days = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
config.messages.dates.shortDays = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = [":a",":a",":e",":e",":e",":e",":e",":e",":e",":e",
		":e",":e",":e",":e",":e",":e",":e",":e",":e",":e",
		":a",":a",":e",":e",":e",":e",":e",":e",":e",":e",
		":a"];
config.messages.dates.am = "dagtid";
config.messages.dates.pm = "nattetid";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "inga märkord",
	labelTags: "märkord: ",
	openTag: "Öppna märkord '%0'",
	tooltip: "Visa tiddler märka med '%0'",
	openAllText: "Öppna alla",
	openAllTooltip: "Öppna alla dessa tiddler",
	popupNone: "Inga andra tiddler är märkta med '%0'"});

merge(config.views.wikified,{
	defaultText: "Tiddlern '%0' existerar inte ännu. Dubbel-klicka för att skapa den",
	defaultModifier: "(saknas)",
	shadowModifier: "(inbyggd skugg-tiddler)",
	dateFormat: "YYYY MM DD", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "skapad"});

merge(config.views.editor,{
	tagPrompt: "Skriv märkord separerade med mellanslag, [[använd dubbla klammrar]] om nödvändigt, eller lägg till existerande",
	defaultText: "Skriv texten för '%0'"});

merge(config.views.editor.tagChooser,{
	text: "märkord",
	tooltip: "Välj existerande märkord att lägga till denna tiddler",
	popupNone: "Det finns inga märkord definierade",
	tagTooltip: "Lägg till märkordet '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "sök",
	prompt: "Sök i denna TiddlyWiki",
	accessKey: "S",
	successMsg: "%0 tiddler matchar %1",
	failureMsg: "Inga tiddler matchar %0"});

merge(config.macros.tagging,{
	label: "märkning: ",
	labelNotTag: "ingen märkning",
	tooltip: "Lista över alla tiddler märka med '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Visa tiddler märkta med '%0'",
	noTags: "Det finns inga märkta tiddler"});

config.macros.list.all.prompt = "Alla tiddler i alfabetisk ordning";
config.macros.list.missing.prompt = "Tiddler som länkas till men inte är definierade";
config.macros.list.orphans.prompt = "Tiddler som inte länkas till från någon annan tiddler";
config.macros.list.shadowed.prompt = "Tiddler som skuggas med standardinnnehåll";
config.macros.list.touched.prompt = "Tiddler som har modifierats lokalt";

merge(config.macros.closeAll,{
	label: "stäng alla",
	prompt: "Stäng alla visade tiddler (utom de som redigeras)"});

merge(config.macros.permaview,{
	label: "permalänk",
	prompt: "Länk till en URL som hämtar alla de nu visade tiddlerna"});

merge(config.macros.saveChanges,{
	label: "spara ändringar",
	prompt: "Spara alla tidller och att skapa en ny TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "ny tiddler",
	prompt: "Skapa en ny tiddler",
	title: "Ny Tiddler",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "ny journal",
	prompt: "Skapa en ny tiddler med nuvarande datum och tid",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Anpassa avancerade inställningar",
	step1Title: "Dessa inställningar sparas i kakor i din webbläsare",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Visa okända inställningar</input>",
	unknownDescription: "//(okänd)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Inställning", type: 'String'},
			{name: 'Description', field: 'description', title: "Beskrivning", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Namn", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Hantera insticksprogram",
	step1Title: "Nu inladdade insticksprogram",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Detta insticksprogram har inte exekverats eftersom det lagts till efter uppstart)",
	noPluginText: "Det finns inga insticksprogram installerade",
	confirmDeleteText: "Är du säker på att du vill ta bort dessa insticksprogram:\n\n%0",
	removeLabel: "ta bort systemConfig märkordet",
	removePrompt: "Ta bort systemConfig märkordet",
	deleteLabel: "ta bort",
	deletePrompt: "Ta bort dessa tiddler för alltid",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Storlek", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Tvingad", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Avslagen", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Laddad", type: 'Boolean', trueText: "Ja", falseText: "Nej"},
			{name: 'Startup Time', field: 'startupTime', title: "Starttid", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Fel", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Logg", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "mer",
	morePrompt: "Visa fler kommando"
	});

merge(config.macros.refreshDisplay,{
	label: "Uppdatera",
	prompt: "Uppdatera visningen av hela TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Du kan inte importera i en TiddlyWiki som bara kan läsas. Försök att öppna från en file:// URL",
	wizardTitle: "Importera tiddler från en annan fil eller server",
	step1Title: "Steg 1: Hitta servern eller TiddlyWiki-filen",
	step1Html: "Specificera typen av sever: <select name='selTypes'><option value=''>Välj...</option></select><br>Skriv URL eller sökväg här: <input type='text' size=50 name='txtPath'><br>...eller bläddra efter en fil: <input type='file' size=50 name='txtBrowse'><br><hr>...eller välj ett fördefinierat flöde: <select name='selFeeds'><option value=''>Välj...</option></select>",
	openLabel: "öppna",
	openPrompt: "Öppna anslutninge till denna fil eller server",
	openError: "Fel uppstod vid hämtning av TiddlyWiki-filen",
	statusOpenHost: "Öppnar servern",
	statusGetWorkspaceList: "Hämtar listan av tillgänglia arbetsytor",
	step2Title: "Steg 2: Välj en arbetsyta",
	step2Html: "Skriv in namnet på en arbetsyta: <input type='text' size=50 name='txtWorkspace'><br>...eller välj en arbetsyta: <select name='selWorkspace'><option value=''>Välj...</option></select>",
	cancelLabel: "avbryt",
	cancelPrompt: "Avbryt denna importering",
	statusOpenWorkspace: "Öppna arbetsytan",
	statusGetTiddlerList: "Hämta listan över tillgängliga tiddler",
	errorGettingTiddlerList: "Fel vid hämtning av lista över tiddler, klicka på Avbryt för att försöka igen",
	step3Title: "Steg 3: Välj vilka tiddler som ska importeras",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Håll dessa tiddler länkade till denna server så att du kan synkronisera framtida ändringar</input><br><input type='checkbox' name='chkSave'>Spara detaljerna om denna server i en 'systemServer' tiddler med namnet:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importera",
	importPrompt: "Importera dessa tiddler",
	confirmOverwriteText: "Är du säker på att du vill ersätta dessa tiddler:\n\n%0",
	step4Title: "Steg 4: Importerar %0 tiddler",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "klar",
	donePrompt: "Stäng denna guide",
	statusDoingImport: "Importerar tiddler",
	statusDoneImport: "Alla tiddler importerade",
	systemServerNamePattern: "%2 på %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Tiddlern '%0' existerar redan. Klicka 'OK' för att ersätta den med detaljerna från denna server, eller 'Avbryt' för att lämna det oförändrat",
	serverSaveTemplate: "|''Typ:''|%0|\n|''URL:''|%1|\n|''Arbetsyta:''|%2|\n\nDenna tiddler skapades automatiskt för att spara detaljera om denna server",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Storlek", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Märkord", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Uppgradera TiddlyWikins kärnkod",
	step1Title: "Uppdatera eller reparera denna TiddlyWiki till senast publicerade versionen",
	step1Html: "Du håller på att uppgradera till den senast publicerade versionen av TiddlyWikis kärnkod (från <a href='%0' class='externalLink' target='_blank'>%1</a>). Ditt innehåller kommer att bevaras under uppgraderingen.<br><br>Notera att kärnkodsuppgraderingar är kända att störa ändre insticksprogram. Om du upplever problem med den uppgraderade filen, se <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "Uppgraderingen av denna TiddlyWiki misslyckades. Du kan bara utföra uppgraderingar av TiddlyWiki-filer som sparats lokalt",
	errorNotSaved: "Du måste spara alla ändringar innan du kan utföra en uppgradering",
	step2Title: "Bekräfta uppgraderingsdetaljerna",
	step2Html_downgrade: "Du håller på att nedgradera till TiddlyWiki version %0 från %1.<br><br>Nedgradering till en tidigare version av kärnkoden rekommenderas inte",
	step2Html_restore: "Denna TiddlyWiki verkar redan köra den senaste versionen av kärnkoden (%0).<br><br>Du kan fortsätta att uppgradera ändå för att säkerställa att kärnkoden inte har blivit korrupt eller skadad",
	step2Html_upgrade: "Du håller på att uppgradera till TiddlyWiki version %0 från %1",
	upgradeLabel: "uppgradera",
	upgradePrompt: "Förbereder uppgraderingen",
	statusPreparingBackup: "Förberede säkerhetskopia",
	statusSavingBackup: "Sparar säkerhetskopian till fil",
	errorSavingBackup: "Fel uppstod när säkerhetskopian sparades till fil",
	statusLoadingCore: "Laddar kärnkoden",
	errorLoadingCore: "Fel vid laddning av kärnkoden",
	errorCoreFormat: "Fel uppstod med den nya kärnkoden",
	statusSavingCore: "Sparar den nya kärnkoden",
	statusReloadingCore: "Laddar om den nya kärnkoden",
	startLabel: "starta",
	startPrompt: "Starta uppgraderingen",
	cancelLabel: "avbryt",
	cancelPrompt: "Avbryt uppgraderingsprocessen",
	step3Title: "Uppgradering avbruten",
	step3Html: "Du har avbrutit uppgraderingsprocessen"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Server typ", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Server namn", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Server arbetsyta", type: 'String'},
			{name: 'Status', field: 'status', title: "Synkroniseringsstatus", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Server URL", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Synka dessa tiddler", name: 'sync'}
			]},
	wizardTitle: "Synkronisera med externa servrar och filer",
	step1Title: "Välj de tiddler du vill synkronisera",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "synka",
	syncPrompt: "Synka dessa tiddler",
	hasChanged: "Ändrade medan oansluten",
	hasNotChanged: "Oförändrade medan oansluten",
	syncStatusList: {
		none: {text: "...", color: "transparent", display:null},
		changedServer: {text: "Ändrade på servern", color: '#8080ff', display:null},
		changedLocally: {text: "Ändrad medan oansluten", color: '#80ff80', display:null},
		changedBoth: {text: "Ändrade medan oansluten samt på servern", color: '#ff8080', display:null},
		notFound: {text: "Ej funnen på servern", color: '#ffff80', display:null},
		putToServer: {text: "Sparade uppdatering på servern", color: '#ff80ff', display:null},
		gotFromServer: {text: "Hämtade uppdatering från servern", color: '#80ffff', display:null}
		}
	});

merge(config.commands.closeTiddler,{
	text: "stäng",
	tooltip: "Stäng denna tiddler"});

merge(config.commands.closeOthers,{
	text: "stäng andra",
	tooltip: "Stäng alla andra tiddler"});

merge(config.commands.editTiddler,{
	text: "redigera",
	tooltip: "Redigera denna tiddler",
	readOnlyText: "visa",
	readOnlyTooltip: "Visa denna tiddlers källa"});

merge(config.commands.saveTiddler,{
	text: "klar",
	tooltip: "Spara ändringar för denna tiddler"});

merge(config.commands.cancelTiddler,{
	text: "avbryt",
	tooltip: "Ångra ändringarna för denna tiddler",
	warning: "Är du säker på att du vill överge dina ändringar av '%0'?",
	readOnlyText: "klar",
	readOnlyTooltip: "Visa denna tiddler normalt"});

merge(config.commands.deleteTiddler,{
	text: "ta bort",
	tooltip: "Ta bort denna tiddler",
	warning: "Är du säker på att du vill ta bort '%0'?"});

merge(config.commands.permalink,{
	text: "permalänk",
	tooltip: "Permalänk för denna tiddler"});

merge(config.commands.references,{
	text: "referenser",
	tooltip: "Visa tiddler som länkar till denna",
	popupNone: "Inga referenser"});

merge(config.commands.jump,{
	text: "hoppa",
	tooltip: "Hoppa till en annan öppen tiddler"});

merge(config.commands.syncing,{
	text: "synkar",
	tooltip: "Kontrollera synkroniserav av denna tiddler med en server eller extern fil",
	currentlySyncing: "<div>Synkar nu via <span class='popupHighlight'>'%0'</span> till:</"+"div><div>server: <span class='popupHighlight'>%1</span></"+"div><div>arbetsyta: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Synkar inte nu",
	captionUnSync: "Sluta synkronisera denna tiddler",
	chooseServer: "Synkronisera denna tiddler med en annan server:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "fält",
	tooltip: "Visa de utökade fälten för denna tiddler",
	emptyText: "Det finns inga utökade fält för denna tiddler",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Fält", type: 'String'},
			{name: 'Value', field: 'value', title: "Värde", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[KomIgång]]",
	MainMenu: "[[KomIgång]]\n\n\n^^~TiddlyWiki version <<version>>\n© 2007 [[UnaMesa|http://www.unamesa.org/]]^^",
	TranslatedGettingStarted: "För att komma igång med denna tomma TiddlyWiki, måste du ändra följande tiddler:\n* SiteTitle & SiteSubtitle: Titel och undertitel för platsen, så som visas ovan (efter att du sparat, visas de även i din webbläsares titelrad)\n* MainMenu: Menyn (vanligtvid till vänster)\n* DefaultTiddlers: Innehåller namnen på de tiddler som du vill ska visas när TiddlyWiki öppnas\nDu behöver också ange ditt användarnamn för signering av dina redigeringar: <<option txtUserName>>",
	SiteTitle: "Min TiddlyWiki",
	SiteSubtitle: "en återanvändbar icke-linjär personlig webbanteckningsbok",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Dessa inställningar avanvändargränssnittet för TiddlyWiki sparas i din webbläsare\n\nDitt användar namn för signering av dina redigeringar. Skriv det som ett WikiOrd (t.ex. JohanSvensson)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Spara säkerhetskopior\n<<option chkAutoSave>> Autosparning\n<<option chkRegExpSearch>> Sökning med reguljära uttryck\n<<option chkCaseSensitiveSearch>> Skiftlägeskänslig sökning\n<<option chkAnimate>> Slå på animationer\n\n----\nSe även [[AvanceradeInställningar|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY" "journal">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "inställningar \u00bb" "Ändra TiddlyWikis avancerade inställningar">>',
	SideBarTabs: '<<tabs txtMainTab "Tidslinje" "Tidslinje" TabTimeline "Alla" "Alla tiddler" TabAll "Märkord" "Alla märkord" TabTags "Fler" "Fler listor" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Saknade" "Saknade tiddler" TabMoreMissing "Föräldralösa" "Föräldralösa tiddler" TabMoreOrphans "Skuggade" "Skuggade tiddler" TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "Denna skugg-tiddler möjliggör tillgågn till flera avancerade inställningar",
	ColorPalette: "Dessa värden i denna skugg-tiddler bestämmer färgschemat för ~TiddlyWikis användargränssnitt",
	DefaultTiddlers: "De tiddlers som listas i denna skugg-tiddler kommer automatiskt att visas när ~TiddlyWiki startar",
	EditTemplate: "HTML-mallen i denna skugg-tiddler bestämmer hur tiddler ser ut medan de redigeras",
	GettingStarted: "Denna skugg-tiddler tillhandahåller grundläggande användarinstruktioner",
	ImportTiddlers: "Denna skugg-tiddler tillhandahåller tillgång till att importa tiddler",
	MainMenu: "Denna skugg-tiddler används som innehållet för huvudmenyn i kolumnen till vänster på skärmen",
	MarkupPreHead: "Denna tiddler infogas i början av <head>-sektionen av TiddlyWikins HTML-fil",
	MarkupPostHead: "Denna tiddler infogas i slutet av <head->sektionen av TiddlyWikins HTML-fil",
	MarkupPreBody: "Denna tiddler infogas i början av <body>-sektionen av TiddlyWikins HTML-fil",
	MarkupPostBody: "Denna tiddler infogas i slutet av <body>-sektionen av TiddlyWikins HTML-fil, direkt efter skript-blocket",
	OptionsPanel: "Denna skugg-tiddler används som innehållet för inställningspanelen i högerkanten",
	PageTemplate: "HTML-mallen i denna skugg-tiddler bestämmer det övergripande ~TiddlyWiki utseendet",
	PluginManager: "Denna skugg-tiddler tillhandahåller tillgång till insticksprograms hanteraren",
	SideBarOptions: "Denna skugg-tiddler används som innehållet för inställningar i inställningsspanelen i högerkanten",
	SideBarTabs: "Denna skugg-tiddler används som innehållet för flikpanelen i högerkanten",
	SiteSubtitle: "Denna skugg-tiddler används som den andra delen av sidans titel",
	SiteTitle: "Denna skugg-tiddler används som första delen av sidans titel",
	SiteUrl: "Denna skugg-tiddler ska sättas till den fullständiga URL där TiddlyWikin ska publiceras",
	StyleSheetColors: "Denna skugg-tiddler innehåller CSS-definitionerna som påverkar färgen för element på sidan. ''ÄNDRA INTE DENNA TIDDLER'', gör istället dina ändringar i skugg-tiddlern StyleSheet",
	StyleSheet: "Denna tiddler kan innehålla anpassade CSS-definitioner",
	StyleSheetLayout: "Denna skugg-tiddler innehåller CSS-definitioner som påverkar utseende för element på sidan. ''ÄNDRA INTE DENNA TIDDLER'', gör istället dina ändringar i skugg-tiddlern StyleSheet",
	StyleSheetLocale: "Denna skugg-tiddler innehåller CSS-definitioner som påverkar översättningen",
	StyleSheetPrint: "Denna skugg-tiddler innehåller CSS-definitions för utskrift",
	TabAll: "Denna skugg-tiddler innehåller innehållet för fliken 'Alla' i högerkanten",
	TabMore: "Denna skugg-tiddler innehåller innehållet för fliken 'Fler' i högerkanten",
	TabMoreMissing: "Denna skugg-tiddler innehåller innehållet för fliken 'Saknas' i högerkanten",
	TabMoreOrphans: "Denna skugg-tiddler innehåller innehållet för fliken 'Föräldralösa' i högerkanten",
	TabMoreShadowed: "Denna skugg-tiddler innehåller innehållet för fliken 'Skuggade' i högerkanten",
	TabTags: "Denna skugg-tiddler innehåller innehållet för fliken 'Märkord' i högerkanten",
	TabTimeline: "Denna skugg-tiddler innehåller innehållet för fliken 'Tidslinje' i högerkanten",
	ToolbarCommands: "Denna skugg-tiddler bestämmer vilka kommando som syns i tiddler-verktygsrader",
	ViewTemplate: "HTML-mallen i denna skugg-tiddler bestämmer hur tiddler ser ut"
	});

//}}}
