/***
|''Name:''|GermanTranslationPlugin|
|''Description:''|German Translation for TiddlyWiki|
|''Author:''|BesimKaradeniz (besim (at) karadeniz (dot) de)|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/de/locale.de.js |
|''Version:''|2.6.2|
|''Date:''|Feb 14, 2011|
|''Comments:''|Visit the home of this translation on [[TiddlyWikiDeutsch|http://www.karadeniz.de/tiddlywiki/]] |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.6.2|
***/

//{{{
//-- TiddlyWiki German Translation - r12569
//-- Maintainer: Besim Karadeniz <besim(-at-)karadeniz(-dot-)de>
//-- Web: www.karadeniz.de/tiddlywiki/
//--

config.locale = "de"; // W3C language tag

if (config.options.txtUserName == "YourName")
	merge(config.options,{txtUserName: "IhrName"});

merge(config.tasks,{
	save: {text: "speichern", tooltip: "Änderungen in dieses TiddlyWiki speichern", action: saveChanges},
	sync: {text: "synchronisieren", tooltip: "Änderungen mit anderen TiddlyWiki-Dateien und Servern synchronisieren", content: '<<sync>>'},
	importTask: {text: "importieren", tooltip: "Tiddler und Plugins aus anderen TiddlyWiki-Dateien und Servern importieren", content: '<<importTiddlers>>'},
	tweak: {text: "optimieren", tooltip: "Erscheinungsbild und Reaktion des TiddlyWiki optimieren", content: '<<options>>'},
	upgrade: {text: "upgraden", tooltip: "Upgraden des Kerncodes von TiddlyWiki", content: '<<upgrade>>'},
	plugins: {text: "Plugins", tooltip: "Installierte Plugins verwalten", content: '<<plugins>>'}
});

// Optionen, die im Options-Panel oder/in Cookies eingestellt werden koennen
merge(config.optionsDesc,{
	txtUserName: "Ihr Benutzername zum Unterzeichnen Ihrer Einträge",
	chkRegExpSearch: "Reguläre Ausdrücke in der Suche aktivieren",
	chkCaseSensitiveSearch: "Groß-/Kleinschreibung in der Suche aktivieren",
	chkIncrementalSearch: "Inkrementelle Zeichen-für-Zeichen-Suche",
	chkAnimate: "Animationen aktivieren",
	chkSaveBackups: "Beim Speichern ein Backup erstellen",
	chkAutoSave: "Automatisch speichern",
	chkGenerateAnRssFeed: "RSS-Feed beim Speichern generieren",
	chkSaveEmptyTemplate: "Leere Vorlage beim Speichern generieren",
	chkOpenInNewWindow: "Externe Links in einem neuen Fenster öffnen",
	chkToggleLinks: "Klick auf geöffnete Tiddler lässt diese schließen",
	chkHttpReadOnly: "Bearbeitungsfunktionen ausblenden, wenn Zugriff via HTTP",
	chkForceMinorUpdate: "Bearbeitungen als kleine Änderungen mit Beibehaltung von Datum und Zeit behandeln",
	chkConfirmDelete: "Löschbestätigung vor dem Löschen von Tiddlern",
	chkInsertTabs: "Benutzen Sie die Tabulatortaste um Tabulatorzeichen einzufügen anstelle jeweils zum nächsten Feld zu springen",
	txtBackupFolder: "Verzeichnisname für Backup Dateien:",
	txtMaxEditRows: "Maximale Zahl von Zeilen in einer Textbox eines Tiddlers:",
	txtTheme: "Name des zu verwendenden Themes",
	txtFileSystemCharSet: "Standard-Zeichensatz beim Speichern von Änderungen (nur Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Beim Laden von Plugins sind Fehler aufgetreten. Siehe PluginManager für Details",
	pluginError: "Fehler: %0",
	pluginDisabled: "Nicht ausgeführt, da durch 'systemConfigDisable'-Tag deaktiviert",
	pluginForced: "Ausgeführt, da durch 'systemConfigForce'-Tag erzwungen",
	pluginVersionError: "Nicht ausgeführt, da dieses Plugin eine neuere Version von TiddlyWiki erfordert",
	nothingSelected: "Nichts ausgewählt. Sie müssen zuerst ein oder mehrere Elemente auswählen",
	savedSnapshotError: "Es scheint, dass dieses TiddlyWiki inkorrekt gespeichert wurde. Bitte besuchen Sie http://www.tiddlywiki.com/#Download für Details",
	subtitleUnknown: "(unbekannt)",
	undefinedTiddlerToolTip: "Der Tiddler '%0' existiert noch nicht",
	shadowedTiddlerToolTip: "Der Tiddler '%0' existiert noch nicht, hat aber einen vordefinierten Schatteneintrag",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Externer Link zu %0",
	noTags: "Es gibt keine getaggten Tiddler",
	notFileUrlError: "Sie müssen zunächst dieses TiddlyWiki in eine Datei speichern, bevor Änderungen gespeichert werden können",
	cantSaveError: "Änderungen können nicht gespeichert werden. Mögliche Gründe:\n- Ihr Browser unterstützt das Abspeichern nicht (Firefox, Internet Explorer, Safari und Opera können dies mit richtiger Konfiguration)\n- Der Pfadname zu Ihrem TiddlyWiki enthält ungültige Zeichen\n- Die TiddlyWiki-HTML-Datei wurde verschoben oder umbenannt",
	invalidFileError: "Die originale Datei '%0' scheint kein gültiges TiddlyWiki zu sein",
	backupSaved: "Backup gespeichert",
	backupFailed: "Fehler beim Speichern des Backup",
	rssSaved: "RSS-Feed gespeichert",
	rssFailed: "Fehler beim Speichern des RSS-Feed",
	emptySaved: "Leere Vorlage gespeichert",
	emptyFailed: "Fehler beim Speichern der leeren Vorlage",
	mainSaved: "TiddlyWiki-Datei gespeichert",
	mainFailed: "Fehler beim Speichern der TiddlyWiki-Datei. Ihre Änderungen wurden nicht gespeichert",
	macroError: "Fehler im Makro <<\%0>>",
	macroErrorDetails: "Fehler beim Ausführen von Makro <<\%0>>:\n%1",
	missingMacro: "Kein entsprechendes Makro vorhanden",
	overwriteWarning: "Ein Tiddler namens '%0' existiert bereits. Wählen Sie OK zum Überschreiben",
	unsavedChangesWarning: "WARNUNG! Ungespeicherte Änderungen im TiddlyWiki vorhanden\n\nWählen Sie OK zum Speichern\nWählen Sie ABBRECHEN/CANCEL zum Verwerfen",
	confirmExit: "--------------------------------\n\nUngespeicherte Änderungen im TiddlyWiki vorhanden. Wenn Sie fortfahren, werden Sie diese Änderungen verlieren\n\n--------------------------------",
	saveInstructions: "SaveChanges",
	unsupportedTWFormat: "Nicht unterstütztes TiddlyWiki-Format '%0'",
	tiddlerSaveError: "Fehler beim Speichern von Tiddler '%0'",
	tiddlerLoadError: "Fehler beim Laden von Tiddler '%0'",
	wrongSaveFormat: "Speichern im Speicherformat '%0' nicht möglich. Standardformat zum Speichern wird verwendet.",
	invalidFieldName: "Ungültiger Dateiname %0",
	fieldCannotBeChanged: "Feld '%0' kann nicht geändert werden",
	loadingMissingTiddler: "Es wird versucht, den Tiddler '%0' vom Server '%1' bei\n\n'%2' im Workspace '%3' abzurufen",
	upgradeDone: "Das Upgrade auf Version %0 ist komplett\n\nKlicken Sie auf 'OK' zum Neuladen des aktualisierten TiddlyWiki",
	invalidCookie: "Ungültiger Cookie '%0'"});

merge(config.messages.messageClose,{
	text: "schließen",
	tooltip: "diesen Textbereich schließen"});

config.messages.backstage = {
	open: {text: "Backstage", tooltip: "Öffnen Sie den Backstage-Bereich für Arbeiten an Entwicklungs- und Bearbeitungsaufgaben"},
	close: {text: "schließen", tooltip: "Backstage-Bereich schließen"},
	prompt: "Backstage: ",
	decal: {
		edit: {text: "bearbeiten", tooltip: "Den Tiddler '%0' bearbeiten"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klick für den vollen Text dieses Tiddlers",
	previewUnavailable: "(Vorschau nicht vorhanden)"
};

config.messages.dates.months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November","Dezember"];
config.messages.dates.days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
config.messages.dates.shortDays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
// Suffixe für Datum (englischsprachig), z.B. "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
	"th","th","th","th","th","th","th","th","th","th",
	"st","nd","rd","th","th","th","th","th","th","th",
	"st"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "keine Tags",
	labelTags: "Tags: ",
	openTag: "Öffne Tag '%0'",
	tooltip: "Zeige Tiddlers mit Tags '%0'",
	openAllText: "Öffne alle",
	openAllTooltip: "Alle diese Tiddler öffnen",
	popupNone: "Keine anderen Tiddler mit '%0' getaggt"});

merge(config.views.wikified,{
	defaultText: "Der Tiddler '%0' existiert noch nicht. Doppelklicken zum Erstellen",
	defaultModifier: "(fehlt)",
	shadowModifier: "(vordefinierter Schatten-Tiddler)",
	dateFormat: "DD. MMM YYYY",
	createdPrompt: "erstellt"});

merge(config.views.editor,{
	tagPrompt: "Geben Sie die Tags durch Leerstellen getrennt ein, [[benutzen Sie doppelte eckige Klammern]] falls nötig, oder wählen Sie vorhandene",
	defaultText: "Geben Sie den Text für '%0' ein"});

merge(config.views.editor.tagChooser,{
	text: "Tags",
	tooltip: "Wählen Sie vorhandene Tags zum Hinzufügen zu diesem Tiddler aus",
	popupNone: "Es sind keine Tags definiert",
	tagTooltip: "Tag '%0' hinzufügen"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "suchen",
	prompt: "Dieses TiddlyWiki durchsuchen",
	accessKey: "F",
	successMsg: "%0 Tiddler gefunden, die %1 enthalten",
	failureMsg: "Keine Tiddler gefunden, die %0 enthalten"});

merge(config.macros.tagging,{
	label: "Tagging: ",
	labelNotTag: "kein Tagging",
	tooltip: "Liste der Tiddler, die mit '%0' getaggt sind"});

merge(config.macros.timeline,{
	dateFormat: "DD. MMM YYYY"});

merge(config.macros.allTags,{
	tooltip: "Tiddler, die mit '%0' getagged sind, anzeigen",
	noTags: "Keine getaggten Tiddler vorhanden"});

config.macros.list.all.prompt = "Alle Tiddler in alphabetischer Reihenfolge";
config.macros.list.missing.prompt = "Tiddler, auf die verwiesen wird, die aber nicht existieren";
config.macros.list.orphans.prompt = "Tiddler, auf die nicht von anderen Tiddlern verwiesen wird";
config.macros.list.shadowed.prompt = "Tiddler, für die Standardeinträge existieren";
config.macros.list.touched.prompt = "Tiddlers, die lokal verändert wurden";

merge(config.macros.closeAll,{
	label: "alle schließen",
	prompt: "Alle angezeigten Tiddler schließen (außer denen, die gerade bearbeitet werden)"});

merge(config.macros.permaview,{
	label: "Permaview",
	prompt: "Erzeugt einen URL, mit dem auf alle gerade geöffneten Tiddler verwiesen werden kann"});

merge(config.macros.saveChanges,{
	label: "Änderungen speichern",
	prompt: "Alle Änderungen speichern",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "Neuer Tiddler",
	prompt: "Neuen Tiddler erstellen",
	title: "Neuer Tiddler",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "Neues Journal",
	prompt: "Neuen Tiddler mit aktuellem Datum und aktueller Zeit erstellen",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Erweiterte Optionen verändern",
	step1Title: "Diese Optionen werden mit Cookies in Ihrem Browser gespeichert",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Unbekannte Optionen anzeigen</input>",
	unknownDescription: "//(unbekannt)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Option", type: 'String'},
			{name: 'Description', field: 'description', title: "Beschreibung", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Name", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Plugins verwalten",
	step1Title: "Aktuell geladene Plugins",
	step1Html: "<input type='hidden' name='markList'></input>",
	skippedText: "(Dieses Plugin wurde nicht ausgeführt, da es nach dem Start hinzugefügt wurde)",
	noPluginText: "Es sind keine Plugins installiert",
	confirmDeleteText: "Wollen Sie wirklich folgende Plugins löschen:\n\n%0",
	removeLabel: "systemConfig-Tag entfernen",
	removePrompt: "systemConfig-Tag entfernen",
	deleteLabel: "löschen",
	deletePrompt: "Diese Tiddler endgültig löschen",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Beschreibung", type: 'String'},
			{name: 'Version', field: 'Version', title: "Version", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Größe", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Erzwungen", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Deaktiviert", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Geladen", type: 'Boolean', trueText: "Ja", falseText: "Nein"},
			{name: 'Startup Time', field: 'startupTime', title: "Startzeit", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Fehler", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]},
	listViewTemplateReadOnly: {
		columns: [
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Beschreibung", type: 'String'},
			{name: 'Version', field: 'Version', title: "Version", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Größe", type: 'Size'},
			{name: 'Executed', field: 'executed', title: "Geladen", type: 'Boolean', trueText: "Ja", falseText: "Nein"},
			{name: 'Startup Time', field: 'startupTime', title: "Startzeit", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Fehler", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "mehr",
	morePrompt: "Weitere Funktionen anzeigen",
	lessLabel: "weniger",
	lessPrompt: "Zusätzliche Befehle verstecken",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "aktualisieren",
	prompt: "Gesamte TiddlyWiki-Ansicht aktualisieren"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Sie können nicht in eine schreibgeschützte TiddlyWiki-Datei importieren. Versuchen Sie diese über eine file:// URL zu öffnen",
	wizardTitle: "Tiddler aus anderer Datei oder anderem Server importieren",
	step1Title: "Schritt 1: Server oder TiddlyWiki-Datei ausfindig machen",
	step1Html: "Typ des Servers auswählen: <select name='selTypes'><option value=''>Wählen...</option></select><br>URL oder Pfadnamen eingeben: <input type='text' size=50 name='txtPath'><br>...oder nach einer Datei browsen: <input type='file' size=50 name='txtBrowse'><br><hr>...oder einen vordefinierten Feed auswählen: <select name='selFeeds'><option value=''>Wählen...</option></select>",
	openLabel: "öffnen",
	openPrompt: "Verbindung zu dieser Datei oder Server starten",
	statusOpenHost: "Verbindung zum Host starten",
	statusGetWorkspaceList: "Liste von vorhandenen Workspaces abrufen",
	step2Title: "Schritt 2: Workspace auswählen",
	step2Html: "Einen Workspace-Namen eingeben: <input type='text' size=50 name='txtWorkspace'><br>...oder ein Workspace auswählen: <select name='selWorkspace'><option value=''>Wählen...</option></select>",
	cancelLabel: "abbrechen",
	cancelPrompt: "Diesen Import abbrechen",
	statusOpenWorkspace: "Workspace wird geöffnet",
	statusGetTiddlerList: "Abrufen der Liste von vorhandenen Workspaces",
	errorGettingTiddlerList: "Fehler beim Abrufen der Liste der Tiddler, klicken Sie auf ABBRECHEN/CANCEL, um es nochmal zu probieren",
	step3Title: "Schritt 3: Zu importierende Tiddler auswählen",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Links dieser Tiddler zum Server erhalten, um nachfolgende Änderungen synchronisieren zu können</input><br><input type='checkbox' checked='false' name='chkSave'>Speichern der Details dieses Servers in einem 'systemServer'Tiddler namens:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importieren",
	importPrompt: "Diese Tiddler importieren",
	confirmOverwriteText: "Wollen Sie wirklich folgende Tiddler überschreiben:\n\n%0",
	step4Title: "Schritt 4: Importieren von %0 Tiddler",
	step4Html: "<input type='hidden' name='markReport'></input>",
	doneLabel: "Erledigt",
	donePrompt: "Diesen Assistenten schließen",
	statusDoingImport: "Tiddler werden importiert",
	statusDoneImport: "Alle Tiddler importiert",
	systemServerNamePattern: "%2 auf %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Der Tiddler '%0' existiert bereits. Klicken Sie auf 'OK' um ihn mit den Details dieses Servers zu überschreiben, oder 'Abbrechen', um ihn unverändert zu lassen",
	serverSaveTemplate: "|''Eingabe:''|%0|\n|''URL:''|%1|\n|''Workspace:''|%2|\n\nDieser Tiddler wurde automatisch erstellt, um Details dieses Servers aufzuzeichnen",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Größe", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Tags", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Upgraden des Kerncodes von TiddlyWiki",
	step1Title: "Update oder Reparatur dieses TiddlyWiki auf die aktuellste Version",
	step1Html: "Sie sind dabei, auf die aktuellste Version des TiddlyWiki-Kerncodes upzugraden (von <a href='%0' class='externalLink' target='_blank'>%1</a>). Ihre Inhalte werden während dem Upgrade erhalten bleiben.<br><br>Bitte beachten Sie, dass Kerncode-Updates mit älteren Plugins kollidieren können. Wenn Sie Probleme mit der aktualisierten Datei beobachten, besuchen Sie bitte <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "Upgrade dieses TiddlyWiki nicht möglich. Sie können nur lokal abgespeicherte TiddlyWiki-Dateien upgraden",
	errorNotSaved: "Sie müssen zunächst Änderungen speichern, bevor Sie ein Upgrade starten können",
	step2Title: "Upgrade-Details bestätigen",
	step2Html_downgrade: "Sie sind dabei, von der TiddlyWiki-Version %1 auf die Version %0 downzugraden.<br><br>Der Downgrade auf eine frühere Version von TiddlyWiki wird nicht empfohlen",
	step2Html_restore: "Dieses TiddlyWiki scheint bereits die aktuellste Version des Kerncodes (%0) einzusetzen.<br><br>Sie können mit dem Upgrade fortsetzen, um sicherzustellen, dass der Kerncode nicht korrumpiert oder beschädigt wurde",
	step2Html_upgrade: "Sie sind dabei, von der TiddlyWiki-Version %1 auf die Version %0 upzugraden",
	upgradeLabel: "upgraden",
	upgradePrompt: "Vorbereiten des Upgrade-Prozesses",
	statusPreparingBackup: "Backup vorbereiten",
	statusSavingBackup: "Backup-Datei speichern",
	errorSavingBackup: "Ein Problem mit dem Speichern der Backup-Datei ist aufgetreten",
	statusLoadingCore: "Kerncode laden",
	errorLoadingCore: "Fehler beim Laden des Kerncodes",
	errorCoreFormat: "Fehler im neuen Kerncode",
	statusSavingCore: "Neuen Kerncode speichern",
	statusReloadingCore: "Neuen Kerncode neu laden",
	startLabel: "starten",
	startPrompt: "Upgrade-Prozess starten",
	cancelLabel: "abbrechen",
	cancelPrompt: "Upgrade-Prozess abbrechen",
	step3Title: "Upgrade abgebrochen",
	step3Html: "Sie haben den Upgrade-Prozess abgebrochen"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Server-Typ", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Server-Host", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Server-Workspace", type: 'String'},
			{name: 'Status', field: 'status', title: "Status der Synchronisation", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Server-URL", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Diese Tiddler synchronisieren", name: 'sync'}
			]},
	wizardTitle: "Mit externen Servern oder Dateien synchronisieren",
	step1Title: "Wählen Sie die Tiddler aus, die Sie synchronisieren möchten",
	step1Html: '<input type="hidden" name="markList"></input>',
	syncLabel: "synchronisieren",
	syncPrompt: "Diese Tiddler synchronisieren",
	hasChanged: "Verändert während Trennung",
	hasNotChanged: "Unverändert während Trennung",
	syncStatusList: {
		none: {text: "...", display:'none', className:'notChanged'},
		changedServer: {text: "Auf dem Server geändert", display:null, className:'changedServer'},
		changedLocally: {text: "Im ausgesteckten Zustand geändert", display:null, className:'changedLocally'},
		changedBoth: {text: "Im ausgesteckten Zustand und auf dem Server geändert", display:null, className:'changedBoth'},
		notFound: {text: "Auf dem Server nicht gefunden", display:null, className:'notFound'},
		putToServer: {text: "Aktualisierung auf dem Server gespeichert", display:null, className:'putToServer'},
		gotFromServer: {text: "Aktualisierung vom Server abgerufen", display:null, className:'gotFromServer'}
		}
	});

merge(config.macros.annotations,{
	});

merge(config.commands.closeTiddler,{
	text: "schließen",
	tooltip: "Diesen Tiddler schließen"});

merge(config.commands.closeOthers,{
	text: "andere schließen",
	tooltip: "Alle anderen Tiddler schließen"});

merge(config.commands.editTiddler,{
	text: "bearbeiten",
	tooltip: "Diesen Tiddler bearbeiten",
	readOnlyText: "betrachten",
	readOnlyTooltip: "Quellcode dieses Tiddlers betrachten"});

merge(config.commands.saveTiddler,{
	text: "fertig",
	tooltip: "Änderungen an diesem Tiddler speichern"});

merge(config.commands.cancelTiddler,{
	text: "abbrechen",
	tooltip: "Änderungen an diesem Tiddler verwerfen",
	warning: "Wollen Sie wirklich Änderungen in '%0' verwerfen?",
	readOnlyText: "fertig",
	readOnlyTooltip: "Diesen Tiddler normal anzeigen"});

merge(config.commands.deleteTiddler,{
	text: "löschen",
	tooltip: "Diesen Tiddler löschen",
	warning: "Wollen Sie '%0' wirklich löschen?"});

merge(config.commands.permalink,{
	text: "Permalink",
	tooltip: "Permalink für diesen Tiddler"});

merge(config.commands.references,{
	text: "Referenzen",
	tooltip: "Alle Tiddler zeigen, die auf diesen verweisen",
	popupNone: "Keine Referenzen"});

merge(config.commands.jump,{
	text: "springen",
	tooltip: "Zu anderem, geöffneten Tiddler springen"});

merge(config.commands.syncing,{
	text: "Synchronisierung läuft",
	tooltip: "Synchronisation dieses Tiddlers mit einem Server oder einer externen Datei kontrollieren",
	currentlySyncing: "<div>Aktuell am Synchronisieren mit <span class='popupHighlight'>'%0'</span> zu:</"+"div><div>Host: <span class='popupHighlight'>%1</span></"+"div><div>Workspace: <span class='popupHighlight'>%2</span></"+"div>", // Hinweis - Das Schließen des <div>-Tag verlassen
	notCurrentlySyncing: "Derzeit keine Synchronisierung",
	captionUnSync: "Synchronisierung dieses Tiddlers stoppen",
	chooseServer: "Diesen Tiddler mit anderem Server synchronisieren:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "Felder",
	tooltip: "Erweiterte Felder dieses Tiddlers anzeigen",
	emptyText: "Keine erweiterten Felder für diesen Tiddler vorhanden",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Feld", type: 'String'},
			{name: 'Value', field: 'value', title: "Wert", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[GettingStarted]]",
	MainMenu: "[[GettingStarted]]",
	SiteTitle: "Mein TiddlyWiki",
	SiteSubtitle: "ein wiederverwendbares nichtlineares, persönliches ~Web-Notizbuch",
	SiteUrl: "",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD. MMM YYYY" "Journal">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "Optionen \u00bb" "Optionen von TiddlyWiki ändern">>',
	SideBarTabs: '<<tabs txtMainTab "Zeitachse" "Zeitachse" TabTimeline "Alles" "Alle Tiddler" TabAll "Tags" "Alle Tags" TabTags "Mehr" "Weitere Listen" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Fehlend" "Fehlende Tiddler" TabMoreMissing "Waisen" "Verwaiste Tiddler" TabMoreOrphans "Schatten" "Tiddler mit Schatteneinträgen" TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "Dieser Schatten-Tiddler bietet Zugang zu diversen erweiterten Optionen",
	ColorPalette: "Diese Werte in diesem Schatten-Tiddler legen das Farbschema der Benutzerschnittstelle des TiddlyWiki fest",
	DefaultTiddlers: "Die in diesem Schatten-Tiddler aufgelisteten Tiddler werden automatisch beim Start des TiddlyWiki angezeigt",
	EditTemplate: "Die HTML-Vorlage in diesem Schatten-Tiddler legt das Aussehen von Tiddler während ihrer Bearbeitung fest",
	GettingStarted: "Dieser Schatten-Tiddler bietet eine einfache Bedienungsanleitung",
	ImportTiddlers: "Dieser Schatten-Tiddler bietet Zugang zum Import von Tiddler",
	MainMenu: "Dieser Schatten-Tiddler dient als Container für das Hauptmenü in der linksseitigen Spalte des Bildschirms",
	MarkupPreHead: "Dieser Tiddler wird an der Spitze der <head>-Sektion der HTML-Datei des TiddlyWiki eingefügt",
	MarkupPostHead: "Dieser Tiddler wird am Ende der <head>-Sektion der HTML-Datei des TiddlyWiki eingefügt",
	MarkupPreBody: "Dieser Tiddler wird an der Spitze der <body>-Sektion der HTML-Datei des TiddlyWiki eingefügt",
	MarkupPostBody: "Dieser Tiddler wird am Ende der <body>-Sektion der HTML-Datei des TiddlyWiki unmittelbar nach dem Scriptblock eingefügt",
	OptionsPanel: "Dieser Schatten-Tiddler dient als Container für das einblendbare Optionsfeld in der rechtsseitigen Seitenleiste",
	PageTemplate: "Die HTML-Vorlage in diesem Schatten-Tiddler legt das allgemeine Aussehen des TiddlyWiki fest",
	PluginManager: "Dieser Schatten-Tiddler bietet Zugang zum Plugin-Manager",
	SideBarOptions: "Dieser Schatten-Tiddler dient als Container für das Optionsfeld in der rechtsseitigen Seitenleiste",
	SideBarTabs: "Dieser Schatten-Tiddler dient als Container für das Tab-Panel in der rechtsseitigen Seitenleiste",
	SiteSubtitle: "Dieser Schatten-Tiddler enthält den zweiten Teil der Seitenüberschrift",
	SiteTitle: "Dieser Schatten-Tiddler enthält den ersten Teil der Seitenüberschrift",
	SiteUrl: "Dieser Schatten-Tiddler sollte den vollständigen Ziel-URL der Veröffentlichung enthalten",
	StyleSheetColors: "Dieser Schatten-Tiddler enthält CSS-Definitionen bezüglich der Farbe von Seitenelementen. ''DIESEN TIDDLER NICHT BEARBEITEN'', fügen Sie Ihre Änderungen stattdessen in den StyleSheet-Schatten-Tiddler ein",
	StyleSheet: "Dieser Tiddler kann benutzerspezifische CSS-Definitionen enthalten",
	StyleSheetLayout: "Dieser Schatten-Tiddler enthält CSS-Definitionen bezüglich dem Aussehen von Seitenelementen. ''DIESEN TIDDLER NICHT BEARBEITEN'', fügen Sie Ihre Änderungen stattdessen in den StyleSheet-Schatten-Tiddler ein",
	StyleSheetLocale: "Dieser Schatten-Tiddler enthält CSS-Definitionen bezüglich lokale Übersetzungen",
	StyleSheetPrint: "Dieser Schatten-Tiddler enthält CSS-Definitionen zum Drucken",
	SystemSettings: "Dieser Tiddler wird zum Speichern von Konfigurationsoptionen für dieses TiddlyWiki-Dokument genutzt",
	TabAll: "Dieser Schatten-Tiddler enthält den Inhalt des 'Alles'-Tab in der rechtsseitigen Seitenleiste",
	TabMore: "Dieser Schatten-Tiddler enthält den Inhalt des 'Mehr'-Tab in der rechtsseitigen Seitenleiste",
	TabMoreMissing: "Dieser Schatten-Tiddler enthält den Inhalt des 'Fehlend'-Tab in der rechtsseitigen Seitenleiste",
	TabMoreOrphans: "Dieser Schatten-Tiddler enthält den Inhalt des 'Waisen'-Tab in der rechtsseitigen Seitenleiste",
	TabMoreShadowed: "Dieser Schatten-Tiddler enthält den Inhalt des 'Schatten'-Tab in der rechtsseitigen Seitenleiste",
	TabTags: "Dieser Schatten-Tiddler enthält den Inhalt des 'Tags'-Tab in der rechtsseitigen Seitenleiste",
	TabTimeline: "Dieser Schatten-Tiddler enthält den Inhalt des 'Zeitachse'-Tab in der rechtsseitigen Seitenleiste",
	ToolbarCommands: "Dieser Schatten-Tiddler legt fest, welche Befehle in Tiddler-Toolbars angezeigt werden",
	ViewTemplate: "Die HTML-Vorlage in diesem Schatten-Tiddler legt das Aussehen der Tiddler fest"
	});

// Uebersetzungen von Schatten-Tiddlern ausserhalb der offiziellen lingo.js
merge(config.shadowTiddlers,{
	OptionsPanel: "Diese [[Interface-Einstellungen|InterfaceOptions]] zur Anpassung von TiddlyWiki werden in Ihrem Browser gespeichert\n\nIhr Benutzername zum Unterzeichnen Ihrer Einträge. Bitte als WikiWord (z.B. KlausBrandmüller) schreiben\n\n<<option txtUserName>>\n<<option chkSaveBackups>> [[Backups speichern|SaveBackups]]\n<<option chkAutoSave>> [[Automatisch speichern|AutoSave]]\n<<option chkRegExpSearch>> [[RegExp Suche|RegExpSearch]]\n<<option chkCaseSensitiveSearch>> [[Groß-/Kleinschreibung in Suche|CaseSensitiveSearch]]\n<<option chkAnimate>> [[Animationen aktivieren|EnableAnimations]]\n\n----\[[Erweiterte Optionen|AdvancedOptions]]\nPluginManager\nImportTiddlers",
	GettingStarted: "Um mit diesem TiddlyWiki zu starten, sollten Sie folgende Tiddler modifizieren:\n* SiteTitle & SiteSubtitle: Den [[Titel|SiteTitle]] und [[Untertitel|SiteSubtitle]] der Site, wie oben angezeigt (nach dem Speichern werden diese auch in der Titelzeile des Browsers angezeigt)\n* MainMenu: Ihr Inhaltsverzeichnis (für gewöhnlich Links)\n* DefaultTiddlers: Beinhaltet die Namen der Tiddler, die Sie angezeigt haben möchten, wenn das TiddlyWiki geöffnet wird.\nSie sollten zudem Ihren Benutzernamen zum Unterzeichnen Ihrer Bearbeitungen eingeben: <<option txtUserName>>",
	ViewTemplate: "<div class='toolbar' macro='toolbar -closeTiddler closeOthers +editTiddler permalink references jump'></div>\n<div class='title' macro='view title'></div>\n<div class='subtitle'><span macro='view modifier link'></span>, <span macro='view modified date'></span> (erstellt am <span macro='view created date'></span>)</div>\n<div class='tagging' macro='tagging'></div>\n<div class='tagged' macro='tags'></div>\n<div class='viewer' macro='view text wikified'></div>\n<div class='tagClear'></div>",
	InterfaceOptions: "Die [[Interface-Einstellungen|InterfaceOptions]] werden angezeigt, wenn Sie rechts auf 'Optionen' klicken. Sie werden mit einem Cookie in Ihrem Browser gespeichert, um sie zwischen den Aufrufen zu sichern. Nähere Informationen zu den einzelnen Funktionen finden Sie, wenn Sie die Funktion selbst anklicken.",
	WikiWord: "Ein WikiWord ist ein Wort, das aus mehreren einzelnen Wörtern zusammengesetzt ist, in dem jedes Wort mit einem Großbuchstaben beginnt und eine individuelle Seite bezeichnet.",
	SaveBackups: "[[Backups speichern|SaveBackups]] ist eine Funktion, mit der automatisch bei jedem Abspeichern ein Backup erstellt wird.",
	AutoSave: "[[Automatisches Speichern|AutoSave]] speichert automatisch Änderungen jedes Mal, wenn Sie einen Tiddler bearbeiten. Damit sinken die Chancen, dass Sie Daten verlieren. Beachten Sie jedoch, dass bei aktivierter [[Backup-Funktion|SaveBackups]] natürlich auch eine Menge Backup-Dateien erstellt werden. Entscheiden Sie sich deshalb für die eine oder andere Funktion.",
	RegExpSearch: "Mit der [[RegExp Suche|RegExpSearch]] können Sie mit regulären Suchausdrücken flexible Suchanfragen vornehmen.",
	CaseSensitiveSearch: "Die Unterscheidung der [[Groß-/Kleinschreibung in Suche|CaseSensitiveSearch]] tut genau dies.",
	EnableAnimations: "Diese Funktion aktiviert Animationen, wenn Sie einen Tiddler öffnen oder schließen.",
	GenerateAnRssFeed: "Wenn Sie [[RSS-Feed generieren|GenerateAnRssFeed]] aktivieren, speichert TiddlyWiki automatisch einen RSS-2.0-gültigen Feed, so bald Ihr TiddlyWiki gespeichert wird. Der Feed hat den gleichen Dateinamen wie das TiddlyWiki, lediglich jedoch mit der Endung '.xml'.",
	OpenLinksInNewWindow: "Diese Funktion öffnet externe Links in einem neuen ~Browser-Fenster.",
	SaveEmptyTemplate: "Diese Funktion erwirkt, dass beim Abspeichern von Änderungen eine leere Vorlage von TiddlyWiki erzeugt wird. Dies ist als Hilfe gedacht für Entwickler, die Adaptionen von TiddlyWiki bereitstellen. Die Funktion ist nicht erforderlich, wenn Sie ein normaler Benutzer sind.",
	HideEditingFeatures: "Ist diese Funktion aktiviert, werden die Bearbeitungsfunktionen ausgeblendet, wenn das TiddlyWiki über HTTP aufgerufen wird. Der Benutzer hat dann die Möglichkeit, den Tiddler zwar betrachten zu können, aber nicht zu bearbeiten.",
	MinorChanged: "Manchmal ist es sinnvoll, dass bei kleinen Änderungen der Tiddler in der Zeitachse nicht automatisch an den Anfang gesetzt wird. Mit Aktivierung dieser Funktion werden alle Bearbeitungen von Tiddlern als kleine Änderungen betrachtet und das Änderungsdatum nicht geändert.",
	ConfirmBeforeDeleting: "Bei Aktivierung dieser Funktion fordert TiddlyWiki eine Bestätigung des Benutzers an, wenn ein Tiddler gelöscht werden soll."});
	