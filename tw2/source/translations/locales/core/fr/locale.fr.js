/***
|''Name:''|locale.fr|
|''Description:''|Translation of TiddlyWiki into French|
|''Version:''|0.0.7|
|''Date:''|Jun 20, 2007|
|''Source:''|http://???/#locale.fr (temporairement http://TiddlyWikiFR.bidix.info/)|
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/fr/locale.fr.js |
|''Fichier de base "empty.html":''|http://???/empty.fr.html (temporairement http://TiddlyWikiFR.bidix.info/empty.fr-FR.html)|
|''Author:''|BidiX (BidiX (at) bidix (dot) info)|
|''Credits:''|Jacques Turbé : http://avm.free.fr//TiddlyWiki-fr.html - Traduction de la version 2.1|
|''Comments:''|Merci de faire vos commentaires à http://groups.google.fr/group/TiddlyWikiFR |
|''License:''|[[BSD open source license|http://tiddlywiki.bidix.info/#%5B%5BBSD%20open%20source%20license%5D%5D ]]|
|''~CoreVersion:''|2.2.0|
***/
/***
Je suis reparti du fichier officiel locale.en.js en intégrant la traduction de Jacques Turbé http://avm.free.fr//TiddlyWiki-fr.html et en reprenant les mêmes choix de traduction. 

Après discussion avec Jacques Turbé nous avons retenu :
	* Backstage -> Services

Ci-dessous les commentaires de Jacques Turbé attachés à la version précédente :
----

''Version 2.1.0 3/10/06 ''
!Traduction française des messages intégrés dans le TiddlyWiki de base de JeremyRuston, à jour avec la version 2.1.0
__NDT:__
^^Toute traduction peut-être discutée. Celle-ci a été faite en pensant à un utilisateur non spécialiste.
D'où les choix :
| //tiddler -> élément<br />tag, to tag -> index, indexer<br />plugin -> extension<br />empty file template -> fichier de base "empty.html"//<br />Mais :<br />//backup -> backup//<br />(traduire ce terme consacré introduirait des confusions) |
//Traduction// Jacques Turbé : http://avm.free.fr//TiddlyWiki-fr.html ^^

Avec la version 2.1.0 de TiddlyWiki apparaissent deux nouvelles fonctions intégrées :
''Importations'' et ''Extensions'' : Les boutons d'appel correspondants sont ajoutés au bas de votre OptionPanel par le code suivant : {{{[[Importations|ImportTiddlers]]}}} et {{{[[Extensions|PluginManager]]}}}
***/

//{{{

//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "fr"; // W3C language tag

if (!config.options['txtUserName']) config.options['txtUserName'] = "VotreNom";

merge(config.tasks,{
	save: {text: "sauvegarder", tooltip: "Sauvegarde vos modifications dans ce TiddlyWiki", action: saveChanges},
	sync: {text: "synchroniser", tooltip: "Synchronise les modifications avec d'autres fichiers TiddlyWiki et serveurs", content: '<<sync>>'},
	importTask: {text: "importer", tooltip: "Importe des éléments et extensions depuis d'autres fichiers TiddlyWiki et serveurs", content: '<<importTiddlers>>'},
	tweak: {text: "réglages", tooltip: "Mettre au point l'apparence et le comportement du TiddlyWiki", content: '<<options>>'},
	upgrade: {text: "upgrade", tooltip: "Upgrade TiddlyWiki core code", content: '<<upgrade>>'},
	plugins: {text: "extensions", tooltip: "Gère les extensions installées", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Nom utilisé pour signer les modifications",
	chkRegExpSearch: "Active les expressions régulières pour la recherche",
	chkCaseSensitiveSearch: "Recherche sensible à la casse",
	chkIncrementalSearch: "Incremental key-by-key searching",
	chkAnimate: "Active les animations",
	chkSaveBackups: "Conserve un fichier backup en enregistrant les modifications",
	chkAutoSave: "Enregistre les modifications automatiquement",
	chkGenerateAnRssFeed: "Génère un flux RSS en enregistrant les modifications",
	chkSaveEmptyTemplate: "Génère un fichier 'empty.html'en enregistrant les modifications",
	chkOpenInNewWindow: "Ouvre un lien externe dans une nouvelle fenêtre",
	chkToggleLinks: "Cliquer sur les liens ouvrant les éléments entraine leur fermeture",
	chkHttpReadOnly: "Masque les caractéristques d'édition lorsqu'il est accédé par HTTP",
	chkForceMinorUpdate: "Ne pas modifier le nom de l'auteur et la date en editant les éléments",
	chkConfirmDelete: "Demande une confirmation avant de supprimer un élément",
	chkInsertTabs: "Utilise la touche 'tab'pour insérer une tabulation au lieu de changer de champs",
	txtBackupFolder: "Nom du dossier à utiliser pour les backups",
	txtMaxEditRows: "Nombre maximum de lignes dans les zones d'édition",
	txtTheme: "Name of the theme to use",
	txtFileSystemCharSet: "Jeux de caractères à utiliser lors de l'enregistrement des modifications (uniquement pour Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Problème rencontré pour charger des extensions. Activer le menu 'extensions' pour les détails",
	pluginError: "Erreur : %0",
	pluginDisabled: "Extension désactivée en raison de l'index 'systemConfigDisable'",
	pluginForced: "Exécution forcée en raison de l'index 'systemConfigForce'",	
	pluginVersionError: "Cette extension ne peut être exécutée car elle nécessite une version plus récente de TiddlyWiki",
	nothingSelected: "Pas de sélection faite. Il faut sélectionner au moins un item d'abord",
	savedSnapshotError: "Cet exemplaire de TiddlyWiki ne semble pas conforme. Reportez-vous à http://www.tiddlywiki.com/#DownloadSoftware",
	subtitleUnknown: "(inconnu)",
	undefinedTiddlerToolTip: "L'élément '%0' n'est pas encore créé",
	shadowedTiddlerToolTip: "L'élément '%0' n'est pas encore créé, mais a un contenu par défaut.",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Lien extern %0",
	noTags: "Il n'y a pas d'éléments indexés",
	notFileUrlError: "Vous devez sauvegarder ce TiddlyWiki dans un fichier avant de pouvoir enregistrer vos modifications",
	cantSaveError: "Sauvegarde impossible : \n- soit votre navigateur ne permet pas de sauvegarder les changements (FireFox, Internet Explorer, Safari et Opera fonctionne s'ils sont configurés corectement),\n- soit l'adresse de votre fichier contient des caractères invalides\n- soit le fichier TiddlyWiki a été déplacé ou renommé",
	invalidFileError: "Le fichier '%0' choisi ne semble pas être un TiddlyWiki valide",
	backupSaved: "Sauvegarde effectuée",
	backupFailed: "Echec de l'enregistrement du backup",
	rssSaved: "Flux RSS sauvegardé",
	rssFailed: "Echec de l'enregistrement du flux RSS",
	emptySaved: "Fichier de base 'empty.html' enregistré",
	emptyFailed: "Echec de l'enregistrement du fichier de base 'empty.html'",
	mainSaved: "Fichier principal TiddlyWiki enregistré",
	mainFailed: "Echec de l'enregistrement du fichier principal TiddlyWiki. Vos modifications ne sont pas enregistrées",
	macroError: "Erreur dans la macro <<%0>>",
	macroErrorDetails: "Erreur d'exécution de la macro <<%0>>:\n%1",
	missingMacro: "Macro non trouvée",
	overwriteWarning: "Il y a déjà un élément nommé '%0'. Confirmez pour le remplacer",
	unsavedChangesWarning: "ATTENTION! Les dernières modifications de ce TiddlyWiki n'ont pas été enregistrées.\n\nOK pour les enregistrer\nANNULER pour les abandonner",
	confirmExit: "--------------------------------\n\nSi vous quittez maintenant vous perdrez les modifications qui n'ont pas été enregistrées.\n\n--------------------------------",
	saveInstructions: "Sauvegarder",
	unsupportedTWFormat: "Format de TiddlyWiki non supporté '%0'",
	tiddlerSaveError: "Erreur lors de l'enregistrement de l'élément '%0'",
	tiddlerLoadError: "Erreur lors du chargement de l'élément '%0'",
	wrongSaveFormat: "Impossible d'enregistrer avec le format '%0'. Le format standard est utilisé.",
	invalidFieldName: "Nom de champ invalide %0",
	fieldCannotBeChanged: "Le champ '%0' ne peut être changé",
	loadingMissingTiddler: "Tentative de récupération de l'élément '%0' à partir du serveur '%1' server à :\n\n'%2' dans l'espace de travail '%3'",
	upgradeDone: "The upgrade to version %0 is now complete\n\nClick 'OK' to reload the newly upgraded TiddlyWiki"});

merge(config.messages.messageClose,{
	text: "fermer",
	tooltip: "ferme cette zône messages"});

config.messages.backstage = {
	open: {text: "services", tooltip: "Ouvre les services pour effectuer des tâches d'auteur et d'editeur"},
	close: {text: "fermer", tooltip: "Ferme les services"},
	prompt: "services : ",
	decal: {
		edit: {text: "éditer", tooltip: "Editer l'élément '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Cliquer pour une vue complète de cet élément",
	previewUnavailable: "(aperçu non disponible)"
};

config.messages.dates.months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre","décembre"];
config.messages.dates.days = ["dimanche", "lundi","mardi", "mercredi", "jeudi", "vendredi", "samedi"];
config.messages.dates.shortMonths = "janv.,févr.,mars,avr.,mai,juin,juil,août,sept,oct.,nov.,déc.".split(',');
config.messages.dates.shortDays = "dim.,lun.,mar.,mer.,jeu.,ven.,sam.".split(',');
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = "er,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,".split(',');
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "non indexé",
	labelTags: "Index : ",
	openTag: "Ouvrir index '%0'",
	tooltip: "Afficher les éléments indexés avec '%0'",
	openAllText: "Ouvrir tous",
	openAllTooltip: "Ouvrir tous les éléments de cet index",
	popupNone: "Pas d'autres éléments indexés avec '%0'"});

merge(config.views.wikified,{
	defaultText: "'%0' n'a pas encore été créé. Double-cliquez pour entrer un texte.",
	defaultModifier: "(absent)",
	shadowModifier: "(défaut)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "créé"});

merge(config.views.editor,{
	tagPrompt: "Séparez les index avec un espace [[doubles crochets si besoin]], ou sélectionnez un index existant",
	defaultText: "Entrez le texte de '%0'"});

merge(config.views.editor.tagChooser,{
	text: "index",
	tooltip: "Sélectionner les index existants à associer à cet élément",
	popupNone: "Pas d'index déjà définis",
	tagTooltip: "Associer à l'index '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "chercher",
	prompt: "Rechercher dans ce TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 éléments correspondent à %1",
	failureMsg: "Aucun élément ne correspond à %0"});

merge(config.macros.tagging,{
	label: "éléments indexés:",
	labelNotTag: "pas d'index",
	tooltip: "Lister les éléments indexés '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});

merge(config.macros.allTags,{
	tooltip: "Afficher les éléments indexés avec '%0'",
	noTags: "Pas d'éléments indexés"});

config.macros.list.all.prompt = "Tous les éléments par ordre alphabétique";
config.macros.list.missing.prompt = "Eléments désignés par un lien mais non créés";
config.macros.list.orphans.prompt = "Eléments ne faisant l'objet d'aucun lien";
config.macros.list.shadowed.prompt = "Eléments ayant un contenu par défaut";
config.macros.list.touched.prompt = "Eléménts ayant été modifiés localement";

merge(config.macros.closeAll,{
	label: "page blanche",
	prompt: "Retirer tous les éléments de l'affichage (sauf ceux en cours d'édition)"});

merge(config.macros.permaview,{
	label: "permavue",
	prompt: "URL de la page actuellement constituée"});

merge(config.macros.saveChanges,{
	label: "sauvegarde sur le disque",
	prompt: "Créer le fichier TiddlyWiki avec tous les éléments mis à jour",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "nouveau",
	prompt: "Créer un nouvel élément",
	title: "Entrée Nouvelle",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "nouveau journal",
	prompt: "Créer un nouvel élément avec la date du jour et l'heure actuelle",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Réglage des options avancées",
	step1Title: "Ces option sont enregistrées dans des cookies de votre navigateur",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Montrer les options inconnues</input>",
	unknownDescription: "//(inconnu)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Option", type: 'String'},
			{name: 'Description', field: 'description', title: "Description", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Nom", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Gère les extensions",
	step1Title: "Extensions actuellement chargées",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Cette extension n'a pas été éxecutée car elle a été ajoutée après le démarrage)",
	noPluginText: "Il n'y a pas d'extension installée",
	confirmDeleteText: "Etes vous sûre de vouloir supprimer ces extensions :\n\n%0",
	removeLabel: "enlever l'index 'systemConfig'",
	removePrompt: "enlève l'index 'systemConfig'",
	deleteLabel: "supprimer",
	deletePrompt: "Supprime ces éléments définitivement",
	listViewTemplate: {
		columns: [
		{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
		{name: 'Tiddler', field: 'tiddler', title: "Elément", type: 'Tiddler'},
		{name: 'Description', field: 'Description', title: "Description", type: 'String'},
		{name: 'Version', field: 'Version', title: "Version", type: 'String'},
		{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Taille", type: 'Size'},
		{name: 'Forced', field: 'forced', title: "Forcée", tag: 'systemConfigForce', type: 'TagCheckbox'},
		{name: 'Disabled', field: 'disabled', title: "Désactivée", tag: 'systemConfigDisable', type: 'TagCheckbox'},
		{name: 'Executed', field: 'executed', title: "Chargée", type: 'Boolean', trueText: "Yes", falseText: "No"},
		{name: 'Startup Time', field: 'startupTime', title: "Durée de démarrage", type: 'String'},
		{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Error", falseText: "OK"},
		{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "more",
	morePrompt: "Fait apparaître des commandes supplémentaires",
	lessLabel: "less",
	lessPrompt: "Hide additional commands",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "Ré-affiche",
	prompt: "Ré-affiche l'ensemble du TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Importation dans un TiddlyWiki en lecture seule impossible. Essayez de l'ouvrir à partir d'une URL 'file://'",
	wizardTitle: "Importer des éléments depuis un autre fichier ou serveur",
	step1Title: "Etape 1 : localiser le serveur ou le ficher TiddlyWiki",
	step1Html: "Spécifiez le type du serveur : <select name='selTypes'><option value=''>Choisir ...</option></select><br>URL ou chemin : <input type='text' size=50 name='txtPath'><br>... ou recherchez un fichier : <input type='file' size=50 name='txtBrowse'><br><hr>... ou selectionnez une source pré-définie : <select name='selFeeds'><option value=''>Choisir ...</option></select>",
	openLabel: "ouvrir",
	openPrompt: "Ouvre la connexion vers ce fichier ou serveur",
	openError: "Il y a des erreurs lors de l'accès au fichier TiddlyWiki",
	statusOpenHost: "Hôte en cours d'ouverture",
	statusGetWorkspaceList: "Obtenir la liste des espaces de travail disponibles",
	step2Title: "Etape 2 : choisir l'espace de travail",
	step2Html: "Entrez le nom d'un espace de travail : <input type='text' size=50 name='txtWorkspace'><br>... ou selectionnez un esspace de travail : <select name='selWorkspace'><option value=''>Choisir ...</option></select>",
	cancelLabel: "annuler",
	cancelPrompt: "Annule cette importation",
	statusOpenWorkspace: "Ouverture de l'espace de travail",
	statusGetTiddlerList: "Obtenir la liste des éléments disponibles",
	errorGettingTiddlerList: "Error getting list of tiddlers, click Cancel to try again",
	step3Title: "Etape 3: Choisir les éléments à importer",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Conserve ces éléments liés à ce serveur pour pouvoir synchroniser avec les changements ultérieurs</input><br><input type='checkbox' name='chkSave'>Enregistre les détails de ce serveur dans un élément 'systemServer' nommé :</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importer",
	importPrompt: "Importe ces éléments",
	confirmOverwriteText: "Etes-vous sûr de vouloir écraser ces éléments :\n\n%0",
	step4Title: "Etape 4 : Importe %0 élément(s)",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "fait",
	donePrompt: "Ferme cet assistant",
	statusDoingImport: "Importing tiddlers",
	statusDoneImport: "Tous les éléments ont été importés",
	systemServerNamePattern: "%2 sur %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Cet élément '%0' existe déjà. Clique 'OK' pour l'écraser avec le contenu de ce serveur ou 'Annule' pour les conserver en l'état",
	serverSaveTemplate: "|''Type :''|%0|\n|''URL :''|%1|\n|''Espace de travail :''|%2|\n\nCet élémént avait été automatiquement pour enregistrer les détals de ce serveur",
	serverSaveModifier: "(Système)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Elément", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Taille", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Indexes", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Upgrade TiddlyWiki core code",
	step1Title: "Update or repair this TiddlyWiki to the latest release",
	step1Html: "You are about to upgrade to the latest release of the TiddlyWiki core code (from <a href='%0' class='externalLink' target='_blank'>%1</a>). Your content will be preserved across the upgrade.<br><br>Note that core upgrades have been known to interfere with older plugins. If you run into problems with the upgraded file, see <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "Unable to upgrade this TiddlyWiki. You can only perform upgrades on TiddlyWiki files stored locally",
	errorNotSaved: "You must save changes before you can perform an upgrade",
	step2Title: "Confirm the upgrade details",
	step2Html_downgrade: "You are about to downgrade to TiddlyWiki version %0 from %1.<br><br>Downgrading to an earlier version of the core code is not recommended",
	step2Html_restore: "This TiddlyWiki appears to be already using the latest version of the core code (%0).<br><br>You can continue to upgrade anyway to ensure that the core code hasn't been corrupted or damaged",
	step2Html_upgrade: "You are about to upgrade to TiddlyWiki version %0 from %1",
	upgradeLabel: "upgrade",
	upgradePrompt: "Prepare for the upgrade process",
	statusPreparingBackup: "Preparing backup",
	statusSavingBackup: "Saving backup file",
	errorSavingBackup: "There was a problem saving the backup file",
	statusLoadingCore: "Loading core code",
	errorLoadingCore: "Error loading the core code",
	errorCoreFormat: "Error with the new core code",
	statusSavingCore: "Saving the new core code",
	statusReloadingCore: "Reloading the new core code",
	startLabel: "start",
	startPrompt: "Start the upgrade process",
	cancelLabel: "annuler",
	cancelPrompt: "Cancel the upgrade process",
	step3Title: "Upgrade cancelled",
	step3Html: "You have cancelled the upgrade process"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Elément", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Type de serveur", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Hôte serveur", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Espace de travail du serveur", type: 'String'},
			{name: 'Status', field: 'status', title: "Etat de la synchronisation", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "URL du serveur", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Synchronise ces éléments", name: 'sync'}
			]},
	wizardTitle: "Synchronise avec des serveurs externes et des fichiers",
	step1Title: "Choisir les éléments à synchroniser",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "synchroniser",
	syncPrompt: "Synchronise ces éléments",
	hasChanged: "Changé en mode déconnecté",
	hasNotChanged: "Inchangé pendant la déconnexion",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "Changé sur le serveur", display:null, className:'changedServer'},
		changedLocally: {text: "Changé en mode déconnecté", display:null, className:'changedLocally'},
		changedBoth: {text: "Changé pendant la déconnexion et sur le serveur", display:null, className:'changedBoth'},
		notFound: {text: "Non trouvé sur le serveur", display:null, className:'notFound'},
		putToServer: {text: "Modifications enreistrées sur le serveur", display:null, className:'putToServer'},
		gotFromServer: {text: "Récupère modificaion depuis le serveur", display:null, className:'gotFromServer'}
		}
	});

merge(config.macros.annotations,{
	});

merge(config.commands.closeTiddler,{
	text: "fermer",
	tooltip: "Ferme cet élément"});

merge(config.commands.closeOthers,{
	text: "isoler",
	tooltip: "Refermer tous les autres éléments"});
	
merge(config.commands.editTiddler,{
	text: "éditer",
	tooltip: "Editer cet élément",
	readOnlyText: "voir",
	readOnlyTooltip: "Montrer le texte source de cet élément"});

merge(config.commands.saveTiddler,{
	text: "valider",
	tooltip: "Valider les modifications apportées à cet élément"});

merge(config.commands.cancelTiddler,{
	text: "annuler",
	tooltip: "Abandonner les modifications apportées à cet élément",
	warning: "Confirmez-vous l'abandon des modifications de '%0'?",
	readOnlyText: "retour",
	readOnlyTooltip: "Revenir à l'affichage normal de cet élément"});

merge(config.commands.deleteTiddler,{
	text: "supprimer",
	tooltip: "Supprimer cet élément du fichier TiddlyWiki",
	warning: "Confirmez-vous la suppression de '%0'?"});

merge(config.commands.permalink,{
	text: "permalien",
	tooltip: "Permalien de cet élément"});

merge(config.commands.references,{
	text: "référents",
	tooltip: "Lister les éléments faisant référence à celui-ci",
	popupNone: "Pas de référents"});

merge(config.commands.jump,{
	text: "atteindre",
	tooltip: "Positionner l'affichage sur un autre élément déjà ouvert"});

merge(config.commands.syncing,{
	text: "synchronisation",
	tooltip: "Controle la synchronisation de cet élémnt avec un server ou un fichier externe",
	currentlySyncing: '<div>'+"Actuellement synchronisation avec "+'<span class="popupHighlight">"%0"</span> '+"à :"+'</'+'div><div>'+"hôte :"+'<span class="popupHighlight">%1</span></'+'div><div>'+"espace de travail :"+'<span class="popupHighlight">%2</span></'+'div>', // Note escaping of closing <div> tag
	notCurrentlySyncing: "Pas actuellement en synchronisation",
	captionUnSync: "Arrête la synchronisation de cet élément",
	chooseServer: "Synchronise cet élément avec un autre serveur :",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "champs",
	tooltip: "Montre les champs supplémentaires de cet élément",
	emptyText: "Il n'y a pas de champs supplémentaires pour cet élément",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Champ", type: 'String'},
			{name: 'Value', field: 'value', title: "Valeur", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[PourCommencer]]",
	MainMenu: "[[PourCommencer]]",
	SiteTitle: "Mon TiddlyWiki",
	SiteSubtitle: "organiseur personnel web interactif",
	SiteUrl: " ",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "'+"DD MMM YYYY"+'" "' +"journal"+'">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "'+"options \u00bb"+'" "'+"Change TiddlyWiki advanced options"+'">>',
	SideBarTabs: '<<tabs txtMainTab "'+"Chrono"+'" "'+ "Affichage chronologique"+'" TabTimeline "'+"Alpha"+'" "'+"Liste alphabétique des éléments"+'" TabAll "'+"Indexes"+'" "'+ "Liste des index"+'" TabTags "'+"Suite"+'" "'+"Autres listes"+'" TabMore>>',
	TabMore: '<<tabs txtMoreTab "'+"Manquants "+'" "'+"Eléments désignés par un lien mais non  créés"+'" TabMoreMissing "'+"Orphelins "+'" "'+"Eléments sans liens pour les appeler"+'" TabMoreOrphans "'+"Défauts"+'" "'+"Eléments ayant un contenu par  défaut"+'"  TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "Cet élément par défaut permet d'accéder a différentes options avancées",
	ColorPalette: "Les valeurs de cet élément par défaut détermine la palette des couleurs utilisée pour l'interface utilisateur de ~TiddlyWiki",
	DefaultTiddlers: "Les éléments enumérés dans cet élément par défaut seront automatiquement affichés au démarrage de ~TiddlyWiki",
	EditTemplate: "Ce gabarit HTML dans cet élément par défaut détermine la manière dont les éléments sont présentés lorsqu'ils sont édités",
	GettingStarted: "Cet élément par défaut fournit les instructions pour un usage de base",
	ImportTiddlers: "Cet élément par défaut fournit l'accès à l'importation d'éléments",
	MainMenu: "Le contenu de cet élément par défaut est utilisé comme contenu du menu principal dans la colonne à gauche de l'écran",
	MarkupPreHead: "Cet élément est inséré au début de la section <head> du fichier HTML du ~TiddlyWiki",
	MarkupPostHead: "Cet élément est inséré à la fin de la section <head> du fichier HTML du ~TiddlyWiki",
	MarkupPreBody: "Cet élément est inséré au début de la section <body> du fichier HTML du ~TiddlyWiki",
	MarkupPostBody: "Cet élément est inséré à la fin de la section <body> du fichier HTML du ~TiddlyWiki, immédiatement avant le bloc 'script'",
	OptionsPanel: "Cet élément par défaut est utilisé comme contenu du panneau déroulant des options dans la barre à droite de l'écran",
	PageTemplate: "Le gabarit HTML de cet élément détermine la mise en page générale du ~TiddlyWiki",
	PluginManager: "Cet élément par défaut fournit l'accès au gestionnaire d'extensions",
	SideBarOptions: "Cet élément par défaut est utilisé comme contenu du panneau des options dans la barre de droite de l'écran",
	SideBarTabs: "Cet élément par défaut est utilisé comme contenu du panneau des onglets dans la barre de droite de l'écran",
	SiteSubtitle: "Cet élément par défaut est utilisé comme deuxième partie du titre de la page",
	SiteTitle: "Cet élément par défaut est utilisé comme première partie du titre de la page",
	SiteUrl: "Cet élément par défaut doit contenir l'URL complet cible utilisé pour la publication",
	StyleSheetColours: "Cet élément par défaut contient des définitions CSS concernant les couleurs des composants de page",
	StyleSheet: "Cet éléments par défaut contient des définitions CSS personnalisées",
	StyleSheetLayout: "Cet éléments par défaut contient des définitions CSS concernant la mise en page de composants",
	StyleSheetLocale: "Cet élément par défaut contient des définitions CSS concernant la traduction ",
	StyleSheetPrint: "Cet élément par défaut contient des définitions CSS pour l'impression",
	TabAll: "Cet élément par défaut contient le contenu de l'onglet 'Alpha' dans la barre de droite de l'écran",
	TabMore: "Cet élément par défaut contient le contenu de l'onglet 'Suite' dans la barre de droite de l'écran",
	TabMoreMissing: "Cet élément par défaut contient le contenu de l'onglet 'Manquants' dans la barre de droite de l'écran",
	TabMoreOrphans: "Cet élément par défaut contient le contenu de l'onglet 'Orphelins' dans la barre de droite de l'écran",
	TabMoreShadowed: "Cet élément par défaut contient le contenu de l'onglet 'Défauts' dans la barre de droite de l'écran",
	TabTags: "Cet élément par défaut contient le contenu de l'onglet 'Index' dans la barre de droite de l'écran",
	TabTimeline: "Cet élément par défaut contient le contenu de l'onglet 'Chrono' dans la barre de droite de l'écran",
	ToolbarCommands: "This shadow tiddler determines which commands are shown in tiddler toolbars",
	ViewTemplate: "Le gabarit HTML dans cet élément par défaut determine comment sont présentés les éléments"
	});
//}}}


