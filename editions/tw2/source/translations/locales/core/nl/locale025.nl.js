/***
|''Name:''|DutchTranslationPlugin|
|''Description:''|Translation of TiddlyWiki translatable strings into Dutch|
|''Author:''|Ton van Rooijen (tonsweb (at) xs4all (dot) nl)|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/nl/locale.nl.js|
|''Version:''|0.2.5|
|''Date:''|July 11, 2007|
|''Version history:''|This version is applicable to all TiddlyWikis as of version 2.2.0 until further notice.|
| June 20, 2007 v0.2.0: |First draft translation in Dutch based on Core-version 2.2 of "locale.en.js" (v0.3.3/v0.3.5).|
| June 24, 2007 v0.2.1: |Workaround implemented for the translation problem as described in Ticket #217. Translations for shadow-tiddlers "GettingStarted" (HierBeginnen)  and "OptionsPanel" added for this translation.|
| July 1, 2007 v0.2.2: |Translation of the year string YYYY in date-formats (in Dutch it should be JJJJ) doesn't work; so I had to undo that. Extra comments added with all date-strings. Several miscellaneous improvements and corrections applied.||
| July 4, 2007 v0.2.3: |According to ISO 639-1 the language-identification code should be "nl" instead of "du". So I changed the config.locale and the filename of this file accordingly. TW version and Copyright in MainMenu. Misc. corrections.||
| July 6, 2007 v0.2.4: |CoreVersion was mistakenly documented as "2.1.3" and so it was assumed to be applicable as of TW 2.1.3. Testing proved otherwise: applicability is only for all 2.2-versions. Synced with new "locale.en.js" (v0.3.6)||
| July 11, 2007 v0.2.5: |The original translation of "backstage" changed from "redactiescherm" to "managementmenu" which better covers the functionality.||
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev, or directly to the author.|
|''Acknowledgements:''|Special thanks to "Lourens van Quadsk8.nl" who created the very first Dutch translation, back in midst 2005 for versions 2.0.n, parts of which were gratefully reused in here.|
|''License:''|[[Creative Commons Attribution-ShareAlike 2.5 License|http://creativecommons.org/licenses/by-sa/2.5/]]|
|''~CoreVersion:''|2.2|
***/
//{{{
//-- Translatable strings
//-- Strings in "double quotes" should be translated (except for "DD MMM YYYY"); strings in 'single quotes' should be left alone
config.locale = "nl"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
        merge(config.options,{txtUserName: "JouwNaam"}); 

merge(config.tasks,{
	save: {text: "opslaan", tooltip: "Opslaan van alle wijzigingen in deze TiddlyWiki", action: saveChanges},
	sync: {text: "sync", tooltip: "Synchroniseer wijzigingen met andere TiddlyWiki bestanden en servers", content: '<<sync>>'},
	importTask: {text: "import", tooltip: "Importeer tiddlers en plugins uit andere TiddlyWiki bestanden en servers", content: '<<importTiddlers>>'},
	tweak: {text: "tweak", tooltip: "Aanpassen van verschijning en gedrag van TiddlyWiki", content: '<<options>>'},
	plugins: {text: "plugins", tooltip: "Beheer de geïnstalleerde plugins", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Jouw naam voor het signeren van je wijzigingen",
	chkRegExpSearch: "JavaScript expressies toestaan in zoekopdrachten",
	chkCaseSensitiveSearch: "Hoofdlettergevoelig zoeken",
	chkAnimate: "Activeer animaties",
	chkSaveBackups: "Bewaar een backup bij het opslaan van wijzigingen",
	chkAutoSave: "Automatisch opslaan van wijzigingen",
	chkGenerateAnRssFeed: "Genereer een RSS-feed bij het opslaan van wijzigingen",
	chkSaveEmptyTemplate: "Genereer een lege TW-template bij de opdracht 'opslaan'",
	chkOpenInNewWindow: "Open externe links in een nieuw venster",
	chkToggleLinks: "Door te klikken op links van reeds geopende tiddlers, zullen deze worden gesloten",
	chkHttpReadOnly: "Verberg wijzigingsfunctionaliteit wanneer bekeken via HTTP",
	chkForceMinorUpdate: "Handhaaf de oorspronkelijke auteur's naam en datum bij het wijzigen van tiddlers (bijv. bij het maken van kleine correcties)",
	chkConfirmDelete: "Vraag om bevestiging voordat een tiddler wordt verwijderd",
	chkInsertTabs: "Tab-key voegt tabs in in plaats van naar het volgende veld te springen",
	txtBackupFolder: "Mapnaam om backups in op te slaan",
	txtMaxEditRows: "Maximum aantal regels in het wijzigingsvenster",
	txtFileSystemCharSet: "Default characterset bij het opslaan (alleen voor Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Problemen bij het laden van plugins. Zie PluginManager voor details",
	pluginError: "Fout: %0",
	pluginDisabled: "Niet uitgevoerd, want uitgeschakeld middels het 'systemConfigDisable' label",
	pluginForced: "Uitgevoerd, want geforceerd middels het 'systemConfigForce' label",
	pluginVersionError: "Niet uitgevoerd want deze plugin is voor een jongere versie van TiddlyWiki",
	nothingSelected: "Niets geselecteerd. Je moet eerst een of meerdere items selecteren",
	savedSnapshotError: "Blijkbaar is deze TiddlyWiki eerder foutief opgeslagen. Kijk op http://www.tiddlywiki.com/#DownloadSoftware voor details",
	subtitleUnknown: "(onbekend)",
	undefinedTiddlerToolTip: "De tiddler '%0' bestaat nog niet",
	shadowedTiddlerToolTip: "De tiddler '%0' bestaat nog niet, maar er is wel een voorgedefinieerde schaduw-versie",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Externe link naar %0",
	noTags: "Er zijn geen tiddlers met een label",
	notFileUrlError: "Je moet deze TiddlyWiki eerst opslaan als een bestand, voordat je wijzigingen kunt opslaan",
	cantSaveError: "Opslaan van wijzigingen is niet mogelijk. Mogelijke oorzaken zijn o.a.:\n- je browser ondersteunt dat niet (Firefox, Internet Explorer, Safari en Opera kunnen opslaan mits juist geconfigureerd)\n- de padnaam naar je TiddlyWiki bestand bevat ongeldige tekens\n- je TiddlyWiki bestand is verplaatst of hernoemd",
	invalidFileError: "Het originele bestand '%0' is geen geldige TiddlyWiki",
	backupSaved: "Backup opgeslagen",
	backupFailed: "Opslaan van backup-bestand mislukt",
	rssSaved: "RSS-feed opgeslagen",
	rssFailed: "Opslaan van RSS-feed-bestand mislukt",
	emptySaved: "Leeg TiddlyWki template-bestand opgeslagen",
	emptyFailed: "Opslaan van leeg TiddlyWiki template-bestand mislukt",
	mainSaved: "TiddlyWiki bestand opgeslagen",
	mainFailed: "Opslaan van TiddlyWiki bestand mislukt. Je wijzigingen zijn niet bewaard.",
	macroError: "Fout in macro <<\%0>>",
	macroErrorDetails: "Fout tijdens de uitvoering van macro <<\%0>>:\n%1",
	missingMacro: "Die macro bestaat niet",
	overwriteWarning: "Een tiddler met de naam '%0' bestaat al. Klik OK om die te overschrijven",
	unsavedChangesWarning: "WAARSCHUWING! Deze TiddlyWiki bevat niet opgeslagen wijzigingen\n\nKlik OK om op te slaan\nKlik ANNULEREN om de wijzigingen te negeren",
	confirmExit: "--------------------------------\n\nDeze TiddlyWiki bevat niet opgeslagen wijzigingen. Als je doorgaat gaan deze wijzigingen verloren\n\n--------------------------------",
	saveInstructions: "Opslaan",
	unsupportedTWFormat: "Niet ondersteund TiddlyWiki formaat '%0'",
	tiddlerSaveError: "Fout bij het opslaan van tiddler '%0'",
	tiddlerLoadError: "Fout bij het laden van tiddler '%0'",
	wrongSaveFormat: "Opslaan met storage formaat '%0' kan niet. Standaard formaat wordt gebruikt.",
	invalidFieldName: "Ongeldige veldnaam %0",
	fieldCannotBeChanged: "Veld '%0' kan niet worden gewijzigd",
	loadingMissingTiddler: "Bezig om tiddler '%0' op te halen van de '%1' server op:\n\n'%2' in werkruimte '%3'"});

merge(config.messages.messageClose,{
	text: "sluit",
	tooltip: "sluit dit berichtvenster"});

config.messages.backstage = {
	open: {text: "managementmenu", tooltip: "Open het managementmenu voor redactionele taken"},
	close: {text: "sluit", tooltip: "Sluit het managementmenu"},
	prompt: "managementmenu: ",
	decal: {
		edit: {text: "wijzig", tooltip: "Wijzig de inhoud van deze tiddler '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klik voor de volledige tekst van deze tiddler",
	previewUnavailable: "(preview niet beschikbaar)"
};

config.messages.dates.months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november","december"];
config.messages.dates.days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
config.messages.dates.shortMonths = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
config.messages.dates.shortDays = ["zon", "maa", "din", "woe", "don", "vri", "zat"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["e","e","e","e","e","e","e","e","e","e",
		"e","e","e","e","e","e","e","e","e","e",
		"e","e","e","e","e","e","e","e","e","e",
		"e"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "geen labels",
	labelTags: "labels: ",
	openTag: "Open label '%0'",
	tooltip: "Bekijk tiddlers met label '%0'",
	openAllText: "Open alle",
	openAllTooltip: "Open al deze tiddlers",
	popupNone: "Geen andere tiddlers met label '%0'"});

merge(config.views.wikified,{
	defaultText: "De tiddler '%0' bestaat nog niet. Dubbel-klik om hem te maken",
	defaultModifier: "(ontbreekt)",
	shadowModifier: "(ingebouwde schaduw-tiddler)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "aangemaakt"});

merge(config.views.editor,{
	tagPrompt: "Typ labels gescheiden door spaties (gebruik dubbele rechte haakjes voor non-WikiWord-labels), of gebruik bestaande",
	defaultText: "Typ de tekst voor '%0'"});

merge(config.views.editor.tagChooser,{
	text: "labels",
	tooltip: "Kies bestaande labels om aan deze tiddler toe te voegen",
	popupNone: "Er zijn geen labels gedefinieerd",
	tagTooltip: "Voeg het label '%0' toe"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "zoek",
	prompt: "Zoek binnen deze TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 tiddlers gevonden met de tekst %1",
	failureMsg: "Geen tiddlers gevonden met de tekst %0"});

merge(config.macros.tagging,{
	label: "labelverwijzingen: ",
	labelNotTag: "geen labelverwijzingen",
	tooltip: "Lijst van tiddlers gelabeld met '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"}); // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Bekijk tiddlers gelabeld met '%0'",
	noTags: "Er zijn geen gelabelde tiddlers"});

config.macros.list.all.prompt = "Alle tiddlers in alfabetische volgorde";
config.macros.list.missing.prompt = "Tiddlers waarnaar wordt gelinkt maar die niet bestaan";
config.macros.list.orphans.prompt = "Tiddlers waarnaar vanuit geen enkele andere tiddler wordt gelinkt";
config.macros.list.shadowed.prompt = "Schaduw-tiddlers met standaard (default) inhoud";
config.macros.list.touched.prompt = "Tiddlers die lokaal zijn gewijzigd";

merge(config.macros.closeAll,{
	label: "sluit alles",
	prompt: "Sluit alle weergegeven tiddlers (behalve die open staan voor wijziging)"});

merge(config.macros.permaview,{
	label: "permaview",
	prompt: "Link naar een URL die alle tiddlers ophaalt die nu open staan"});

merge(config.macros.saveChanges,{
	label: "wijzigingen opslaan",
	prompt: "Opslaan van alle wijzigingen in deze TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "nieuwe tiddler",
	prompt: "Maak een nieuwe tiddler",
	title: "Nieuwe tiddler",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "nieuwe blog-tiddler",
	prompt: "Maak een nieuwe tiddler met de datum van vandaag",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Geavanceerde opties aanpassen",
	step1Title: "Deze opties worden bewaard in een cookie in je browser",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Bekijk onbekende opties</input>",
	unknownDescription: "//(onbekend)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Optie", type: 'String'},
			{name: 'Description', field: 'description', title: "Beschrijving", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Naam", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Beheer plugins",
	step1Title: "Thans geladen plugins",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Deze plugin is niet uitgevoerd want hij is pas na startup geïnstalleerd)",
	noPluginText: "Er zijn geen plugins geïnstalleerd",
	confirmDeleteText: "Weet je zeker dat je deze plugins wilt verwijderen:\n\n%0",
	removeLabel: "verwijder systemConfig label",
	removePrompt: "Verwijder systemConfig label",
	deleteLabel: "verwijder",
	deletePrompt: "Verwijder deze tiddlers definitief",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Grootte", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Verplicht", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Uitgeschakeld", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Geladen", type: 'Boolean', trueText: "Ja", falseText: "Nee"},
			{name: 'Startup Time', field: 'startupTime', title: "Startup Tijd", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Fout", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "meer",
	morePrompt: "Laat nog meer commando's zien"
	});

merge(config.macros.refreshDisplay,{
	label: "ververs",
	prompt: "Beeld de gehele TiddlyWiki opnieuw af"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Je kunt niet importeren in een alleen-lezen TiddlyWiki bestand. Open je TiddlyWiki met een file://-URL",
	wizardTitle: "Importeer tiddlers vanuit een ander bestand of server",
	step1Title: "Stap 1: Stel vast waar de server of het TiddlyWiki bestand zich bevindt",
	step1Html: "Specificeer het type server: <select name='selTypes'><option value=''>Kies...</option></select><br>Typ de URL of padnaam hier: <input type='text' size=50 name='txtPath'><br>...of navigeer naar het bestand: <input type='file' size=50 name='txtBrowse'><br><hr>...of selecteer een voor-gedefinieerde bron: <select name='selFeeds'><option value=''>Kies...</option></select>",
	openLabel: "open",
	openPrompt: "Open de verbinding naar dit bestand of deze server",
	openError: "Het TiddlyWiki bestand kon niet worden gevonden",
	statusOpenHost: "Bezig de host te verbinden",
	statusGetWorkspaceList: "Verkrijg de lijst van beschikbare werkruimtes",
	step2Title: "Stap 2: Kies de werkruimte",
	step2Html: "Typ de naam van een werkruimte: <input type='text' size=50 name='txtWorkspace'><br>...of selecteer een werkruimte: <select name='selWorkspace'><option value=''>Kies...</option></select>",
	cancelLabel: "annuleer",
	cancelPrompt: "Annuleer deze import",
	statusOpenWorkspace: "Bezig de werkruimte te openen",
	statusGetTiddlerList: "Verkrijg de lijst van beschikbare tiddlers",
	step3Title: "Stap 3: Kies de tiddlers die je wilt importeren",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Onthoud de link naar deze tiddlers zodat je ook toekomstige wijzigingen eenvoudig zult kunnen synchroniseren</input><br><input type='checkbox' name='chkSave'>Bewaar de details van deze server in een 'systemServer'-tiddler genaamd:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "import",
	importPrompt: "Importeer deze tiddlers",
	confirmOverwriteText: "Weet je zeker dat je deze tiddlers wilt overschrijven:\n\n%0",
	step4Title: "Stap 4: Bezig %0 tiddler(s) te importeren",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "klaar",
	donePrompt: "Sluit deze wizard af",
	statusDoingImport: "Bezig tiddlers te importeren",
	statusDoneImport: "Alle tiddlers zijn geïmporteerd",
	systemServerNamePattern: "%2 op %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "De tiddler '%0' bestaat al. Klik 'OK' om hem te overschrijven met de gegevens van deze server, of 'ANNULEER' om hem ongewijzigd te laten",
	serverSaveTemplate: "|''Typ:''|%0|\n|''URL:''|%1|\n|''Werkruimte:''|%2|\n\nDeze tiddler is automatisch aangemaakt om de gegevens van deze server vast te leggen",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Grootte", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Labels", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Server type", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Server host", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Server werkruimte", type: 'String'},
			{name: 'Status', field: 'status', title: "Synchronisatie status", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Server URL", text: "Bekijk", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Synchroniseer deze tiddlers", name: 'sync'}
			]},
	wizardTitle: "Synchroniseer met externe servers en bestanden",
	step1Title: "Kies de tiddlers die je wilt synchroniseren",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "sync",
	syncPrompt: "Synchroniseer deze tiddlers",
	hasChanged: "Gewijzigd zonder verbinding",
	hasNotChanged: "Ongewijzigd zonder verbinding",
	syncStatusList: {
		none: {text: "...", color: "geen"},
		changedServer: {text: "Gewijzigd op de server", color: '#80ff80'},
		changedLocally: {text: "Gewijzigd zonder verbinding", color: '#80ff80'},
		changedBoth: {text: "Gewijzigd op de server zonder verbinding", color: '#ff8080'},
		notFound: {text: "Niet gevonden op de server", color: '#ffff80'},
		putToServer: {text: "Wijziging opgeslagen op de server", color: '#ff80ff'},
		gotFromServer: {text: "Wijziging van de server opgehaald", color: '#80ffff'}
		}
	});

merge(config.macros.annotations,{
	});

merge(config.commands.closeTiddler,{
	text: "sluit",
	tooltip: "Sluit deze tiddler"});

merge(config.commands.closeOthers,{
	text: "sluit andere",
	tooltip: "Sluit alle andere tiddlers"});

merge(config.commands.editTiddler,{
	text: "wijzig",
	tooltip: "Wijzig de inhoud van deze tiddler",
	readOnlyText: "bekijk",
	readOnlyTooltip: "Bekijk de broncode van deze tiddler"});

merge(config.commands.saveTiddler,{
	text: "opslaan",
	tooltip: "Sla de wijzigingen in deze tiddler op"});

merge(config.commands.cancelTiddler,{
	text: "annuleer",
	tooltip: "Negeer de wijzigingen in deze tiddler",
	warning: "Weet je zeker dat de wijzigingen in '%0' niet moeten worden opgeslagen?",
	readOnlyText: "klaar",
	readOnlyTooltip: "Bekijk deze tiddler weer in de normale weergave"});

merge(config.commands.deleteTiddler,{
	text: "verwijder",
	tooltip: "Verwijder deze tiddler",
	warning: "Weet je zeker dat je tiddler '%0' permanent wilt verwijderen?"});

merge(config.commands.permalink,{
	text: "permalink",
	tooltip: "Een URL die rechtstreeks naar deze tiddler verwijst"});

merge(config.commands.references,{
	text: "verwijzingen",
	tooltip: "Bekijk tiddlers die naar deze tiddler verwijzen",
	popupNone: "Geen verwijzingen"});

merge(config.commands.jump,{
	text: "spring",
	tooltip: "Spring naar een andere open tiddler"});

merge(config.commands.syncing,{
	text: "synchroniseren",
	tooltip: "Beheer de synchronisatie van deze tiddler met een server of extern bestand",
	currentlySyncing: "<div>Bezig met synchroniseren via <span class='popupHighlight'>'%0'</span> naar:</"+"div><div>host: <span class='popupHighlight'>%1</span></"+"div><div>werkruimte: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Geen synchronisatie aan de gang",
	captionUnSync: "Annuleer de synchronisatie van deze tiddler",
	chooseServer: "Synchroniseer deze tiddler met een andere server:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "velden",
	tooltip: "Bekijk de speciale velden van deze tiddler",
	emptyText: "Er zijn geen speciale velden voor deze tiddler",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Veld", type: 'String'},
			{name: 'Value', field: 'value', title: "Waarde", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[HierBeginnen]]",
	MainMenu: "[[HierBeginnen]]\n\n\n^^~TiddlyWiki versie <<version>>\n© 2007 [[UnaMesa|http://www.unamesa.org/]]^^",
	SiteTitle: "Mijn TiddlyWiki",
	SiteSubtitle: "een herbruikbaar niet lineair persoonlijk notitieboek voor het web",
	SiteUrl: "http://www.tiddlywiki.com/",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "TiddlyWiki instellingen" "Wijzig geavanceerde TiddlyWiki instellingen">>', // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	SideBarTabs: '<<tabs txtMainTab "Op datum" "Tiddler chronologie" TabTimeline "Alle" "Alle tiddlers" TabAll "Labels" "Alle labels" TabTags "Meer" "Meer lijsten" TabMore>>',
/***
070624: Translations for the next 2 shadow-tiddlers were missing from the base English template. Added in here for the Dutch translation.
***/
	HierBeginnen: "Om te beginnen met deze blanco TiddlyWiki, vul je hierachter je naam in, zodat vanaf dat moment al jouw wijzigingen daarmee zullen worden gesigneerd: <<option txtUserName>>\n\nVervolgens kun je de onderstaande tiddlers gaan aanpassen:\n* SiteTitle & SiteSubtitle: De naam en ondertitel van de site, zoals hierboven wordt weergegeven (na het bewaren, zullen ze ook in de titelbalk van de browser verschijnen)\n* MainMenu: Het hoofdmenu (gebruikelijk aan de linkerkant)\n* DefaultTiddlers: Bevat de namen van alle tiddlers die je wilt laten verschijnen zodra deze TiddlyWiki wordt geopend.\n\nNatuurlijk kun je bovenstaande tiddlers ook later nog steeds aanpassen.\n\nEn nu ben je klaar om je eigen inhoud aan deze website te gaan geven.\nKlik bijvoorbeeld maar eens in de rechter kolom op ''nieuwe tiddler'' en typ een eigen stukje tekst in het venster dat wordt geopend.\nKlik vervolgens op ''opslaan'' daar vlak boven, en kijk, je eerste hoofdstukje (tiddler) is gemaakt (compleet met jouw naam en de datum)!\n\nZo simpel is nou het werken met TiddlyWiki.",
	OptionsPanel: "Met deze ~TiddlyWiki Instellingen kun je je persoonlijke voorkeuren instellen, die door je browser worden onthouden in een cookie.\n\nGeef hier je gebruikersnaam op voor het signeren van jouw teksten en andere inhoud:\n<<option txtUserName>>\n<<option chkSaveBackups>> Bewaar backups\n<<option chkAutoSave>> Gebruik Autosave\n<<option chkRegExpSearch>> Zoek met ~JavaScript expressies\n<<option chkCaseSensitiveSearch>> Zoek hoofdlettergevoelig\n<<option chkAnimate>> Activeer animaties\n\nZie ook [[Geavanceerde opties|AdvancedOptions]]",
	TabMore: '<<tabs txtMoreTab "Ontbrekend" "Ontbrekende tiddlers" TabMoreMissing "Wezen" "Tiddlers waar niets naar verwijst" TabMoreOrphans "Schaduw" "Schaduw-tiddlers" TabMoreShadowed>>'});

merge(config.annotations,{
	AdvancedOptions: "Deze schaduw-tiddler geeft toegang tot diverse geavanceerde TiddlyWiki opties",
	ColorPalette: "De waarden in deze schaduw-tiddler bepalen het kleuren-schema van de ~TiddlyWiki gebruikers-interface",
	DefaultTiddlers: "De tiddlers genoemd in deze schaduw-tiddler worden automatisch weergegeven als ~TiddlyWiki opstart",
	EditTemplate: "De HTML template in deze schaduw-tiddler bepaalt hoe tiddlers er uitzien in wijzigingsmodus",
	GettingStarted: "Deze schaduw-tiddler bevat de allereerste gebruiks instructies",
	ImportTiddlers: "Deze schaduw-tiddler geeft toegang tot de tiddler import faciliteit",
	MainMenu: "Deze schaduw-tiddler wordt gebruikt om de inhoud te bepalen van het hoofdmenu in de linker kolom van het scherm",
	MarkupPreHead: "Deze tiddler wordt ingevoegd bovenaan de <head> sectie van het TiddlyWiki HTML bestand",
	MarkupPostHead: "Deze tiddler wordt ingevoegd onderaan de <head> sectie van het TiddlyWiki HTML bestand",
	MarkupPreBody: "Deze tiddler wordt ingevoegd bovenaan de <body> sectie van het TiddlyWiki HTML bestand",
	MarkupPostBody: "Deze tiddler wordt ingevoegd onderaan de <body> sectie van het TiddlyWiki HTML bestand, onmiddellijk voor het script blok",
	OptionsPanel: "Deze schaduw-tiddler wordt gebruikt voor de inhoud van het instellingen paneel in de rechter kolom op het scherm",
	PageTemplate: "De HTML template in deze schaduw-tiddler bepaalt de algemene ~TiddlyWiki layout",
	PluginManager: "Deze schaduw-tiddler geeft toegang tot de plugin manager",
	SideBarOptions: "Deze schaduw-tiddler wordt gebruikt voor de inhoud van het instellingen paneel in de rechter kolom op het scherm",
	SideBarTabs: "Deze schaduw-tiddler wordt gebruikt voor de inhoud van het tabs paneel in de rechter kolom op het scherm",
	SiteSubtitle: "Deze schaduw-tiddler wordt gebruikt als een subdeel van de titel van je webpagina",
	SiteTitle: "Deze schaduw-tiddler wordt gebruikt als het hoofddeel van de titel van je webpagina",
	SiteUrl: "In deze schaduw-tiddler moet de volledige URL worden genoteerd waaronder deze TiddlyWiki wordt gepubliceerd",
	StyleSheetColours: "Deze schaduw-tiddler bevat CSS definities met betrekking tot de kleur van pagina elementen",
	StyleSheet: "Deze tiddler kan persoonlijke CSS definities bevatten",
	StyleSheetLayout: "Deze schaduw-tiddler bevat CSS definities met betrekking tot de layout van pagina elementen",
	StyleSheetLocale: "Deze schaduw-tiddler bevat CSS definities met betrekking tot localisatie",
	StyleSheetPrint: "Deze schaduw-tiddler bevat CSS definities voor printen",
	TabAll: "Deze schaduw-tiddler bevat de inhoud van de 'Alle'-tab in de rechter zijkolom",
	TabMore: "Deze schaduw-tiddler bevat de inhoud van de 'Meer'-tab in de rechter zijkolom",
	TabMoreMissing: "Deze schaduw-tiddler bevat de inhoud van de 'Ontbrekend'-tab in de rechter zijkolom",
	TabMoreOrphans: "Deze schaduw-tiddler bevat de inhoud van de 'Wezen'-tab in de rechter zijkolom",
	TabMoreShadowed: "Deze schaduw-tiddler bevat de inhoud van de 'Schaduw'-tab in de rechter zijkolom",
	TabTags: "Deze schaduw-tiddler bevat de inhoud van de 'Labels'-tab in de rechter zijkolom",
	TabTimeline: "Deze schaduw-tiddler bevat de inhoud van de 'Op datum'-tab in de rechter zijkolom",
	ViewTemplate: "De HTML template in deze schaduw-tiddler bepaalt hoe tiddlers er uit zien"
	});

//}}}
