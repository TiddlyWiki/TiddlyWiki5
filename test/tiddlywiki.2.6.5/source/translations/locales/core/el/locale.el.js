/***
|''Name:''|GreekTranslationPlugin|
|''Description:''|Μετάφραση του TiddlyWiki στα Ελληνικά (Translation of TiddlyWiki into Greek) |
|''Author:''|Spyros Kroustalakis (spyros.kroustalakis (at) gmail (dot) com)|
|''Empty greek tiddlywiki:''|http://spyros.kroustalakis.googlepages.com/empty_gr.html |
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/el/locale.el.js |
|''Version:''|1.0.0|
|''Date:''|May 6, 2007|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev |
|''~CoreVersion:''|2.2|

***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "el"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "ΤοΟνομαΣου"});

merge(config.tasks,{
	save: {text: "αποθήκευση", tooltip: "Σώσε τις αλλαγές αυτού του TiddlyWiki", action: saveChanges},
	sync: {text: "συγχρονισμός", tooltip: "Συγχρόνισε τις αλλαγές με άλλα TiddlyWiki αρχεία ή servers", content: '<<sync>>'},
	importTask: {text: "εισαγωγή", tooltip: "Εισαγωγή παραγράφων και πρόσθετων από άλλα TiddlyWiki αρχεία και διακομιστές", content: '<<importTiddlers>>'},
	tweak: {text: "αλλαγή", tooltip: "Αλλαγή της εμφάνισης και της συμπεριφοράς του TiddlyWiki", content: '<<options>>'},
	plugins: {text: "πρόσθετα", tooltip: "Διαχείριση των πρόσθετων που εγκαταστάθηκαν", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Username for signing your edits",
	chkRegExpSearch: "Enable regular expressions for searches",
	chkCaseSensitiveSearch: "Case-sensitive searching",
	chkAnimate: "Enable animations",
	chkSaveBackups: "Keep backup file when saving changes",
	chkAutoSave: "Automatically save changes",
	chkGenerateAnRssFeed: "Generate an RSS feed when saving changes",
	chkSaveEmptyTemplate: "Generate an empty template when saving changes",
	chkOpenInNewWindow: "Open external links in a new window",
	chkToggleLinks: "Clicking on links to open tiddlers causes them to close",
	chkHttpReadOnly: "Hide editing features when viewed over HTTP",
	chkForceMinorUpdate: "Don't update modifier username and date when editing tiddlers",
	chkConfirmDelete: "Require confirmation before deleting tiddlers",
	chkInsertTabs: "Use the tab key to insert tab characters instead of moving between fields",
	txtBackupFolder: "Name of folder to use for backups",
	txtMaxEditRows: "Maximum number of rows in edit boxes",
	txtFileSystemCharSet: "Default character set for saving changes (Firefox/Mozilla only)"});

merge(config.messages,{
	customConfigError: "Παρατηρήθηκαν προβλήματα κατά τη φόρτωση των πρόσθετων. Δες στον PluginManager για λεπτομέρειες",
	pluginError: "Σφάλμα: %0",
	pluginDisabled: "Δεν εκτελέστηκε γιατί έχει απενεργοποιηθεί μέσω του 'systemConfigDisable' tag",
	pluginForced: "Εκτελέστηκε αναγκαστικά μέσω του 'systemConfigForce' tag",
	pluginVersionError: "Το plugin αυτό δεν εκτελέστηκε γιατί απαιτείται νεώτερη έκδοση του TiddlyWiki",
	nothingSelected: "Πρέπει πρώτα να επιλέξεις ένα ή περισσότερα αντικείμενα",
	savedSnapshotError: "Φαίνεται ότι αυτό το TiddlyWiki δεν αποθηκεύτηκε σωστά. Παρακαλώ πήγαινε  στην http://www.tiddlywiki.com/#DownloadSoftware για περισσότερες λεπτομέρειες",
	subtitleUnknown: "(άγνωστος)",
	undefinedTiddlerToolTip: "Η παράγραφος '%0' δεν υπάρχει",
	shadowedTiddlerToolTip: "Η παράγραφος '%0' δεν υπάρχει ακόμη, αλλά έχει ήδη οριστεί γι' αυτήν μία σκιώδης αξία",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Εξωτερικός σύνδεσμος σε %0",
	noTags: "Δεν υπάρχουν ομαδοποιημένες παράγραφοι",
	notFileUrlError: "Πρέπει πρώτα να αποθηκεύσεις αυτό το TiddlyWiki σε αρχείο και μετά να αποθηκεύσεις τις αλλαγές",
	cantSaveError: "Δεν είναι δυνατόν να σωθούν οι αλλαγές. Πιθανοί λόγοι ακολουθούν:\n- ο πλοηγός σου δεν υποστηρίζει αποθήκευση (Firefox, Internet Explorer, Safari και Opera την υποστηρίζουν εάν έχουν ρυθμιστεί σωστά)\n- η διαδρομή του αρχείου TiddlyWiki περιέχει μη έγκυρους χαρακτήρες\n- το HTML αρχείο του TiddlyWiki έχει μετακινηθεί ή μετονομαστεί",
	invalidFileError: "Το αρχικό αρχείο '%0' δε μοιάζει να είναι έγκυρο TiddlyWiki",
	backupSaved: "Το αντίγραφο αποθηκεύτηκε",
	backupFailed: "Το αντίγραφο απέτυχε να αποθηκευτεί",
	rssSaved: " To RSS feed αποθηκεύτηκε",
	rssFailed: "To αρχείο RSS feed απέτυχε να αποθηκευτεί",
	emptySaved: "Αποθηκεύτηκε το κενό κρότυπο",
	emptyFailed: "Αποτυχία αποθήκευσης του κενού προτύπου",
	mainSaved: "Το κύριο αρχείο TiddlyWiki αποθηκεύτηκε",
	mainFailed: "Η αποθήκευση του κύριου αρχείου TiddlyWiki απέτυχε.  Οι αλλαγές σου δεν  αποθηκεύτηκαν",
	macroError: "Σφάλμα στη μακροεντολή <<\%0>>",
	macroErrorDetails: "Σφάλμα κατά την εκτέλεση της μακροεντολής <<\%0>>:\n%1",
	missingMacro: "Δεν υπάρχει τέτοια μακροεντολή",
	overwriteWarning: "Μία παράγραφος με το όνομα '%0' υπάρχει ήδη. Επέλεξε OK για να την αντικαταστήσεις",
	unsavedChangesWarning: "ΠΡΟΣΟΧΗ! Υπάρχουν αλλαγές που δεν έχουν αποθηκευτεί στο TiddlyWiki\n\nΕπέλεξε OK για να σωθούν\nΕπέλεξε ΑΚΥΡΩΣΗ για να αγνοηθούν",
	confirmExit: "--------------------------------\n\nΥπάρχουν αλλαγές που δεν έχουν αποθηκευτεί στο TiddlyWiki. Εάν συνεχίσεις θα χαθούν αυτές οι αλλαγές\n\n--------------------------------",
	saveInstructions: "Αποθήκευση Αλλαγών",
	unsupportedTWFormat: "Μορφή TiddlyWiki που δεν υποστηρίζεται '%0'",
	tiddlerSaveError: "Σφάλμα κατά την αποθήκευση του tiddler '%0'",
	tiddlerLoadError: "Σφάλμα κατά τη φόρτωση του '%0'",
	wrongSaveFormat: "Αδυναμία αποθήκευση με αυτή τη μορφή '%0'. Χρησιμοποίησε τη standard μορφή για αποθήκευση.",
	invalidFieldName: "Μη έγκυρο όνομα πεδίου %0",
	fieldCannotBeChanged: "Το πεδίο '%0' δεν μπορεί να αλλάξει",
/**/	loadingMissingTiddler: "Attempting to retrieve the tiddler '%0' from the '%1' server at:\n\n'%2' in the workspace '%3'"});

merge(config.messages.messageClose,{
	text: "κλείσιμο",
	tooltip: "κλείσε αυτή την περιοχή μηνυμάτων"});

config.messages.backstage = {
	open: {text: "παρασκήνιο", icon: "â†©", iconIE: "â†", tooltip: "Άνοιγμα της περιοχής παρασκηνίου για εργασίες επεξεργασίας και διαχείρισης"},
	close: {text: "κλείσιμο", icon: "â†ª", iconIE: "â†’", tooltip: "Κλείσιμο της περιοχής παρασκηνίου"},
	prompt: "παρασκήνιο: ",
	decal: {
/**/		edit: {text: "edit", tooltip: "Edit the tiddler '%0'"}
	}
};

config.messages.listView = {
/**/	tiddlerTooltip: "Click for the full text of this tiddler",
	previewUnavailable: "(preview not available)"
};

config.messages.dates.months = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαϊου", "Ιουνίου", "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου","Δεκεμβρίου"];
config.messages.dates.days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
config.messages.dates.shortMonths = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαι", "Ιον", "Ιολ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];
config.messages.dates.shortDays = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"];
config.messages.dates.am = "πμ";
config.messages.dates.pm = "μμ";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "χωρίς ομαδοποίηση",
	labelTags: "ομάδες: ",
	openTag: "Άνοιγμα ομάδας '%0'",
	tooltip: "Προβολή παραγράφων που ανήκουν στην ομάδα '%0'",
	openAllText: "Άνοιγμα όλων",
	openAllTooltip: "Άνοιγμα όλων αυτών των ομάδων",
	popupNone: "Καμία άλλη παράγραφος δεν ανήκει στην ομάδα '%0'"});

merge(config.views.wikified,{
	defaultText: " Η παράγραφος '%0' δεν υπάρχει. Κάνε διπλό κλικ για να τη δημιουργήσεις",
	defaultModifier: "(λείπει)",
	shadowModifier: "(ενσωματωμένη σκιώδης παράγραφος)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "δημιουργήθηκε"});

merge(config.views.editor,{
	tagPrompt: "Καταχώρησε ομάδες με κενό ανάμεσά τους [[χρησιμοποίησε διπλές αγκύλες]] εάν είναι απαραίτητο, ή πρόσθεσε ήδη υπάρχουσες",
	defaultText: "Πληκτρολόγησε το κείμενο για '%0'"});

merge(config.views.editor.tagChooser,{
	text: "ομάδες",
	tooltip: "Επέλεξε μία ομάδα να προσθέσεις σε αυτή την παράγραφο",
	popupNone: "Δεν έχουν οριστεί ομάδες",
	tagTooltip: "Προσθήκη της ομάδας '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "αναζήτηση",
	prompt: "Αναζήτησε αυτό το κείμενο στο TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 παράγραφοι βρέθηκαν να ταιριάζουν με %1",
	failureMsg: "Καμία παράγραφος δε βρέθηκε να ταιριάζει με %0"});

merge(config.macros.tagging,{
	label: "ομαδοποίση: ",
	labelNotTag: "καμία αμαδοποίηση",
	tooltip: "Κατάλογος με παραγράφους που ομαδοποιήθηκαν με '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});

merge(config.macros.allTags,{
	tooltip: "Προβολή παραγράφων που ομαδοποιήθηκαν με '%0'",
	noTags: "Δεν υπάρχουν ομαδοποιημένες παράγραφοι"});

config.macros.list.all.prompt = "Όλοι οι παράγραφοι σε αλφαβητική σειρά";
config.macros.list.missing.prompt = "Παράγραφοι για τις οποίες υπάρχει παραπομπή αλλά δεν έχουν οριστεί";
config.macros.list.orphans.prompt = "Παράγραφοι που δεν συνδέονται με άλλα";
config.macros.list.shadowed.prompt = "Σκιώδεις παράγραφοι με προκαθορισμένο περιεχόμενο";
config.macros.list.touched.prompt = "Παράγραφοι που έχουν μεταβληθεί τοπικά";

merge(config.macros.closeAll,{
	label: "κλείσιμο όλων",
	prompt: "Κλείσιμο όλων των παραγράφων σε προβολή (εκτός από όποιο βρίσκεται σε επεξεργασία)"});

merge(config.macros.permaview,{
	label: "στιγμιαία απεικόνιση",
	prompt: "Χρησιμοποίησε τη διαδρομή ως σύνδεσμο που θα εμφανίσει όλες τις παραγράφους που εμφανίζονται αυτή τη στιγμή"});

merge(config.macros.saveChanges,{
	label: "αποθήκευση αλλαγών",
	prompt: "Αποθήκευση όλων των tiddlers για τη δημιουργία ενός νέου TiddlyWiki",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "νέα παράγραφος",
	prompt: "Δημιουργία νέας παραγράφου",
	title: "Νέα Παράγραφος",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "νέo φύλλο ημερολογίου",
	prompt: "Δημιουργία μιας παραγράφου με τίτλο την ημερομηνία",
	accessKey: "J"});

/** following needs translation **/
merge(config.macros.options,{
	wizardTitle: "Tweak advanced options",
	step1Title: "These options are saved in cookies in your browser",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Show unknown options</input>",
	unknownDescription: "//(unknown)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Option", type: 'String'},
			{name: 'Description', field: 'description', title: "Description", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Name", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Διαχείριση πρόσθετων",
	step1Title: "Φορτωμένα πρόσθετα",
	step1Html: "<input type='hidden' name='markList'></input>",
	skippedText: "(Αυτό το πρόσθετο δεν φορτώθηκε γιατί προστέθηκε μετά την εκκίνηση)",
	noPluginText: "Δεν υπάρχουν εγκατεστημένα πρόσθετα",
	confirmDeleteText: "Σίγουρα θέλεις να διαγράψεις αυτά τα πρόσθετα:\n\n%0",
	removeLabel: "διαγραφή της ομάδας systemConfig",
	removePrompt: "Διαγραφή της ομάδας systemConfig",
	deleteLabel: "διαγραφή",
	deletePrompt: "Μόνιμη διαγραφή αυτών των παραγράφων",
	listViewTemplate : {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Μέγεθος", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Εξαναγκασμένο", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Απενεργοποιημένο", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Φορτωμένο", type: 'Boolean', trueText: "Yes", falseText: "No"},
/**/			{name: 'Startup Time', field: 'startupTime', title: "Startup Time", type: 'String'},
			{name: 'Error', field: 'error', title: "Κατάσταση", type: 'Boolean', trueText: "Error", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Σχόλια", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
/**/	moreLabel: "more",
/**/	morePrompt: "Reveal further commands"
	});

merge(config.macros.refreshDisplay,{
	label: "ανανέωση",
	prompt: "Επανασχεδίαση της εμφάνισης του TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Δεν μπορείς να εισάγεις σε ένα TiddlyWiki αρχείο με σήμανση μόνο για ανάγνωση. Προσπάθησε να το ανοίξεις από μία διαδρομή αρχείου (αρχείο:// διαδρομή)",
	wizardTitle: "Εισαγωγή παραγράφων από ένα άλλο αρχείο ή διακομιστή",
	step1Title: "Βήμα 1: Εντόπισε το διακομιστή ή το αρχείο",
	step1Html: "Επέλεξε τον τύπο του διακομιστή: <select name='selTypes'><option value=''>Επέλεξε...</option></select><br>Καταχώρησε τη διαδρομή εδώ: <input type='text' size=50 name='txtPath'><br>...ή περιηγήσου για ένα αρχείο: <input type='file' size=50 name='txtBrowse'><br><hr>...ή επέλεξε ένα προκαθορισμένο feed: <select name='selFeeds'><option value=''>Επέλεξε...</option></select>",
	openLabel: "άνοιξε",
	openPrompt: "Άνοιξε τη σύνδεση με αυτό το αρχείο ή το διακομιστή",
	openError: "Παρουσιάστηκαν προβλήματα κατά τη φόρτωση του αρχείου tiddlywiki",
	statusOpenHost: "Άνοιγμα του διακομιστή",
	statusGetWorkspaceList: "Λίστα των διαθέσιμων χώρων εργασίας",
	step2Title: "Βήμα 2: Επέλεξε έναν χώρο εργασίας",
	step2Html: "Γράψε εδώ έναν χώρο εργασίας: <input type='text' size=50 name='txtWorkspace'><br>...ή επέλεξε ένα χώρο εργασίας: <select name='selWorkspace'><option value=''>Επέλεξε...</option></select>",
	cancelLabel: "ακύρωση",
	cancelPrompt: "Ακύρωση της εισαγωγής",
	statusOpenWorkspace: "Άνοιγμα του χώρου εργασίας",
	statusGetTiddlerList: "Λίστα των διαθέσιμων παραγράφων",
	step3Title: "Βήμα 3: Επέλεξε τις παραγράφους για εισαγωγή",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Keep these tiddlers linked to this server so that you can synchronise subsequent changes</input>",
	importLabel: "εισαγωγή",
	importPrompt: "Εισαγωγή αυτών των παραγράφων",
	confirmOverwriteText: "Σίγουρα θέλετε να αντικαταστήσετε αυτές τις παραγράφους:\n\n%0",
	step4Title: "Βήμα 4: Εισαγωγή %0 παραγράφου(ων)",
	step4Html: "<input type='hidden' name='markReport'></input>",
	doneLabel: "έγινε",
	donePrompt: "Κλείσε αυτό τον οδηγό",
/** following needs translation **/
	statusDoingImport: "Importing tiddlers",
	statusDoneImport: "All tiddlers imported",
	systemServerNamePattern: "%2 on %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "The tiddler '%0' already exists. Click 'OK' to overwrite it with the details of this server, or 'Cancel' to leave it unchanged",
	serverSaveTemplate: "|''Type:''|%0|\n|''URL:''|%1|\n|''Workspace:''|%2|\n\nThis tiddler was automatically created to record the details of this server",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Μέγεθος", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Ομάδες", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Τύπος διακομιστή", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Διακομιστής", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Χώρος εργασίας διακομιστή", type: 'String'},
			{name: 'Status', field: 'status', title: "Κατάσταση συγχρονισμού", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "Διαδρομή διακομιστή", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Συγχρονισμός αυτών των παραγράφων", name: 'sync'}
			]},
	wizardTitle: "Συγχρονισμός με εξωτερικούς διακομιστές και αρχεία",
	step1Title: "Επέλεξε τις παραγράφους που θέλεις να συγχρονίσεις",
	step1Html: '<input type="hidden" name="markList"></input>',
	syncLabel: "συγχρονισμός",
	syncPrompt: "Συγχρονισμός αυτών των παραγράφων",
/** following lines need translation **/
	hasChanged:	"Changed while unplugged",
	hasNotChanged: "Unchanged while unplugged",
	syncStatusList: {
		none: {text: "...", color: "none"},
		changedServer: {text: "Changed on server", color: "#80ff80"},
		changedLocally: {text: "Changed while unplugged", color: "#80ff80"},
		changedBoth: {text: "Changed while unplugged and on server", color: "#ff8080"},
		notFound: {text: "Δεν βρέθηκε στον διακομιστή", color: "#ffff80"},
		putToServer: {text: "Saved update on server", color: "#ff80ff"},
		gotFromServer: {text: "Retrieved update from server", color: "#80ffff"}
		}
	});

merge(config.commands.closeTiddler,{
	text: "κλείσιμο",
	tooltip: "Κλείσιμο αυτής της παραγράφου"});

merge(config.commands.closeOthers,{
	text: "κλείσιμο υπολοίπων",
	tooltip: "Κλείσιμο όλων των υπολοίπων παραγράφων"});

merge(config.commands.editTiddler,{
	text: "επεξεργασία",
	tooltip: "Επεξεργασία αυτής της παραγράφου",
	readOnlyText: "προβολή",
	readOnlyTooltip: "Προβολή του πηγαίου κώδικα αυτής της παραγράφου"});

merge(config.commands.saveTiddler,{
	text: "OK",
	tooltip: "Αποθήκευση των αλλαγών αυτής της παραγράφου"});

merge(config.commands.cancelTiddler,{
	text: "ακύρωση",
	tooltip: "Αναίρεση των αλλαγών αυτής της παραγράφου",
	warning: "Σίγουρα θέλετε να αναιρέσετε τις αλλαγές στο '%0'?",
	readOnlyText: "OK",
	readOnlyTooltip: "Κανονική προβολή αυτής της παραγράφου"});

merge(config.commands.deleteTiddler,{
	text: "διαγραφή",
	tooltip: "Διαγραφή αυτής της παραγράφου",
	warning: "Σίγουρα θέλετε να διαγράψετε το '%0'?"});

merge(config.commands.permalink,{
	text: "στιγμιαίος σύνδεσμος",
	tooltip: "Στιγμιαίος σύνδεσμος γι' αυτή την παράγραφο"});

merge(config.commands.references,{
	text: "παραπομπή",
	tooltip: "Εμφανίζει τις παραγράφους που έχουν σύνδεσμο σ' αυτήν την παράγραφο",
	popupNone: "Χωρίς παραπομπές"});

merge(config.commands.jump,{
	text: "μεταπήδηση",
	tooltip: "μεταπήδηση σε άλλη ανοιχτή παράγραφο"});

/** following needs translation **/
merge(config.commands.syncing,{
	text: "syncing",
	tooltip: "Control synchronisation of this tiddler with a server or external file",
	currentlySyncing: "<div>Currently syncing via <span class='popupHighlight'>'%0'</span> to:</"+"div><div>host: <span class='popupHighlight'>%1</span></"+"div><div>workspace: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Not currently syncing",
	captionUnSync: "Stop synchronising this tiddler",
	chooseServer: "Synchronise this tiddler with another server:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

/** following needs translation **/
merge(config.commands.fields,{
	text: "fields",
	tooltip: "Show the extended fields of this tiddler",
	emptyText: "There are no extended fields for this tiddler",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Field", type: 'String'},
			{name: 'Value', field: 'value', title: "Value", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[GettingStarted]]",
/**/	MainMenu: "[[GettingStarted]]\n\n\n^^~TiddlyWiki version <<version>>\n© 2007 [[UnaMesa|http://www.unamesa.org/]]^^",
/**/	GettingStarted: "To get started with this blank TiddlyWiki, you'll need to modify the following tiddlers:\n* SiteTitle & SiteSubtitle: The title and subtitle of the site, as shown above (after saving, they will also appear in the browser title bar)\n* MainMenu: The menu (usually on the left)\n* DefaultTiddlers: Contains the names of the tiddlers that you want to appear when the TiddlyWiki is opened\nYou'll also need to enter your username for signing your edits: <<option txtUserName>>",
/**/	SiteTitle: "My TiddlyWiki",
/**/	SiteSubtitle: "a reusable non-linear personal web notebook",
/**/	SiteUrl: "http://www.tiddlywiki.com/",
/**/	OptionsPanel: "These Interface Options for customising TiddlyWiki are saved in your browser\n\nYour username for signing your edits. Write it as a WikiWord (eg JoeBloggs)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Save backups\n<<option chkAutoSave>> Auto save\n<<option chkRegExpSearch>> Regexp search\n<<option chkCaseSensitiveSearch>> Case sensitive search\n<<option chkAnimate>> Enable animations\n\n----\nAlso see [[TranslatedAdvancedOptions|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "επιλογές»" "Αλλαγή των προχωρημένων επιλογών του TiddlyWiki">>',
	SideBarTabs: '<<tabs txtMainTab "Χρονολογικά" "Χρονολογικά" TabTimeline "Όλες" "Όλες οι παράγραφοι" TabAll "Ομάδες" "Όλες οι ομάδες" TabTags "Περισσότερα" "Περισσότερες λίστες" TabMore>>',
	TabTimeline: '<<timeline>>',
	TabAll: '<<list all>>',
	TabTags: '<<allTags excludeLists>>',
	TabMore: '<<tabs txtMoreTab "Ημιτελείς" "Ημιτελείς παράγραφοι" TabMoreMissing "Αποκομμένες" "Αποκομμένες παράγραφοι" TabMoreOrphans "Σκιώδεις" "Σκιώδεις παράγραφοι" TabMoreShadowed>>'});

//}}}
