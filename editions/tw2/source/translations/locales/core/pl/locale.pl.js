/***
|''Name:''|PolishTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Polish|
|''Author:''|Marcin Gedlek (psorek23 (at) gmail (dot) com)|
|''Source:''|http://members.lycos.co.uk/psorek/|
|''Subversion:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/pl/locale.pl.js|
|''Version:''|0.9.0|
|''Date:''|Jan 14, 2007|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev|
|''License:''|[[Creative Commons Attribution-ShareAlike 2.5 License|http://creativecommons.org/licenses/by-sa/2.5/]]|
|''~CoreVersion:''|2.1.0|

// Na podstawie wersji (based on version):
// TiddlyWiki 2.1.2a - German Translation (r811)
// Maintainer: Besim Karadeniz besim (at) karadeniz (dot ) de
// Web: www.karadeniz.de/tiddlywiki/
***/

/*{{{*/
// Translateable strings
// ---------------------

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "pl"; // W3C language tag

if (config.options.txtUserName == "YourName")
	merge(config.options,{txtUserName: "TwojeImie"});

config.tasks = {
	tidy: {text: "tidy up", tooltip: "Make bulk changes across groups of tiddlers", content: 'Coming soon...\n\nThis tab will allow bulk operations on tiddlers, and tags. It will be a generalised, extensible version of the plugins tab'},
	sync: {text: "sync", tooltip: "Synchronise changes with other TiddlyWiki files and servers", content: '<<sync>>'},
	importTask: {text: "import", tooltip: "Import tiddlers and plugins from other TiddlyWiki files and servers", content: '<<importTiddlers>>'},
	copy: {text: "copy", tooltip: "Copy tiddlers to other TiddlyWiki files and servers", content: 'Coming soon...\n\nThis tab will allow tiddlers to be copied to remote servers'},
	plugins: {text: "plugins", tooltip: "Manage installed plugins", content: '<<plugins>>'}
};

merge(config.messages,{
	customConfigError: "Wystąpiły problemy podczas wczytywania pluginów. Zobacz więcej szczegółów w PluginManager ",
	pluginError: "Błąd: %0",
	pluginDisabled: "Nie uruchomione, wyłączone w tagu 'systemConfigDisable'",
	pluginForced: "Uruchomione, wymuszone poprzez tag 'systemConfigForce'",
	pluginVersionError: "Nie uruchomione, ten plugin wymaga nowszej wersji TiddlyWiki",
	nothingSelected: "Nic nie zaznaczono. Musisz zaznaczyć jedną lub więcej rzeczy",
	savedSnapshotError: "TiddlyWiki została najprawdopodobniej niepoprawnie zapisana. Zobacz http://www.tiddlywiki.com/#DownloadSoftware",
	subtitleUnknown: "(nieznany)",
	undefinedTiddlerToolTip: "Notatka '%0' jeszcze nie istnieje",
	shadowedTiddlerToolTip: "Notatka '%0' jeszcze nie istnieje, ale jej nazwa jest zarezerowowana",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Zewnętrzny link do %0",
	noTags: "Brak tagów w notatkach",
	notFileUrlError: "Musisz najpierw zapisać TiddlyWiki aby wprowadzać zmiany",
	cantSaveError: "Nie można zapisać zmian. Możliwe przyczyny:\n- Twoja przeglądarka nie obsługuje zapisywania (Firefox, Internet Explorer, Safari i Opera powinny działać)\n- ścieżka do twojej TiddlyWiki zawiera niepoprawne znaki\n- Plik TiddlyWiki został przeniesiony lub zmienił nazwe",
	invalidFileError: "Orginalny plik '%0' nie jest prawidłowym plikiem TiddlyWiki",
	backupSaved: "Kopia zapasowa zapisana",
	backupFailed: "Nie udało się zapisać kopii zapasowej",
	rssSaved: "RSS zapisane",
	rssFailed: "Nie udało się zapisać RSS",
	emptySaved: "Pusty plik zapisany",
	emptyFailed: "Nie udało się zapisać pustego pliku",
	mainSaved: "Plik TiddlyWiki zapisany",
	mainFailed: "Nie udało się zapisać pliku TiddlyWiki. Twoje zmiany nie zostały zapisane",
	macroError: "Błąd w makro <<%0>>",
	macroErrorDetails: "Błąd wykonywania makro <<%0>>:\n%1",
	missingMacro: "Nie ma takiego makro",
	overwriteWarning: "Notatka '%0' już istnieje. Kliknij OK aby ją zastąpić",
	unsavedChangesWarning: "UWAGA! Niezapisane zmiany w TiddlyWiki\n\n kliknij OK aby zapisać\nChoose ANULUJ aby niezapisywać",
	confirmExit: "--------------------------------\n\nNiezapisane zmiany w TiddlyWiki. jeżeli będziesz kontynuował stracisz je\n\n--------------------------------",
	saveInstructions: "ZapiszZmiany",
	unsupportedTWFormat: "Nieobsługiwany format TiddlyWiki '%0'",
	tiddlerSaveError: "Błąd przy zapisywaniu notatki '%0'",
	tiddlerLoadError: "Błąd podczas wczytywania notatki '%0'",
	wrongSaveFormat: "Nie można zapisać przy pomocy tego formatu '%0'. Zapisywanie w standardowym formacie.",
	invalidFieldName: "Zła nazwa pliku %0",
	fieldCannotBeChanged: "Błąd '%0' nie może być zmieniony",
	backstagePrompt: "backstage: "});

merge(config.messages.messageClose,{
	text: "Zapisano",
	tooltip: "TiddlyWiki zapisano"});

config.messages.dates.months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Paźdźiernik", "Listopad","Grudzień"];
config.messages.dates.days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
config.messages.dates.shortMonths = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
config.messages.dates.shortDays = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.views.wikified.tag,{
	labelNoTags: "brak tagów",
	labelTags: "tagi: ",
	openTag: "Otwórz tag '%0'",
	tooltip: "Pokarz notatki z tagiem '%0'",
	openAllText: "Otwórz wszystko",
	openAllTooltip: "Otwórz wszystko z tej notatki",
	popupNone: "Żadna inna notatka nie ma tagu '%0'"});

merge(config.views.wikified,{
	defaultText: "Notatka '%0' nie istnieje. kliknij dwukrotnie aby ją utworzyć",
	defaultModifier: "(brakujący)",
	shadowModifier: "(wbudowana notatka)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "utworzono"});

merge(config.views.editor,{
	tagPrompt: "Wprowadź tagi oddzielone spacjami, [[użyj podwójnych nawiasów]]",
	defaultText: "Wprowadź tekst dla '%0'"});

merge(config.views.editor.tagChooser,{
	text: "tagi",
	tooltip: "Wybierz tag aby go dodać do notatki",
	popupNone: "Brak zdefiniowanych tagów",
	tagTooltip: "Dodaj tag '%0'"});

merge(config.macros.search,{
	label: "szukaj",
	prompt: "Przeszukaj TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 Znaleziono notatkę pasującą do %1",
	failureMsg: "Brak pasującej notatki %0"});

merge(config.macros.tagging,{
	label: "tagi: ",
	labelNotTag: "brak taggów",
	tooltip: "Lista notatek oznaczonych tagiem '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});

merge(config.macros.allTags,{
	tooltip: "Pokarz notatki z tagami '%0'",
	noTags: "Brak notatek z tagami"});

config.macros.list.all.prompt = "Notatki w porządku alfabetycznym";
config.macros.list.missing.prompt = "Notatki do których prowadzi jakiś link ale nie istnieją";
config.macros.list.orphans.prompt = "Notatki do których nie istnieje odwołanie";
config.macros.list.shadowed.prompt = "Notatki z domyślnymi ustawieniami";

merge(config.macros.closeAll,{
	label: "Zamknij wszystkie",
	prompt: "Zamyka wszystkie widoczne notatki (poza tymi które są edytowane)"});

merge(config.macros.permaview,{
	label: "Stały widok",
	prompt: "Pozwala otworzyć TiddlyWiki w takim stanie w jakim znajduje się obecnie"});

merge(config.macros.saveChanges,{
	label: "zapisz zmiany",
	prompt: "Zapisuje wszystkie notatki w TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "nowa notatka",
	prompt: "Tworzy nową notatkę",
	title: "Nowa Notatka",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "nowy dziennik",
	prompt: "Tworzy nową notatkę z aktualną datą i godziną",
	accessKey: "J"});

merge(config.macros.plugins,{
	wizardTitle: "Zarządzaj pluginami",
	step1Title: "Aktualnie załadowane pluginy",
	step1Html: "<input type='hidden' name='markList'></input>",
	skippedText: "(Ten plugin nie jest uruchomiony ponieważ dopiero co został dodany)",
	noPluginText: "Brak zainstalowanych pluginów",
	confirmDeleteText: "Czy jesteś pewien że chcesz usunąć te pluginy:\n\n%0",
	removeLabel: "usuń tag systemConfig",
	removePrompt: "Usunąć tag systemConfig",
	deleteLabel: "usuń",
	deletePrompt: "Usunąć notatke?",
	listViewTemplate : {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Title', field: 'title', tiddlerLink: 'title', title: "Title", type: 'TiddlerLink'},
			{name: 'Forced', field: 'forced', title: "Forced", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Disabled", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Loaded", type: 'Boolean', trueText: "Tak", falseText: "Nie"},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Błąd", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.refreshDisplay,{
	label: "aktualisieren",
	prompt: "Gesamte TiddlyWiki-Ansicht aktualisieren"
	});

merge(config.macros.importTiddlers,{
	defaultPath: "http://www.tiddlywiki.com/index.html",
	fetchLabel: "ściągnij",
	fetchPrompt: "Ściąga dane z TiddlyWiki",
	fetchError: "Wystąpiły problemy podczas ściągania pliku TiddlyWiki",
	confirmOverwriteText: "Czy jesteś pewien że chcesz zastąpić te notatki:\n\n%0",
	wizardTitle: "Importuj notatki z innej TiddlyWiki",
	step1: "Krok 1: Zlokalizuj plik TiddlyWiki",
	step1prompt: "Wprowadź URL lub ścieżkę z nazwą: ",
	step1promptFile: "...lub przeglądaj w poszukiwaniu pliku: ",
	step1promptFeeds: "...lub wybierz wartość zdefiniowaną wcześniej: ",
	step1feedPrompt: "Ściągnij",
	step2: "Krok 2: TiddlyWiki- wczytywanie danych",
	step2Text: "Proszę czekać. Wczytuję plik z: %0",
	step3: "Krok 3: Wybierz notatki do zaimportowania",
	step4: "%0 Importuje notatki",
	step5: "Importuj",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Title', field: 'title', title: "Nazwa", type: 'String'},
			{name: 'Snippet', field: 'text', title: "Fragment", type: 'String'},
			{name: 'Tags', field: 'tags', title: "Tag", type: 'Tags'}
			],
		rowClasses: [
			],
		actions: [
			{caption: "Czekaj...", name: ''},
			{caption: "Importuj te notatki", name: 'import'}
			]}
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Title', field: 'title', tiddlerLink: 'title', title: "Title", type: 'TiddlerLink'},
			{name: 'Local Status', field: 'localStatus', title: "Changed on your computer?", type: 'String'},
			{name: 'Server Status', field: 'serverStatus', title: "Changed on server?", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Server URL", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Sync these tiddlers", name: 'sync'}
			]},
	wizardTitle: "Synchronize your content with external servers and feeds",
	step1Title: "Choose the tiddlers you want to synchronize",
	step1Html: '<input type="hidden" name="markList"></input>',
	syncLabel: "sync",
	syncPrompt: "Sync these tiddlers"
});

merge(config.commands.closeTiddler,{
	text: "zamknij",
	tooltip: "Zamknij tą notatkę"});

merge(config.commands.closeOthers,{
	text: "zamknij inne",
	tooltip: "zamyka wszystkie notatki oprócz tej"});

merge(config.commands.editTiddler,{
	text: "edytuj",
	tooltip: "Edytuj tą notatkę",
	readOnlyText: "widok",
	readOnlyTooltip: "Zobacz źródło notatki"});

merge(config.commands.saveTiddler,{
	text: "gotowe",
	tooltip: "Zapisuje zmiany w tej notatce"});

merge(config.commands.cancelTiddler,{
	text: "anuluj",
	tooltip: "Wyjdź i nie zapisuj zmian",
	warning: "Nie chcesz zapisać zmian w '%0'?",
	readOnlyText: "gotowe",
	readOnlyTooltip: "Powrót do normalnego widoku"});

merge(config.commands.deleteTiddler,{
	text: "usuń",
	tooltip: "Usuwa tą notatkę",
	warning: "Chcesz usunąć '%0'?"});

merge(config.commands.permalink,{
	text: "stały widok",
	tooltip: "Adres tej notatki"});

merge(config.commands.references,{
	text: "odwołania",
	tooltip: "Pokazuje notatki które się odwołują do tej",
	popupNone: "Brak odwołań"});

merge(config.commands.jump,{
	text: "skocz",
	tooltip: "Skacze do kolejnej otwartej notatki"});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[SzybkiStart]]",
	MainMenu: "[[SzybkiStart]]",
	SiteTitle: "[[TiddlyWiki|SiteTitle]]",
	SiteSubtitle: "[[osobisty nieliniowy notatnik wielokrotnego użytku|SiteSubtitle]]",
	SiteUrl: "http://www.tiddlywiki.com/",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "opcje »" "Zmień opcje">>',
	SideBarTabs: '<<tabs txtMainTab "Czas" "Czas" TabTimeline "A-Z" "Wszystkie notatki" TabAll "Tagi" "Wszystkie tagi" TabTags "Więcej" "Więcej info" TabMore>>',
	TabTimeline: '<<timeline>>',
	TabAll: '<<list all>>',
	TabTags: '<<allTags excludeLists>>',
	TabMore: '<<tabs txtMoreTab "Brakujące" "Brakujące notatki" TabMoreMissing "Sieroty" "Notatki bez odwołań" TabMoreOrphans "Systemowe" "Systemowe notatki" TabMoreShadowed>>',
	TabMoreMissing: '<<list missing>>',
	TabMoreOrphans: '<<list orphans>>',
	TabMoreShadowed: '<<list shadowed>>',
	PluginManager: '<<plugins>>',
	ImportTiddlers: '<<importTiddlers>>'});

/*}}}*/
