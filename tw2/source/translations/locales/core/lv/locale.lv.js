/***
|''Name:''|locale.lv|
|''Description:''|TiddlyWiki tulkojums latviešu valodā|
|''Author:''|Mārcis Š. (marcis (at) webdizains (dot) com)|
|''Source:''|http://www.webdizains.com/tw/ |
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/lv/locale.lv.js |
|''Version:''|0.3.6|
|''Date:''|Jul 6, 2007|
|''Comments:''|Lūdzu, komentējiet iekš http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.2|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "lv"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "TavsVārds"});

merge(config.tasks,{
	save: {text: "saglabāt", tooltip: "Saglabāt tavas izmaiņas šajā TiddlyWiki", action: saveChanges},
	sync: {text: "sinhronizēt", tooltip: "Sinhronizēt izmaiņas ar citiem TiddlyWiki failiem un serveriem", content: '<<sync>>'},
	importTask: {text: "importēt", tooltip: "Importēt tiddlerus un plug-inus no citiem TiddlyWiki failiem un serveriem", content: '<<importTiddlers>>'},
	tweak: {text: "personalizēt", tooltip: "Personalizēt TiddlyWiki izskatu un uzvedību", content: '<<options>>'},
	plugins: {text: "plug-ini", tooltip: "Menedžēt instalētos plug-inus", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Lietotājvārds lai parakstītu tavus editus",
	chkRegExpSearch: "Enhabilitēt (enable) regulāro izteikumu izmantošanu meklēšanā",
	chkCaseSensitiveSearch: "Case-sensitive meklēšana",
	chkAnimate: "Enhabilitēt animācijas",
	chkSaveBackups: "Izveidot back-up failu saglabājot izmaiņas",
	chkAutoSave: "Automātiski saglabāt izmaiņas",
	chkGenerateAnRssFeed: "Ģenerēt RSS feedu saglabājot izmaiņas",
	chkSaveEmptyTemplate: "Ģenerēt tukšu templāti saglabājot izmaiņas",
	chkOpenInNewWindow: "Atvērt eksternālus linkus jaunā logā",
	chkToggleLinks: "Klikšķināšana uz linkiem lai atvērtu tiddlerus liek tiem aizvērties ja tie jau ir atvrērti",
	chkHttpReadOnly: "Slēpt rediģēšanas iespējas kad skatīts pār HTTP",
	chkForceMinorUpdate: "Neapdeitot modificētāja lietotājvārdu un datumu rediģējot tiddlerus",
	chkConfirmDelete: "Prasīt apstiprinājumu pirms tiddleru dzēšanas",
	chkInsertTabs: "Izmantot tab taustiņu lai ievietotu tab rakstu zīmes tā vietā lai pārvietotos starp laukiem",
	txtBackupFolder: "Mapes ko izmantot back-up failiem nosaukums",
	txtMaxEditRows: "Maksimalais rindiņu skaits rediģēšanas kastēs",
	txtFileSystemCharSet: "Defaultais rakstu zīmju sets izmaiņu saglabāšanai (tikai priekš Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Lādējot plug-inus tika sastaptas problēmas. Skat. PluginManager sīkakai informācijai",
	pluginError: "Kļūda: %0",
	pluginDisabled: "Netika izpildīts jo ir ticis dishabilitēts (disabled) caur 'systemConfigDisable' birku",
	pluginForced: "Izpildīts jo tika spiests (forced) caur 'systemConfigForce'  birku",
	pluginVersionError: "Netika izpildīts jo plug-inam ir nepieciešama jaunāka TiddlyWiki versija",
	nothingSelected: "Nekas nav ticis izvēlēts. Tev vispirms ir jāizvelas viens vai vairāki ītemi",
	savedSnapshotError: "Šķiet ka šī TiddlyWiki ir tikusi nepareizi saglabāta. Lūdzu vērsies http://www.tiddlywiki.com/#DownloadSoftware pēc sīkākas informācijas",
	subtitleUnknown: "(nezināms)",
	undefinedTiddlerToolTip: "Tiddlers '%0' vēl neeksistē",
	shadowedTiddlerToolTip: "Tiddlers '%0' vēl neeksistē, taču tam ir pre-definēta ēnas vērtība",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Eksternāls links uz %0",
	noTags: "Nav birkotu (tagged) tiddleru",
	notFileUrlError: "Tev jāsaglabā šī TiddlyWiki kādā failā pirms saglabāt izmaiņas",
	cantSaveError: "Nav iespējams saglabāt izmaiņas. Iespējamu iemeslu skaitā ir:\n- tavs pārlūks neatbalsta saglabāšanu (Firefox, Internet Explorer, Safari un Opera strādā ja ir atbilstoši konfigurēti)\n- faila takas nosaukums (pathname) uz tavu TiddlyWiki failu satur neatļautas rakstu zīmes\n- TiddlyWiki HTML fails ir ticis pārvietots vai pārdēvēts",
	invalidFileError: "Sākotnējais fails '%0' nešķiet esam derīga TiddlyWiki",
	backupSaved: "Back-up saglabāts",
	backupFailed: "Neizdevās saglabāt back-up failu",
	rssSaved: "RSS feeds saglabāts",
	rssFailed: "Neizdevās saglabāt RSS feeda failu",
	emptySaved: "Tukša templāte saglabāta",
	emptyFailed: "Neizdevās saglabāt tukšas templātes failu",
	mainSaved: "Galvenais TiddlyWiki fails saglabāts",
	mainFailed: "Neizdevās saglabāt galveno TiddlyWiki failu. Tavas izmaiņas netika saglabātas",
	macroError: "Kļūda iekš macro <<\%0>>",
	macroErrorDetails: "Kļūda izpildot macro <<\%0>>:\n%1",
	missingMacro: "Nav tāda macro",
	overwriteWarning: "Tiddlers ar nosaukumu '%0' jau pastāv. Izvēleis OK lai pārrakstītu to",
	unsavedChangesWarning: "UZMANĪBU! Ir izmaiņas kas nav tikušas saglabātas iekš TiddlyWiki\n\nIzvēlies OK lai saglabātu\nIzvēlies CANCEL lai izmestu",
	confirmExit: "--------------------------------\n\nIekš TiddlyWiki ir nesaglabātas izmaiņas. Ja tu turpināsi tu zaudēsi šīs izmaiņas\n\n--------------------------------",
	saveInstructions: "SaglabātIzmaiņas",
	unsupportedTWFormat: "Neatbalstīts TiddlyWiki formāts '%0'",
	tiddlerSaveError: "Kļūda saglabājot tiddleru '%0'",
	tiddlerLoadError: "Kļūda lādējot tiddleru '%0'",
	wrongSaveFormat: "Nevar saglabāt ar uzglabāšanas formātu '%0'. Izmantojot standarta formātu saglabašanai.",
	invalidFieldName: "Nederīgs lauka vārds %0",
	fieldCannotBeChanged: "Lauks '%0' nevar tikt izmainīts",
	loadingMissingTiddler: "Tiek izdarīts mēģinajums pārtvert (retrieve) tiddleru '%0' no '%1' servera at:\n\n'%2' darba telpā '%3'"});

merge(config.messages.messageClose,{
	text: "aizvērt",
	tooltip: "aizvērt šo ziņojumu telpu"});

config.messages.backstage = {
	open: {text: "backstage", tooltip: "Atvērt backstage telpu lai izpildītu rakstīšanas un rediģēšanas darbus"},
	close: {text: "aizvērt", tooltip: "Aizvērt backstage telpu"},
	prompt: "backstage: ",
	decal: {
		edit: {text: "rediģēt", tooltip: "Rediģēt tiddleru '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klikšķini lai redzētu šo tiddleru pilnā skatā",
	previewUnavailable: "(priekšskats nav pieejams)"
};

config.messages.dates.months = ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris","Decembris"];
config.messages.dates.days = ["Svētdiena", "Pirmdiena", "Otrdiena", "Trešdiena", "Ceturtdiena", "Piektdiena", "Sestdiena"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
config.messages.dates.shortDays = ["Sv", "P", "O", "T", "C", "Pt", "S"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["ais","ais","ais","tais","tais","tais","tais","tais","tais","tais",
		"tais","tais","tais","tais","tais","tais","tais","tais","tais","tais",
		"ais","ais","ais","tais","tais","tais","tais","tais","tais","tais",
		"ais"];
config.messages.dates.am = "priekšpusd.";
config.messages.dates.pm = "pēcpusd.";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: " nav birku",
	labelTags: "birkas: ",
	openTag: "Atvērt birku '%0'",
	tooltip: "Parādīt tiddlerus birkotus (tagged) ar '%0'",
	openAllText: "Atvērt visus",
	openAllTooltip: "Atvērt visus šos tiddlerus",
	popupNone: "Nav citu tiddleru birkotu (tagged) ar '%0'"});

merge(config.views.wikified,{
	defaultText: "Tiddlers '%0' vēl neeksistē. Dubultklikšķini lai izveidotu to",
	defaultModifier: "(nav atrodams)",
	shadowModifier: "(iebūvēts ēnas tiddlers)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "izveidots"});

merge(config.views.editor,{
	tagPrompt: "Raksti birkas (tags) atdalītas ar atstarpēm, [[izmanto divkāršas kvadrātiekavas]] ja nepeiciešams, vai pievieno jau eksistējošas",
	defaultText: "Raksti tekstu priekš '%0'"});

merge(config.views.editor.tagChooser,{
	text: "birkas",
	tooltip: "Izvēleis jau eksistējošas birkas ko pievienot šim tiddleram",
	popupNone: "Neviena birka nav tikusi definēta",
	tagTooltip: "Pievieno birku '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "meklēt",
	prompt: "Meklēt šajā TiddlyWiki",
	accessKey: "F",
	successMsg: "atrasti %0 tiddleri atbilstoši %1",
	failureMsg: "Netika atrasts neviens %0 atbilstošs tiddlers"});

merge(config.macros.tagging,{
	label: "birkojoši (tagging): ",
	labelNotTag: "nebirkojoši (not tagging)",
	tooltip: "Tiddleru birkotu ar '%0' saraksts"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Parādīt tiddlerus birkotus ar '%0'",
	noTags: "Nav birkotu (tagged) tiddleru"});

config.macros.list.all.prompt = "Visi tiddleri alfabētiskā secībā";
config.macros.list.missing.prompt = "Tiddleri uz kuriem ir linki, bet, nav tikuši definēti";
config.macros.list.orphans.prompt = "Tiddleri uz kuriem nav linku no neviena cita tiddlera";
config.macros.list.shadowed.prompt = "Ēnas tiddleri defaultajam saturam";
config.macros.list.touched.prompt = "Tiddleri kas ir tikuši modificēti lokāli";

merge(config.macros.closeAll,{
	label: "aizvērt visus",
	prompt: "Aizvērt visus parādītos tiddlerus (izņemot tos kas tiek rediģēti)"});

merge(config.macros.permaview,{
	label: "permaview",
	prompt: "Links uz URL kas pārtver (retrieves) visus pašlaik parādītos tiddlerus"});

merge(config.macros.saveChanges,{
	label: "saglabāt izmaiņas",
	prompt: "Saglabāt visus tiddlerus lai izveidotu jaunu TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "jauns tiddlers",
	prompt: "Izveidot jaunu tiddleru",
	title: "Jauns Tiddlers",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "jauns žurnāls",
	prompt: "Izveidot jaunu tiddleru no pašreizējā datuma un laika",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Personalizēt sarežģītās (advanced) opcijas",
	step1Title: "Šīs opcijas tiek saglabātas cepumos (cookies) tavā pārlūkā",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Parādīt nezināmas opcijas</input>",
	unknownDescription: "//(nezināms)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Opcija", type: 'String'},
			{name: 'Description', field: 'description', title: "Apraksts", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Vārds", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Menedžēt plug-inus",
	step1Title: "Šobrīd ieniciētie plug-ini",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Šis plug-ins nav ticis iniciēts jo tas ir ticis pievienots pēc palaišanas (startup))",
	noPluginText: "Nav instalēts neviens plug-ins",
	confirmDeleteText: "Vai tu esi drošs ka  gribi izdzēst šos plug-inus:\n\n%0",
	removeLabel: "noņemt systemConfig birku",
	removePrompt: "Noņemt systemConfig birku",
	deleteLabel: "izdzēst",
	deletePrompt: "Izdzēst šos tiddlerus uz visiem laikiem",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddlers", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Izmērs", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Spiests (forced)", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Dishabilitēts (disabled)", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Iniciēts (loaded)", type: 'Boolean', trueText: "Jā", falseText: "Nē"},
			{name: 'Startup Time', field: 'startupTime', title: "Palaišanas Laiks (startup time)", type: 'String'},
			{name: 'Error', field: 'error', title: "Statuss", type: 'Boolean', trueText: "Kļūda", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Reģistrs", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "vairāk",
	morePrompt: "Parādīt vairāk komandu"
	});

merge(config.macros.refreshDisplay,{
	label: "atsvaidzināt",
	prompt: "Pārlādēt (redraw) visu TiddlyWiki interfeisu"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Tu nevari importēt uz read-only TiddlyWiki failu. Mēģini atvērt to no file:// URL",
	wizardTitle: "Importēt tiddlerus no cita faila vai servera",
	step1Title: "Solis 1: Dislocē serveri vai TiddlyWiki failu",
	step1Html: "Specificē servera tipu: <select name='selTypes'><option value=''>Izvēlies...</option></select><br>Ievadi URL vai faila taku šeit: <input type='text' size=50 name='txtPath'><br>...vai pārlūko (browse) pēc faila: <input type='file' size=50 name='txtBrowse'><br><hr>...vai izvēlies pre-definētu feedu: <select name='selFeeds'><option value=''>Izvēlies...</option></select>",
	openLabel: "atvērt",
	openPrompt: "Atver savienojumu ar šo failu vai serveri",
	openError: "Pārtverot tiddlywiki failu tika sastaptas problēmas",
	statusOpenHost: "Pašlaik atver hostu",
	statusGetWorkspaceList: "Pašlaik pārtver pieejamo darba telpu sarakstu",
	step2Title: "Solis 2: Izvēlies darba telpu",
	step2Html: "Ievadi darba telpas nosaukumu: <input type='text' size=50 name='txtWorkspace'><br>...vai izvēlies darba telpu: <select name='selWorkspace'><option value=''>Choose...</option></select>",
	cancelLabel: "atcelt",
	cancelPrompt: "Atcelt šo importēšanu",
	statusOpenWorkspace: "Pašlaik atver darba telpu",
	statusGetTiddlerList: "Pašlaik pārtver pieejamo tiddleru sarakstu",
	step3Title: "Solis 3: Izvēlies tiddlerus ko importēt",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Atstāt šos tiddlerus linkotus uz šo serveri lai tu varētu sinhronizēt vēlakas izmaiņas</input><br><input type='checkbox' name='chkSave'>Saglabāt šī servera detaļas 'systemServer' tiddlerā ar nosaukumu:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importēt",
	importPrompt: "Importēt šos tiddlerus",
	confirmOverwriteText: "Vai tu esi drošs(/-a) ka vēlies pārrakstīt šos tiddlerus:\n\n%0",
	step4Title: "Solis 4: Importē %0 tiddleru(s)",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "gatavs",
	donePrompt: "Aizvērt šo wizard",
	statusDoingImport: "Importē tiddlerus",
	statusDoneImport: "Visi tiddleri importēti",
	systemServerNamePattern: "%2 uz %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Tiddlers '%0' jau eksistē. Klikšķini 'OK' lai pārrakstītu to ar šī servera detaļām, vai 'Cancel' lai atstātu to nemainītu",
	serverSaveTemplate: "|''Tips:''|%0|\n|''URL:''|%1|\n|''darba telpa:''|%2|\n\nŠis tiddlers tika automātiski izveidots lai dokumentētu šī servera detaļas",
	serverSaveModifier: "(Sistēma)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddlers", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Izmērs", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Birkas", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddlers", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Servera tips", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Servera hosts", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Servera darba telpa", type: 'String'},
			{name: 'Status', field: 'status', title: "Sinhronizācijas statuss", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Servera URL", text: "Skatīt", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Sinhronizēt šos tiddlerus", name: 'sinhronizēt'}
			]},
	wizardTitle: "Sinhronizēt ar eksternāliem serveriem un failiem",
	step1Title: "Izvēlies tiddlerus ko gribi sinhronizēt",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "sinhronizēt",
	syncPrompt: "Sinhronizēt šos tiddlerus",
	hasChanged: "Izmainījušies kamēr atvienots",
	hasNotChanged: "Nav izmainījušies kamēr atvienots",
	syncStatusList: {
		none: {text: "...", color: "none"},
		changedServer: {text: "Izmainījies uz servera", color: '#80ff80'},
		changedLocally: {text: "Izmainījies kamēr atvienots", color: '#80ff80'},
		changedBoth: {text: "Izmainījies kamēr atvienots un uz servera", color: '#ff8080'},
		notFound: {text: "Nav ticis atrasts uz servera", color: '#ffff80'},
		putToServer: {text: "Saglabāja apdeitu uz servera", color: '#ff80ff'},
		gotFromServer: {text: "Pārtvēra apdeitu no servera", color: '#80ffff'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "aizvērt",
	tooltip: "Aizvērt šo tiddleru"});

merge(config.commands.closeOthers,{
	text: "aizvērt citus",
	tooltip: "Aizvērt visus citus tiddlerus"});

merge(config.commands.editTiddler,{
	text: "rediģēt",
	tooltip: "Rediģēt šo tiddleru",
	readOnlyText: "skatīt",
	readOnlyTooltip: "Skatīt šī tiddlera avotu"});

merge(config.commands.saveTiddler,{
	text: "gatavs",
	tooltip: "Saglabāt izmaiņas šim tiddleram"});

merge(config.commands.cancelTiddler,{
	text: "atcelt",
	tooltip: "Atdarīt (undo) izmaiņas šim tiddleram",
	warning: "Vai tu esi drošs(/-a) ka vēlies pamest savas izmaiņas '%0'?",
	readOnlyText: "gatavs",
	readOnlyTooltip: "Apskatīt šo tiddleru normāli"});

merge(config.commands.deleteTiddler,{
	text: "izdzēst",
	tooltip: "Izdzēst šo tiddleru",
	warning: "Vai tu esi drošs(/-a) ka vēlies izdzēst '%0'?"});

merge(config.commands.permalink,{
	text: "permalinks",
	tooltip: "Permalinks šim tiddleram"});

merge(config.commands.references,{
	text: "atsauces",
	tooltip: "Parādīt tiddlerus kas linko uz šo",
	popupNone: "Nav atsauču"});

merge(config.commands.jump,{
	text: "pārlēkt",
	tooltip: "Pārlēkt uz citu atvērtu tiddleru"});

merge(config.commands.syncing,{
	text: "sinhronizēšana",
	tooltip: "Kontrolē šī tiddlera sinhronizēšanu ar serveri vai eksternālu failu",
	currentlySyncing: "<div>Pašlaik sinhronizē caur <span class='popupHighlight'>'%0'</span> uz:</"+"div><div>host: <span class='popupHighlight'>%1</span></"+"div><div>darba telpa: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Pašlaik nesinhronizē",
	captionUnSync: "Pārtraukt sinhronizēt šo tiddleru",
	chooseServer: "Shronizē šo tiddleru ar citu serveri:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "lauki",
	tooltip: "Parādīt šī tiddlera paplašinātos laukus",
	emptyText: "Šim tiddleram nav paplašinātu lauku",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Lauks", type: 'String'},
			{name: 'Value', field: 'value', title: "Vērtība", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[Sagatavošanās]]",
	MainMenu: "[[Sagatavošanās]]\n\n\n^^~TiddlyWiki version <<version>>\n© 2007 [[UnaMesa|http://www.unamesa.org/]]^^",
	Sagatavošanās: "Lai sāktu izmantot šo TiddlyWiki, tev vajadzēs modificēt sekojošus tiddlerus:\n* SiteTitle & SiteSubtitle: Saita virsraksts un apakšvirsraksts, kā parādās augstāk (pēc saglabāšanas, tie parādīsies arī pārlūka virsraksta joslā)\n* MainMenu: Izvēlne (parasti, pa kreisi)\n* DefaultTiddlers: Tiddleru nosaukumi kurus tu gribi redzēt atverot TiddlyWiki\nTev vajadzēs ievadīt arī savu lietotājvārdu lai parakstītu savus editus: <<option txtUserName>>",
	SiteTitle: "Mana TiddlyWiki",
	SiteSubtitle: "vairākreiz izmantojams nelineārs personāls web bloknots",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Šīs interfeisa opcijas TiddlyWiki personalizēšanai tiek saglabātas tavā pārlūkā\n\nTavs lietotājvārds tavu editu parakstīšanai. Raksti to kā WikiWord (piemēram, JoeBloggs)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Saglabāt back-up failus\n<<option chkAutoSave>> Autosaglabāt\n<<option chkRegExpSearch>> Regexp meklēšana\n<<option chkCaseSensitiveSearch>> Case sensitive meklēšana\n<<option chkAnimate>> Enhabilitēt (enable) animācijas\n\n----\nSkat. arī [[SarežģītāsOpcijas]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "opcijas »" "Mainīt TiddlyWiki sarežģītās (advanced) opcijas">>',
	SideBarTabs: '<<tabs txtMainTab "Laika skala" "Laika skala (timeline)" TabTimeline "Visi" "Visi tiddleri" TabAll "Birkas" "Visas birkas" TabTags "Vairāk" "Vairāk sarakstu" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Trūkstoši" "Trūkstoši tiddleri" TabMoreMissing "Bāreņi" "Tiddleri kas kļuvuši par bāreņiem" TabMoreOrphans "Ēnas" "Ēnas tiddleri" TabMoreShadowed>>'});

merge(config.annotations,{
	AdvancedOptions: "Šis ēnas tiddlers nodrošina pieeju vairākām sarežģītām (advanced) opcijām",
	ColorPalette: "Šīs vērtības šajā ēnas tiddlerā nosaka ~TiddlyWiki lietotāju interfeisa krāsu shēmu",
	DefaultTiddlers: "Tiddleri kas uzskaitīti šajā ēnas tiddlerā tiks automātiski parādīti kad ~TiddlyWiki tiks palaista",
	EditTemplate: "HTML templāte šajā ēnas tiddlerā nosaka kā tiddleri izskatās kamēr tiek rediģēti",
	GettingStarted: "Šis ēnas tiddlers nodrošina pamata lietošanas instrukcijas",
	ImportTiddlers: "Šis ēnas tiddlers nodrosina piekļuvi tiddleru importēšanai",
	MainMenu: "Šis ēnas tiddlers tiek lietots kā galvenās izvēlnes ekrāna kreisās puses kolonnā saturs",
	MarkupPreHead: "Šis tiddlers tiek ievietots TiddlyWiki HTML faila <head> sekcijas augšpusē",
	MarkupPostHead: "Šis tiddlers tiek ievietots TiddlyWiki HTML faila <head> sekcijas zemākajā daļā",
	MarkupPreBody: "Šis tiddlers tiek ievietots TiddlyWiki HTML faila <body> sekcijas augšpusē",
	MarkupPostBody: "Šis tiddlers tiek ievietots TiddlyWiki HTML faila <body> sekcijas zemākajā daļa uzreiz pirms skriptu bloka",
	OptionsPanel: "Šis tiddlers tiek izmantots kā opciju paneļa slaidera, labās puses sānu joslā, saturs",
	PageTemplate: "HTML templāte šajā ēnas tiddlerā nosaka kopejo ~TiddlyWiki izkārtojumu",
	PluginManager: "Šis ēnas tiddlers nodrošina piekļuvi plug-inu menedžerim",
	SideBarOptions: "Šis ēnas tiddlers tiek lietots kā opciju paneļa, labās puses sānu joslā, saturs",
	SideBarTabs: "Šis ēnas tiddlers tiek lietots kā birku paneļa, labās puses sānu joslā, saturs",
	SiteSubtitle: "Šis ēnas tiddlers tiek lietots kā lapas virsraksta otrā daļa",
	SiteTitle: "Šis ēnas tiddlers tiek lietots kā lapas virsraksta pirmā daļa",
	SiteUrl: "Šim ēnas tiddleram vajadzētu būt iestatītam uz pilno mērķa (full target) URL publicēšanai",
	StyleSheetColours: "Šis ēnas tiddlers satur CSS definīcijas saistītas ar lapas krāsām",
	StyleSheet: "Šis tiddlers var saturēt personalizētas (custom) CSS definīcijas",
	StyleSheetLayout: "Šis ēnas tiddlers satur CSS saistītu ar lapas elementu izkātojumu",
	StyleSheetLocale: "Šis ēnas tiddlers satur CSS definīcijas saistītas ar tulkojuma lokāli (translation locale)",
	StyleSheetPrint: "Šis ēnas tiddlers satur CSS definīcijas drukāšanai (printēšanai)",
	TabAll: "Šis ēnas tiddlers satur 'Visi' taba, labās puses sānu joslā, saturu",
	TabMore: "Šis ēnas tiddlers satur 'Vairāk' taba, labās puses sānu joslā, saturu",
	TabMoreMissing: "Šis ēnas tiddlers satur 'Trūkstoši' taba, labās puses sānu joslā, saturu",
	TabMoreOrphans: "Šis ēnas tiddlers satur 'Bāreņi' taba, labās puses sānu joslā, saturu",
	TabMoreShadowed: "Šis ēnas tiddlers satur 'Ēnas' taba, labās puses sānu joslā, saturu",
	TabTags: "Šis ēnas tiddlers satur 'Birkas' taba, labās puses sānu joslā, saturu",
	TabTimeline: "Šis ēnas tiddlers satur 'Laika skala' taba, labās puses sānu joslā, saturu",
	ViewTemplate: "HTML templāte šajā ēnas tiddlerā nosaka kā tiddleri izskatās"
	});

//}}}
