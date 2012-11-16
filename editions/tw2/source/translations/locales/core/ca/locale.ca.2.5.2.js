/***
|''Name:''|CatalanLingo|
|''Description:''|Central Catalan translation for T|
|''Author:''|Paco Rivière (http://pacoriviere.cat)|
|''Source:''|https://projectes.lafarga.cat/projects/tiddlywiki/downloads|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/en/locale.en.js |
|''Version:''|0.4.0|
|''Date:''|Apr 11, 2010|
|''Comments:''|Agrairem els vostres comentaris a https://projectes.lafarga.cat/forum/?group_id=38|
|''License:''|[[BSD open source license]]|
|''~CoreVersion:''|2.5.2|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "ca"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "ElVostreNom"});

merge(config.tasks,{
	save: {text: "desa", tooltip: "Desa tots els canvis en aquest arxiu", action: saveChanges},
	sync: {text: "sincronitza", tooltip: "Sincronitza els canvis amb d'altres fitxers i servidors TiddlyWiki", content: '<<sync>>'},
	importTask: {text: "importa", tooltip: "Importa tiddlers i connector d'altres fitxers TiddlyWiki i servidors", content: '<<importTiddlers>>'},
	tweak: {text: "opcions", tooltip: "Tria el comportament de TiddlyWiki", content: '<<options>>'},
	upgrade: {text: "actualitza", tooltip: "Actualitza el codi del nucli de TiddlyWiki", content: '<<upgrade>>'},
	plugins: {text: "connectors", tooltip: "Gestiona els connectors", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Nom utilitzat per signar els canvis",
	chkRegExpSearch: "Cerca expressions regulars",
	chkCaseSensitiveSearch: "Distingeix les majúscules en cercar",
	chkIncrementalSearch: "Cerca incremental tecla a tecla",
	chkAnimate: "Fes servir animacions",
	chkSaveBackups: "Desa una còpia de seguretat abans de desar els canvis",
	chkAutoSave: "Registra els canvis de forma automàtica",
	chkGenerateAnRssFeed: "Genera un fil RSS en desar els canvis",
	chkSaveEmptyTemplate: "Genera un fitxer 'empty.html'en desar els canvis",
	chkOpenInNewWindow: "Obre els vincles externs en un altre finestra",
	chkToggleLinks: "Tanca els elements oberts en clicar sobre els seus vincles",
	chkHttpReadOnly: "Amaga els botons d'edició quan s'accedeix com per HTTP",
	chkForceMinorUpdate: "Tracta les edicions com a Canvis Menors conservant data i hora",
	chkConfirmDelete: "Demana confirmació abans de superimir un element",
	chkInsertTabs: "Inserta un tabulador amb la tecla 3tab en lloc de slatar el camp",
	txtBackupFolder: "Nom de la carpeta per als arxius de còpia",
	txtMaxEditRows: "Màxim nombre de línies d'una capsa d'edició tiddler",
	txtTheme: "Nom del tema",
	txtFileSystemCharSet: "Codificació de caractèrs per desar els (només per Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "S'han trobat problemes en carregar els connectors. Veieu el PluginManager per a més detalls",
	pluginError: "Error: %0",
	pluginDisabled: "Not executed because disabled via 'systemConfigDisable' tag",
	pluginForced: "Executed because forced via 'systemConfigForce' tag",
	pluginVersionError: "Not executed because this plugin needs a newer version of TiddlyWiki",
	nothingSelected: "Nothing is selected. You must select one or more items first",
	savedSnapshotError: "It appears that this TiddlyWiki has been incorrectly saved. Please see http://www.tiddlywiki.com/#Download for details",
	subtitleUnknown: "(unknown)",
	undefinedTiddlerToolTip: "The tiddler '%0' doesn't yet exist",
	shadowedTiddlerToolTip: "The tiddler '%0' doesn't yet exist, but has a pre-defined shadow value",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Enllaç extern cap a %0",
	noTags: "No hi ha tiddlers amb etiquetes",
	notFileUrlError: "Cal desar aquest TiddlyWiki a un arxiu abans de poder desar els canvis",
	cantSaveError: "No es poden desar els canvis. Pot ser que el vostre navegador no permeti desar (Proveu de fer servir Firefox, en lloc), o degut a que el nom de la ruta de l'arxiu TiddlyWiki té algun caràcter incorrecte",
	invalidFileError: "Sembla que l'arxiu original '%0' no és un TiddlyWiki vàlid",
	backupSaved: "S'ha desat la còpia",
	backupFailed: "No ha estat possible desar la còpia de l'arxiu",
	rssSaved: "S'ha desat el fil RSS",
	rssFailed: "No ha estat possible desar el fil RSS",
	emptySaved: "S'ha desat la plantilla buida",
	emptyFailed: "No ha estat possible desar la plantilla buida",
	mainSaved: "S'ha desat l'arxiu principal de TiddlyWiki",
	mainFailed: "No ha estat possible desar l'arxiu principal de TiddlyWiki. Els vostres canvis no s'han desat",
	macroError: "Hi ha un error a la macro <<%0>>",
	macroErrorDetails: "Hi ha hagut un error a l'executar la macro <<%0>>:\n%1",
	missingMacro: "No es troba la macro",
	overwriteWarning: "Ja hi ha un tiddler amb el nom '%0'. Trieu DAcord si el voleu sobreescriure",
	unsavedChangesWarning: "ATENCIÓ! Hi ha canvis que no s'han desat al TiddlyWiki\n\nTrieu DAcord per desar\nTrieu ANUL·LA per descartar-los",
	confirmExit: "--------------------------------\n\nHi ha canvis que no s'han desat al TiddlyWiki. Si continueu perdreu aquests canvis\n\n--------------------------------",
	saveInstructions: "DesaElsCanvis",
	unsupportedTWFormat: "El format del TiddlyWiki no es permés '%0'",
	tiddlerSaveError: "Hi ha hagut un error en desar el tiddler '%0'",
	tiddlerLoadError: "Hi ha hagut un error en desar el tiddler '%0'",
	wrongSaveFormat: "No es pot desar en el format de magatzament '%0'. Feu servir el format standard per a desar.",
	invalidFieldName: "El nom del camp no és vàlid vàlid %0",
	fieldCannotBeChanged: "No es pot modificar el camp '%0'",
	loadingMissingTiddler: "Intentant recuperar el '%0' del servidor '%1' a:\n\n'%2' a l'espai de treball '%3'",
	upgradeDone: "S'ha completat l'actualització a la versió %0\n\nCliqueu 'D'acord' per tornar a carregar el nou TiddlyWiki actualitzat"});

merge(config.messages.messageClose,{
	text: "tanca",
	tooltip: "tanca aquest tiddler"});

config.messages.backstage = {
	open: {text: "bastidors", tooltip: "Obre els bastidors per les tasques d'autor i editor"},
	close: {text: "tanca", tooltip: "Tanca els bastidors"},
	prompt: "bastidors : ",
	decal: {
		edit: {text: "edita", tooltip: "Edita el tiddler '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Cliqueu per preveure el tiddler",
	previewUnavailable: "(no es pot preveure)"
};

config.messages.dates.months = ["de gener de", "de febrer de", "de març de", "d'abril de", "de maig de", "de juny de", "de juliol de", "d'agost de", "de setembre de", "d'octubre de", "de novembre de","de desembre de"];
config.messages.dates.days = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"];
config.messages.dates.shortMonths = ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"];
config.messages.dates.shortDays = ["Diu", "Dil", "Dma", "Dcr", "Dij", "Div", "Dis"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["r","n","r","t","é","é","é","é","é","é",
		"é","é","é","é","é","é","é","é","é","é",
		"é","","é","é","é","é","é","é","é","é",
		"é"];
config.messages.dates.am = "m.";
config.messages.dates.pm = "t.";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "sense etiquetes",
	labelTags: "etiquetes: ",
	openTag: "Obre l'etiqueta '%0'",
	tooltip: "Obre els tiddlers etiquetats amb '%0'",
	openAllText: "obre tots",
	openAllTooltip: "Obre tots aquests tiddlers",
	popupNone: "No hi ha altres tiddlers etiquetats amb '%0'"});

merge(config.views.wikified,{
	defaultText: "El tiddler '%0' no existeix. Cliqueu dos cops per començar-lo",
	defaultModifier: "(falta)",
	shadowModifier: "(tiddler ombra pre-definit)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "creat el"});

merge(config.views.editor,{
	tagPrompt: "Afegiu les etiquetes separades per espais, [[feu servir corxets]] si cal, o afegiu-ne",
	defaultText: "Entreu el text per a '%0'.'"});

merge(config.views.editor.tagChooser,{
	text: "etiquetes",
	tooltip: "Tria entre les etiquetes actuals per afegir a aquest tiddler",
	popupNone: "No hi ha etiquetes definides",
	tagTooltip: "Afegeix l'etiqueta '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "cerca",
	prompt: "Cerca en aquest TiddlyWiki",
	accessKey: "F",
	successMsg: "S'han trobat %0 tiddlers que contenen: '%1'",
	failureMsg: "No s'ha trobat cap tiddler amb: '%0'"});

merge(config.macros.tagging,{
	label: "etiquetes:",
	labelNotTag: "cap etiqueta",
	tooltip: "Llista de tiddlers etiquetats amb '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Mostra tiddlers com a etiqueta '%0'",
	noTags: "No hi ha tiddlers amb etiquetes"});

config.macros.list.all.prompt = "Tots els tiddlers per ordre alfabètic";
config.macros.list.missing.prompt = "Tiddlers que tenen enllaços cap a ells, però no estàn definits";
config.macros.list.orphans.prompt = "Tiddlers sense enllaços des de cap altre";
config.macros.list.shadowed.prompt = "Tiddlers amb ombres amb contingut per omisió";
config.macros.list.touched.prompt = "Tiddlers que heu modificat localment";

merge(config.macros.closeAll,{
	label: "tanca tots",
	prompt: "Tanca tots els tiddlers oberts (excepte els que s'estàn editant)"});

merge(config.macros.permaview,{
	label: "torna vista",
	prompt: "Enllaça a una URL que torni tots els tiddlers que es mostren ara"});

merge(config.macros.saveChanges,{
	label: "desa els canvis",
	prompt: "Desa tots els canvis a un arxiu",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "nou tiddler",
	prompt: "Obre un nou tiddler",
	title: "Nou tiddler",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "nou diari",
	prompt: "Obre un nou tiddler amb la data i hora actuals",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Opcions avançades",
	step1Title: "Aquestes opcions es desen a les galetes del vostre navegador",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Mostre les opcions desconegudes</input>",
	unknownDescription: "//(desconegut)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Opció", type: 'String'},
			{name: 'Description', field: 'description', title: "Descripció", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Nom", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Gestor de connectors",
	step1Title: "Connectors carregats",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Aquest connector encara no s'ha carregat)",
	noPluginText: "No hi ha cap connector instal·lat",
	confirmDeleteText: "Segur que voleu que suprimir els connectors:\n\n%0",
	removeLabel: "suprimeix l'etiqueta systemConfig",
	removePrompt: "Suprimeix l'etiqueta systemConfig",
	deleteLabel: "suprimeix",
	deletePrompt: "Suprimeix definitivament aquests tiddlers",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Descripció", type: 'String'},
			{name: 'Version', field: 'Version', title: "Versió", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Mida", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Forçat", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Desactivat", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Carregat", type: 'Boolean', trueText: "Sí", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Temps de càrrega", type: 'String'},
			{name: 'Error', field: 'error', title: "Resultat", type: 'Boolean', trueText: "Error", falseText: "DAcord"},
			{name: 'Log', field: 'log', title: "Registre", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'avís'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "més",
	morePrompt: "Mostra més ordres",
	lessLabel: "menys",
	lessPrompt: "Mostra menys ordres",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "actualitza",
	prompt: "Torna a carregar tot el TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "No podeu importar a un fitxer TiddlyWiki només de lectura. Mireu d'obrir-lo des d'un fitxer, file:// URL",
	wizardTitle: "Importa tiddlers d'un altre fitxer o servidor",
	step1Title: "Pas 1: Indiqueu el fitxer TiddlyWiki o servidor",
	step1Html: "Indiqueu el tipus de servidor: <select name='selTypes'><option value=''>Trieu...</option></select><br>Entreu la URL o la ruta aquí: <input type='text' size=50 name='txtPath'><br>...o navega: <input type='file' size=50 name='txtBrowse'><br><hr>...o trieu un canal predefinit: <select name='selFeeds'><option value=''>Trieu...</option></select>",
	openLabel: "obre",
	openPrompt: "Obre la connexió amb aquest fitxer o servidor",
	openError: "Hi ha hagut un problema en importar el fitxer Tiddlywiki",
	statusOpenHost: "Obrint el servidor",
	statusGetWorkspaceList: "Obtenint la llista d'espais de treball disponibles",
	step2Title: "Pas 2: Trieu un espai de treball",
	step2Html: "Entreu el nom de l'espai de treball: <input type='text' size=50 name='txtWorkspace'><br>...o trieu un espai de treball: <select name='selWorkspace'><option value=''>Trieu...</option></select>",
	cancelLabel: "anul·la",
	cancelPrompt: "Anul·la la importació",
	statusOpenWorkspace: "Obrint l'espai de treball",
	statusGetTiddlerList: "Obtenint la llista de tiddlers",
	errorGettingTiddlerList: "Hi ha hagut un problema en obtenir la llist de tiddlers, cliqueu Anul·la o torneu a provar",
	step3Title: "Pas 3: Trieu els tiddlers que voleu importar",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Manté aquests tiddlers enllaçats a aquest servidor per doder sincronitzar el canvis</input><br><input type='checkbox' name='chkSave'>Deseu els detalls del servidor en un tiddler 'systemServer' anomenat:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importa",
	importPrompt: "Importa aquests tiddlers",
	confirmOverwriteText: "Segur que voleu substituir aquests tiddlers:\n\n%0",
	step4Title: "Pas 4: Important %0 tiddler(s)",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "fet",
	donePrompt: "Tanca l'assistent",
	statusDoingImport: "Important els tiddlers",
	statusDoneImport: "S'han importat tots els tiddlers",
	systemServerNamePattern: "%2 de %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "El tiddler '%0' ja existeix. Cliqueu 'DAcord' per sobreescriure'l amb els detalls d'aquest servidor, o 'Anul·la' per deixar-ho tal com és",
	serverSaveTemplate: "|''Tipus:''|%0|\n|''URL:''|%1|\n|''Espai:''|%2|\n\nAquest tiddler es va crear automàticament per registrar els detalls d'aquest servidor",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Mida", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Etiquetes", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Actualitza el codi del nucli de TiddlyWiki",
	step1Title: "Posa al dia o repara aquest this TiddlyWiki a la darrera versió",
	step1Html: "Aneu a actualitzar a la darrera versió el nucli de TiddlyWiki (de <a href='%0' class='externalLink' target='_blank'>%1</a>). El vostre contingut es conservarà al actualitzar.<br><br>Les actualitzacions del nucli poden fer que els connectors més antics deixin de funcionar correctament. Si trobeu problemes amb l'arxiu actualitzat, veieu <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "No es pot actualitzar aquest TiddlyWiki. Només podeu actualitzar fitxers TiddlyWiki desats localment",
	errorNotSaved: "Heu de desar els canvis abans d'actualitzar",
	step2Title: "Confirmeu els detalls de l'actualització",
	step2Html_downgrade: "Aneu a retrocedir a TiddlyWiki versió %0 des de la  %1.<br><br>Downgrading to an earlier version of the core code is not recommended",
	step2Html_restore: "Sembla que aquest TiddlyWiki ja fa servir la darrera versió del codi del nucli (%0).<br><br>Podeu continuar igualment l'actualització per assegurar que el codi del nucli no està danyat",
	step2Html_upgrade: "Aneu a actualitzar aquest TiddlyWiki a la versió %0 des de la %1",
	upgradeLabel: "actualitza",
	upgradePrompt: "Inicia el procés d'actualització",
	statusPreparingBackup: "Preparant la còpia de seguretat",
	statusSavingBackup: "Desant la còpia de seguretat",
	errorSavingBackup: "S'han trobat un problema en desar la còpia de seguretat",
	statusLoadingCore: "Carregant el codi del nucli",
	errorLoadingCore: "Hi ha hagut un error carregant el codi del nucli",
	errorCoreFormat: "Hi ha hagut un error amb el nou codi del nucli",
	statusSavingCore: "Desant el nou codi del nucli",
	statusReloadingCore: "Tornant a carregar el nou codi del nucli",
	startLabel: "inicia",
	startPrompt: "Inicia l'actualització",
	cancelLabel: "cancel·la",
	cancelPrompt: "Cancel·la l'actualització",
	step3Title: "procés cancel·lat",
	step3Html: "Heu cancel·lat l'actualització"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Tipus de servidor", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Servidor", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Espai de treball", type: 'String'},
			{name: 'Status', field: 'status', title: "Estat de Sicronització", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "URL del servidor", text: "Mostra", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Sync these tiddlers", name: 'sync'}
			]},
	wizardTitle: "Sincronitza amb servidors i fitxers externs",
	step1Title: "Trieu els tiddlers que voleu sincronitzar",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "sinc",
	syncPrompt: "Sincronitza aquests tiddlers",
	hasChanged: "Ha canviat mentre no era connectat",
	hasNotChanged: "Sense canvis mentre no era connectat",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "Canviat al servidor", display:null, className:'changedServer'},
		changedLocally: {text: "Canviat mentre era desconnectat", display:null, className:'changedLocally'},
		changedBoth: {text: "Canviat mentre desconnectat i al servidor", display:null, className:'changedBoth'},
		notFound: {text: "No s'ha trobat al servidor", display:null, className:'notFound'},
		putToServer: {text: "S'han desat els canvis al servidor", display:null, className:'putToServer'},
		gotFromServer: {text: "S'han recuperat els canvis des del servidor", display:null, className:'gotFromServer'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "tanca",
	tooltip: "Tanca aquest tiddler"});

merge(config.commands.closeOthers,{
	text: "tanca altres",
	tooltip: "Tanca tots els altres tiddlers"});

merge(config.commands.editTiddler,{
	text: "edita",
	tooltip: "Edita aquest tiddler",
	readOnlyText: "mostra",
	readOnlyTooltip: "Mostra el codi d'aquest tiddler"});

merge(config.commands.saveTiddler,{
	text: "desa",
	tooltip: "Desa els canvis d'aquest tiddler"});

merge(config.commands.cancelTiddler,{
	text: "anul·la",
	tooltip: "Anul·la els canvis a aquest tiddler",
	warning: "Segur que voleu anul·lar els canvis a '%0'?",
	readOnlyText: "fet",
	readOnlyTooltip: "Torna a l'aspecte normal"});

merge(config.commands.deleteTiddler,{
	text: "suprimeix",
	tooltip: "Suprimeix aquest tiddler",
	warning: "Segur que voleu suprimir '%0'?"});

merge(config.commands.permalink,{
	text: "enllaç permanent",
	tooltip: "Enllaç permanent d'aquest tiddler"});

merge(config.commands.references,{
	text: "referències",
	tooltip: "Obre els tiddlers que enllacen a aquest",
	popupNone: "sense referències"});

merge(config.commands.jump,{
	text: "salta",
	tooltip: "Salta a un altre tiddler obert"});

merge(config.commands.syncing,{
	text: "sincronitzant",
	tooltip: "Control de la sincronització d'aquest tiddler amb un servidor o fitxer extern",
	currentlySyncing: "<div>Es sincromitza <span class='popupHighlight'>'%0'</span> amb:</"+"div><div>servidor: <span class='popupHighlight'>%1</span></"+"div><div>workspace: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "No s'està sincronitzant",
	captionUnSync: "Atura la sincronització d'aquest tiddler",
	chooseServer: "Sincronitza aquest tiddler amb un altre servidor:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "camps",
	tooltip: "Mostra els camps ampliats d'aquest tiddler",
	emptyText: "Aquest tiddler no té camps ampliats",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Camp", type: 'String'},
			{name: 'Value', field: 'value', title: "Valor", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[ComComençar]]",
	MainMenu: "ComComençar\n\n[[Donacions]]\n© 2009 [[UnaMesa|http://www.unamesa.org/]]\n© 2009 [[frivière|http://pacoriviere.cat/]]\n\n\n^^TiddlyWiki versió <<version>>^^",
	SiteTitle: "El meu TiddlyWiki",
	SiteSubtitle: "bloc web personal no lineal, reutilitzable",
	SiteUrl: "http://www.tiddlywiki.com/",
	ComComençar: "Per començar amb aquest TiddlyWiki en blanc, heu de modificar els següents tiddlers:\n* [[TitolDelLloc|SiteTitle]] & [[SubtitolDelLloc|SiteSubtitle]]: El títol i el subtítol del lloc, com es mostra a sobre (un cop desats, també apareixeran a la barra de títols del navegador)\n* [[MenuPrincipal|MainMenu]]: El menú (normalment a l'esquerra)\n* [[TiddlersPerOmisio|DefaultTiddlers]]: Conté els noms dels tiddlers que voleu que apareguin quan s'obre el TiddlyWiki\nTambé heu d'entrar el vostre nom d'usuari per signar les vostres edicions: <<option txtUserName>>",
	Donacions: "La localització de TiddlyWiki al català és programari lliure, disponible gratuitament per tothom i sempre ho serà. Si feu  servir TiddlyWiki de forma regular i us resulta útil, podeu [[contribuïr amb una donació|https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=web%40pacoriviere%2ecat&item_name=Donaci%c3%b3%20per%20la%20localitzaci%c3%b3%20de%20TiddlyWiki%20al%20catal%c3%a0&amount=10%2e00&no_shipping=1&return=http%3a%2f%2fpacoriviere%2egooglepages%2ecom%2fTiddlyWiki%2ehtml&no_note=1&tax=0&currency_code=EUR&lc=ES&bn=PP%2dDonationsBF&charset=UTF%2d8]] encara que sigui modesta  a PayPal (com ara 10 Euros)",
	OptionsPanel: "Les opcions per personalitzar TiddlyWiki es desen al vostre navegador\n\nEl vostre nom per signar les vostres edicions. Escribiu-lo com una ParaulaWiki (com ara MartiCliment)\n<<option txtUserName>>\n<<option chkSaveBackups>> Desa còpies\n<<option chkAutoSave>> Desa automàticament\n<<option chkRegExpSearch>> Cerca expressions regulars\n<<option chkCaseSensitiveSearch>> Cerca sensible a caixa\n<<option chkAnimate>> Activa animacions\n\n----\nVeieu també les [[OpcionsAvançades|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "0DD MMM YYYY" "diari">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel opcions "Canvia les opcions avançades del TiddlyWiki">>',
	SideBarTabs: '<<tabs txtMainTab "Data" "Tiddlers per ordre cronològic" TabTimeline "Títol" "Tots els tiddlers" TabAll "Etiquetes" "Tiddlers etiquetats" TabTags "Més" "Més llistes" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Falten" "Tiddlers que no existeixen" TabMoreMissing "Orfes" "Tiddlers orfes" TabMoreOrphans Ombres "Tiddlers amb ombra" TabMoreShadowed>>',
	TiddlyWiki: "TiddlyWiki en català:\n\nhttp://projectes.lafarga.cat/projects/tiddlywiki\n[[Guia ràpida en català|http://projectes.lafarga.cat/projects/tiddlywiki/downloads/docs/152/14]]\n\nLloc web original de TiddlyWiki (en anglés):\n\nhttp://www.tiddlywiki.com/",
	});

merge(config.annotations,{
	AdvancedOptions: "Aquest tiddler ombra dóna accès a vàries opcions avançades",
	ColorPalette: "Els valors que hi ha en aquest tiddler ombra determinen l'esquema de colors de la interfície d'usuari de ~TiddlyWiki",
	DefaultTiddlers: "Els tiddlers que es llisten en aquest tiddler ombra es mostren quan arrenca ~TiddlyWiki",
	EditTemplate: "La plantilla HTML que hi ha en aquest tiddler ombra determina l'aspecte dels tiddlers mentre s'editen",
	GettingStarted: "Aquest tiddler ombra dóna instruccions bàsiques d'ús",
	ImportTiddlers: "Aquest tiddler ombra permet importar tiddlers",
	MainMenu: "Aquest tiddler ombra es fa servir per al contingut del menú principal de la columna de l'esquerra",
	MarkupPreHead: "Aquest tiddler s'inserta a la part superior de la secció <head> del fitxer HTML de TiddlyWiki",
	MarkupPostHead: "Aquest tiddler s'inserta a la part final de la secció <head> del fitxer HTML de TiddlyWiki",
	MarkupPreBody: "Aquest tiddler s'inserta a la part superior de la secció <body> del fitxer HTML de TiddlyWiki",
	MarkupPostBody: "Aquest tiddler s'inserta a la part final de la secció <body> del fitxer HTML de TiddlyWiki just abans del bloc de seqüències",
	OptionsPanel: "Aquest tiddler ombra es fa servir per al contingut del quadre d'opcions slider de la columna de la dreta",
	PageTemplate: "La plantilla HTML que hi ha en aquest tiddler ombra determina la disposició de ~TiddlyWiki",
	PluginManager: "Aquest tiddler ombra dóna access al gestor de connectors",
	SideBarOptions: "Aquest tiddler ombra es fa servir per al contingut del quadre d'opcions de la columna de la dreta",
	SideBarTabs: "Aquest tiddler ombra es fa servir per al contingut del quadre d'etiquetes de la columna de la dreta",
	SiteSubtitle: "Aquest tiddler ombra es fa servir per la segona part del títol de la pàgina",
	SiteTitle: "Aquest tiddler ombra es fa servir per la primera part del títol de la pàgina",
	SiteUrl: "Aquest tiddler ombra cal escriure l'adreça URL sencera per la publicació",
	StyleSheetColors: "Aquest tiddler ombra conté les definicions CSS relatives al color dels elements de la pàgina",
	StyleSheet: "Aquest tiddler pot contenir les vostres definicions CSS personalitzades",
	StyleSheetLayout: "Aquest tiddler ombra conté les definicions CSS relatives a la disposició dels elements de la pàgina",
	StyleSheetLocale: "Aquest tiddler ombra conté les definicions CSS relatives a la traducció local",
	StyleSheetPrint: "Aquest tiddler ombra conté les definicions CSS per la impressió",
	TabAll: "Aquest tiddler ombra conté el contingut de la pestanya 'Títol'de la columna de la dreta",
	TabMore: "Aquest tiddler ombra conté el contingut de la pestanya 'Més'de la columna de la dreta",
	TabMoreMissing: "Aquest tiddler ombra conté el contingut de la pestanya 'Falten'de la columna de la dreta",
	TabMoreOrphans: "Aquest tiddler ombra conté el contingut de la pestanya 'Orfes'de la columna de la dreta",
	TabMoreShadowed: "Aquest tiddler ombra conté el contingut de la pestanya 'Ombres'de la columna de la dreta",
	TabTags: "Aquest tiddler ombra conté el contingut de la pestanya 'Etiquetes'de la columna de la dreta",
	TabTimeline: "Aquest tiddler ombra conté el contingut de la pestanya 'Data'de la columna de la dreta",
	ToolbarCommands: "Aquest tiddler ombra determina quines ordres es mostren a les barres d'eines dels tiddlers",
	ViewTemplate: "La plantilla HTML que hi ha en aquest tiddler ombra determina l'aspecte dels tiddlers"
	});

//}}}
