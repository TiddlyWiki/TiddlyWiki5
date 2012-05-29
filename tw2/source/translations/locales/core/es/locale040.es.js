/***
|''Nombre:''|ComplementoTraducciónEspañol|
|''Descripción:''|Traducción de TiddlyWiki al español|
|''Autores:''|Sergio González y Pedro Domínguez (sgm214 (at) gmail (dot) com / alpedro (at) hotmail (dot) com)|
|''Correcciónes:''|Dave Gifford y Ton van Rooijen (giff (at) giffmex (dot) org / tonsweb (at) xs4all (dot) nl)|
|''Fuente:''|http://www.ton-van-rooijen.nl/TW/locale040.es.js |
|''Código:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/en/locale.en.js |
|''Versión:''|0.4.0|
|''Fecha:''|Septiembre 8, 2009|
|''Comentarios:''|Por favor deje sus comentarios en http://groups.google.co.uk/group/TiddlyWikiDev |
|''Licencia:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~VersiónNúcleo:''|2.5.2|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "es"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "SuNombre"});

merge(config.tasks,{
	save: {text: "guardar", tooltip: "Guardar los cambios hechos en este TiddlyWiki", action: saveChanges},
	sync: {text: "sincronizar", tooltip: "Sincronizar los cambios hechos con otros servidores y archivos TiddlyWiki", content: '<<sync>>'},
	importTask: {text: "importar", tooltip: "Importar tiddlers y plugins de otros servidores y archivos TiddlyWiki", content: '<<importTiddlers>>'},
	tweak: {text: "configurar", tooltip: "Cambiar la apariencia y comportamiento de TiddlyWiki", content: '<<options>>'},
	upgrade: {text: "actualizar", tooltip: "Actualizar el código del núcleo de TiddlyWiki", content: '<<upgrade>>'},	
	plugins: {text: "complementos", tooltip: "Gestionar los complementos instalados", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Nombre de usuario con el que firmará lo editado",
	chkRegExpSearch: "Permitir expresiones regulares en la búsqueda",
	chkCaseSensitiveSearch: "Distinguir mayúscula/minúscula en la búsqueda",
	chkIncrementalSearch: "Búsqueda incremental letra a letra",
	chkAnimate: "Activar animaciones",
	chkSaveBackups: "Mantener la copia de seguridad cuando se guardan los cambios",
	chkAutoSave: "Guardar automáticamente los cambios",
	chkGenerateAnRssFeed: "Crear una noticia RSS cuando se guardan los cambios",
	chkSaveEmptyTemplate: "Crear una plantilla vacía cuando se guardan los cambios",
	chkOpenInNewWindow: "Abrir los enlaces externos en una nueva ventana",
	chkToggleLinks: "Al pulsar sobre un enlace de un tiddler, éste se cierra",
	chkHttpReadOnly: "Ocultar la edición cuando se muestra en HTTP",
	chkForceMinorUpdate: "No cambiar el nombre de usuario y fecha cuando se edita un tiddler",
	chkConfirmDelete: "Preguntar antes de borrar un tiddler",
	chkInsertTabs: "Usar el tabulador para crear texto en columnas en vez de servir para moverse entre apartados",
	txtBackupFolder: "Nombre del directorio en que se guardan las copias de seguridad",
	txtMaxEditRows: "Número máximo de filas en los recuadros de edición",
	txtTheme: "Nombre de tema para utilizar",
	txtFileSystemCharSet: "Juego de caracteres por defecto para guardar los cambios (sólo Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Hubo problemas al cargar los complementos. Mire el Gestor de Complementos para más detalles",
	pluginError: "Error: %0",
	pluginDisabled: "No ejecutado porque está inhabilitado en la etiqueta 'systemConfigDisable'",
	pluginForced: "Ejecutado porque lo fuerza la etiqueta 'systemConfigForce'",
	pluginVersionError: "No ejecutado porque este complemento necesita una versión más moderna de TiddlyWiki",
	nothingSelected: "No hay nada seleccionado. Debe marcar uno o más primero",
	savedSnapshotError: "Parece que este TiddlyWiki se ha guardado incorrectamente. Por favor mire http://www.tiddlywiki.com/#Download para más detalles",
	subtitleUnknown: "(desconocido)",
	undefinedTiddlerToolTip: "El tiddler '%0' no existe todavía",
	shadowedTiddlerToolTip: "El tiddler '%0' no existe todavía, pero tiene un valor oculto definido previamente",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Enlace externo a %0",
	noTags: "No hay tiddlers sin etiquetas",
	notFileUrlError: "Debe guardar este TiddlyWiki en un archivo antes de que pueda guardar los cambios",
	cantSaveError: "No se pueden guardar los cambios. Algunas de las posibles causas pueden ser:\n- su navegador no permite guardar (Firefox, Internet Explorer, Safari and Opera funcionan bien si están correctamente configurados)\n- la ruta a su archivo TiddlyWiki tiene caracteres no válidos\n- El archivo HTML TiddlyWiki ha sido movido o renombrado",
	invalidFileError: "El archivo original '%0' parece que no es un archivo TiddlyWiki válido",
	backupSaved: "Copia de seguridad guardada",
	backupFailed: "Error al guardar la copia de seguridad",
	rssSaved: "Noticia RSS guardada",
	rssFailed: "Error al guardar la noticia RSS",
	emptySaved: "Plantilla en blanco guardada",
	emptyFailed: "Error al guardar la plantilla en blanco",
	mainSaved: "Archivo principal TiddlyWiki guardado",
	mainFailed: "Error al guardar el archivo principal TiddlyWiki. Los cambios no se han guardado",
	macroError: "Error en la macro <<\%0>>",
	macroErrorDetails: "Error mientras se ejecutaba la macro <<\%0>>:\n%1",
	missingMacro: "No existe esa macro",
	overwriteWarning: "Un tiddler llamado '%0' ya existe. Elija OK si quiere sobrescribirlo",
	unsavedChangesWarning: "¡ATENCIÓN! Hay cambios sin guardar en  TiddlyWiki\n\nElija OK para guardarlos\nElija CANCELAR para descartarlos",
	confirmExit: "--------------------------------\n\nHay cambios sin guardar en TiddlyWiki. Si prosigue perderá los cambios\n\n--------------------------------",
	saveInstructions: "Guardar Cambios",
	unsupportedTWFormat: "Formato de TiddlyWiki no soportado '%0'",
	tiddlerSaveError: "Error al guardar el tiddler '%0'",
	tiddlerLoadError: "Error al cargar el tiddler '%0'",
	wrongSaveFormat: "No se puede guardar en el formato '%0'. Usando el formato estandar para guardarlo.",
	invalidFieldName: "Nombre de apartado no válido %0",
	fieldCannotBeChanged: "El apartado '%0' no se puede cambiar",
	loadingMissingTiddler: "Intentando descargar el tiddler '%0' desde el servidor '%1' en:\n\n'%2' en el espacio de trabajo '%3'",
	upgradeDone: "Actualización a la versión %0 completada\n\nPulse 'OK' para cargar la nueva versión de TiddlyWiki"});

merge(config.messages.messageClose,{
	text: "cerrar",
	tooltip: "cerrar el mensaje"});

config.messages.backstage = {
	open: {text: "bastidores", tooltip: "Acceder a bastidores para gestionar TiddlyWiki"},
	close: {text: "cerrar", tooltip: "Salir de bastidores"},
	prompt: "bastidores: ",
	decal: {
		edit: {text: "editar", tooltip: "Editar el tiddler '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Pulse para ver el texto completo de este tiddler",
	previewUnavailable: "(Vista previa no disponible)"
};

config.messages.dates.months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre","Diciembre"];
config.messages.dates.days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
config.messages.dates.shortMonths = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
config.messages.dates.shortDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
// suffixes for dates, eg "1ro","2do","3ro"..."30ro","31ro"
config.messages.dates.daySuffixes = ["ro","do","ro","to","to","to","mo","vo","no","mo",
		"ro","do","ro","to","to","to","mo","vo","no","mo",
		"ro","do","ro","to","to","to","mo","vo","no","mo",
		"ro"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "sin etiquetas",
	labelTags: "etiquetas: ",
	openTag: "Abrir etiqueta '%0'",
	tooltip: "Mostrar tiddlers que tengan la etiqueta '%0'",
	openAllText: "Abrir todos",
	openAllTooltip: "Abrir todos estos tiddlers",
	popupNone: "No abrir tiddlers que tengan por etiqueta '%0'"});

merge(config.views.wikified,{
	defaultText: "El tiddler '%0' no existe todavía. Haga doble click para crearlo",
	defaultModifier: "(perdido)",
	shadowModifier: "(tiddler oculto interno)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "creado"});

merge(config.views.editor,{
	tagPrompt: "Escriba etiquetas separadas por espacios, [[use dobles corchetes]] si es necesario, o añada alguna existente",
	defaultText: "Escriba el texto para '%0'"});

merge(config.views.editor.tagChooser,{
	text: "etiquetas",
	tooltip: "Elija etiquetas ya existentes para añadirlas a este artículo",
	popupNone: "No hay etiquetas definidas",
	tagTooltip: "Añadir la etiqueta '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "búsqueda",
	prompt: "Búsqueda en este TiddlyWiki",
	accessKey: "F",
	successMsg: "%0 tiddlers encontrados que concuerden con %1",
	failureMsg: "No hay tiddlers que concuerden con %0"});

merge(config.macros.tagging,{
	label: "etiquetado: ",
	labelNotTag: "Sin etiquetas",
	tooltip: "Listado de tiddlers etiquetados con '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Mostrar los tiddlers etiquetados con '%0'",
	noTags: "No hay tiddlers sin etiquetas"});

config.macros.list.all.prompt = "Todos los tiddlers ordenados alfabéticamente";
config.macros.list.missing.prompt = "Tiddlers que tienen enlaces a ellos pero no están definidos";
config.macros.list.orphans.prompt = "Tiddlers que no están enlazados con otros, ni otros los enlazan";
config.macros.list.shadowed.prompt = "Tiddlers ocultos con contenidos predefinidos";
config.macros.list.touched.prompt = "Tiddlers que no han sido modificados localmente";

merge(config.macros.closeAll,{
	label: "cerrar todo",
	prompt: "Cerrar todos los tiddlers mostrados (excepto los que estén siendo editados)"});

merge(config.macros.permaview,{
	label: "vistapermanente",
	prompt: "Enlazar con una URL que recoge todos los tiddlers mostrados actualmente"});

merge(config.macros.saveChanges,{
	label: "guardar cambios",
	prompt: "Guardar todos los tiddlers editados previamente",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "nuevo tiddler",
	prompt: "Crear un nuevo tiddler",
	title: "Nuevo Tiddler",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "nuevo tiddler con fecha de hoy",
	prompt: "Crear un nuevo tiddler con la fecha y hora actual",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Configurar opciones avanzadas",
	step1Title: "Estas opciones se guardarán en una cookie en su navegador",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Mostrar opciones desconocidas</input>",
	unknownDescription: "//(desconocido)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Opción", type: 'String'},
			{name: 'Description', field: 'description', title: "Descripción", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Nombre", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Configurar complementos",
	step1Title: "Complementos que están activados",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Este complemento no ha sido ejecutado porque se cargó al inicio)",
	noPluginText: "No hay complementos instalados",
	confirmDeleteText: "¿Está seguro que quiere borrar estos complementos:\n\n%0?",
	removeLabel: "quitar la etiqueta de systemConfig",
	removePrompt: "Quitar la etiqueta systemConfig",
	deleteLabel: "borrar",
	deletePrompt: "Borrar estos artículos para siempre",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Descripción", type: 'String'},
			{name: 'Version', field: 'Version', title: "Versión", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Tamaño", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Forzado", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Deshabilitado", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Cargado", type: 'Boolean', trueText: "Si", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Al inicio", type: 'String'},
			{name: 'Error', field: 'error', title: "Estado", type: 'Boolean', trueText: "Error", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Registro", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "más",
	morePrompt: "Mostrar más comandos",
	lessLabel: "menos",
	lessPrompt: "Ocultar comandos adicionales",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "actualizar",
	prompt: "Actualizar la vista de todo TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "No puede importar a un archivo TiddlyWiki de sólo lectura. Pruebe a abrirlo desde un archivo:// URL",
	wizardTitle: "Importar tiddlers de otro archivo o servidor",
	step1Title: "Primer paso: Localice el servidor o el archivo TiddlyWiki",
	step1Html: "Indique el tipo de servidor: <select name='selTypes'><option value=''>Elija...</option></select><br>Escriba la URL o la ruta aquí: <input type='text' size=50 name='txtPath'><br>...o navegue hasta un archivo: <input type='file' size=50 name='txtBrowse'><br><hr>...o elija una fuente predefinida: <select name='selFeeds'><option value=''>Elige...</option></select>",
	openLabel: "abrir",
	openPrompt: "Abrir la conexión a este archivo o servidor",
	openError: "Hubo problemas obteniendo el archivo tiddlywiki",
	statusOpenHost: "Accediendo al anfitrión",
	statusGetWorkspaceList: "Obteniendo el listado de espacios de trabajo",
	step2Title: "Segundo paso: Elegir el espacio de trabajo",
	step2Html: "Escriba el nombre de un espacio de trabajo: <input type='text' size=50 name='txtWorkspace'><br>...o seleccione uno: <select name='selWorkspace'><option value=''>Elegir...</option></select>",
	cancelLabel: "cancelar",
	cancelPrompt: "Cancelar esta importación",
	statusOpenWorkspace: "Accediendo al espacio de trabajo",
	statusGetTiddlerList: "Obteniendo el listado de tiddlers disponibles",
	errorGettingTiddlerList: "Error al obtener la lista de tiddlers, pulsa Cancelar para intentarlo de nuevo",
	step3Title: "Tercer paso: Elegir los tiddlers que quiere importar",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Mantener estos tiddlers enlazados a este servidor para poder sincronizar los cambios posteriores</input><br><input type='checkbox' name='chkSave'>Guardar los datos de este servidor en un tiddler con etiqueta 'systemServer' cuyo nombre será:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "importar",
	importPrompt: "Importar estos tiddlers",
	confirmOverwriteText: "¿Está seguro de que quiere sobrescribir estos tiddlers:\n\n%0?",
	step4Title: "Cuarto paso: Importar %0 tiddler(s)",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "hecho",
	donePrompt: "Cerrar el asistente",
	statusDoingImport: "Importando tiddlers",
	statusDoneImport: "Todos los tiddlers se importaron",
	systemServerNamePattern: "%2 en %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "El tiddler '%0' ya existe. Pulse en 'OK' para sobrescribirlo con el que hay en este servidor, o 'Cancel' para dejarlo sin modificar",
	serverSaveTemplate: "|''Tipo:''|%0|\n|''URL:''|%1|\n|''Espacio de trabajo:''|%2|\n\nEste tiddler se creó automáticamente para recoger todos los datos de este servidor",
	serverSaveModifier: "(Sistema)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Tamaño", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Etiquetas", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "Actualizar el código del núcleo de TiddlyWiki",
	step1Title: "Actualizar o reparar TiddlyWiki a la última versión",
	step1Html: "Está a punto de actualizar el código del núcleo de TiddlyWiki ala última versión (desde <a href='%0' class='externalLink' target='_blank'>%1</a>). El contenido de TiddlyWiki permanecerá tras la actualización.<br><br>Las actualizaciones del núcleo interfieren con complementos antiguos. Si tiene problemas tras la actualización, mire <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "No se puede actualizar. Sólo se pueden actualizar archivos TiddlyWiki que estén guardados localmente (disco duro, etc.)",
	errorNotSaved: "Debe guardar los cambios antes de poder actualizar",
	step2Title: "Confirmar los detalles de la actualización",
	step2Html_downgrade: "Está a punto de retroceder en su versión de TilldyWiki, pasará a la versión anterior %0 desde %1.<br><br>Retroceder a una versión anterior del núcleo no es recomendable",
	step2Html_restore: "Este archivo TiddlyWiki parece que usa la última versión disponible del núcleo (%0).<br><br>Puede seguir con la actualización si quiere asegurarse que su núcleo no está estropeado o dañado",
	step2Html_upgrade: "Está a punto de actualizar TiddlyWiki a la versión %0 desde %1",
	upgradeLabel: "actualizar",
	upgradePrompt: "Preparándose para el proceso de actualización",
	statusPreparingBackup: "Preparando la copia de seguridad",
	statusSavingBackup: "Guardando la copia de seguridad",
	errorSavingBackup: "Hubo poblemas al guardar la copia de seguridad",
	statusLoadingCore: "Cargando el código del núcleo",
	errorLoadingCore: "Error al cargar el código del núcleo",
	errorCoreFormat: "Error con el código del nuevo núcleo",
	statusSavingCore: "Guardando el código del nuevo núcleo",
	statusReloadingCore: "Recargando el código del nuevo núcleo",
	startLabel: "empezar",
	startPrompt: "Empezar el proceso de actualización",
	cancelLabel: "cancelar",
	cancelPrompt: "Cancelar la actualización",
	step3Title: "Actualización cancelada",
	step3Html: "Ha cancelado el proceso de actualización"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Tipo de servidor", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Servidor anfitrión", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Espacio de trabajo en el servidor", type: 'String'},
			{name: 'Status', field: 'status', title: "Estado de la sincronización", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "URL del servidor", text: "Ver", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Sincronizar estos tiddlers", name: 'sync'}
			]},
	wizardTitle: "Sincronizar con servidores externos y archivos",
	step1Title: "Elija los tiddlers que quieres sincronizar",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "sinc",
	syncPrompt: "Sincronizar estos tiddlers",
	hasChanged: "Modificado mientras no estaba desconectado",
	hasNotChanged: "Sin cambios mientras estaba desconectado",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "Modificado en el servidor", display:null, className:'changedServer'},
		changedLocally: {text: "Modificado mientras estaba desconectado", display:null, className:'changedLocally'},
		changedBoth: {text: "Modificado mientras estaba desconectado y también en el servidor", display:null, className:'changedBoth'},
		notFound: {text: "No está en el servidor", display:null, className:'notFound'},
		putToServer: {text: "Guardada la actualización en el servidor", display:null, className:'putToServer'},
		gotFromServer: {text: "Actualización obtenida del servidor", display:null, className:'gotFromServer'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "cerrar",
	tooltip: "Cerrar este tiddler"});

merge(config.commands.closeOthers,{
	text: "cerrar otros",
	tooltip: "Cerrar todos los otros tiddlers"});

merge(config.commands.editTiddler,{
	text: "editar",
	tooltip: "Editar este tiddler",
	readOnlyText: "ver",
	readOnlyTooltip: "Ver el código de este tiddler"});

merge(config.commands.saveTiddler,{
	text: "hecho",
	tooltip: "Guardar los cambios hechos en este tiddler"});

merge(config.commands.cancelTiddler,{
	text: "cancelar",
	tooltip: "Cancelar los cambios hechos en este tiddler",
	warning: "¿Está seguro que quiere salir sin guardar los cambios en '%0'?",
	readOnlyText: "hecho",
	readOnlyTooltip: "Vista normal de este tiddler"});

merge(config.commands.deleteTiddler,{
	text: "borrar",
	tooltip: "Borrar este tiddler",
	warning: "¿Está seguro de que quiere borrar '%0'?"});

merge(config.commands.permalink,{
	text: "enlacepermanente",
	tooltip: "Enlace permanente para este tiddler"});

merge(config.commands.references,{
	text: "referencias",
	tooltip: "Mostrar tiddlers que enlazan con éste",
	popupNone: "Sin referencias"});

merge(config.commands.jump,{
	text: "ir a",
	tooltip: "Ir a otro tiddler abierto"});

merge(config.commands.syncing,{
	text: "sinc",
	tooltip: "Controlar la sincronización de este tiddler con un servidor o archivo externo",
	currentlySyncing: "<div>Sincronizando ahora mediante  <span class='popupHighlight'>'%0'</span> a:</"+"div><div>anfitrión: <span class='popupHighlight'>%1</span></"+"div><div>espacio de trabajo: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Ahora no se está sincronizando",
	captionUnSync: "Parar la sincronización para este tiddler",
	chooseServer: "Sincronizar este tiddler con otro servidor:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "apartados",
	tooltip: "Mostrar los apartados extras de este tiddler",
	emptyText: "No hay apartados extras para este tiddler",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Apartado", type: 'String'},
			{name: 'Value', field: 'value', title: "Valor", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[ParaEmpezar]]",
	MainMenu: "[[ParaEmpezar]]\n\n\n^^~TiddlyWiki versión <<version>>\n© 2009 [[UnaMesa|http://www.unamesa.org/]]^^",
	ParaEmpezar: "Para empezar con este archivo TiddlyWiki vacío, necesitará modificar los siguientes tiddlers (en este contexto podemos entender que un tiddler es un artículo):\n* SiteTitle & SiteSubtitle: El título y subtítulo del sitio, como se muestra arriba (tras guardalo, también aparecerá en el título de la ventana del navegador)\n* MainMenu: El menú (normalmente a la izquierda)\n* DefaultTiddlers: Contiene los nombres de los tiddlers que por defecto quiere que se muestren cuando TiddlyWiki se abre\nTambién debería cambiar el nombre de usuario con el que firmará sus escritos: <<option txtUserName>>",
	SiteTitle: "Mi TiddlyWiki",
	SiteSubtitle: "un diario web personal, reutilizable y no lineal",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Estas opciones personales de visualización de TiddlyWiki se guardan en el navegador\n\nSu nombre de usuario con el que firmará tus escritos. Escríbalo como si fuera una PalabraWiki (ej JuanEscribió)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Guardar copia de seguridad\n<<option chkAutoSave>> Autoguardado\n<<option chkRegExpSearch>> Búscar expresiones regulares\n<<option chkCaseSensitiveSearch>> Buscar distinguiendo mayúsculas\n<<option chkAnimate>> Permitir animaciones\n\n----\nMirar también las [[OpcionesAvanzadas|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "opciones \u00bb" "Cambiar las opciones avanzadas de TiddlyWiki">>',
	SideBarTabs: '<<tabs txtMainTab "Historial" "Historial" TabTimeline "Todo" "Todos los tiddlers" TabAll "Etiquetas" "Todas las etiquetas" TabTags "Más" "Más listados" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Perdidos" "Tiddlers perdidos" TabMoreMissing "Huérfanos" "Tiddlers huérfanos" TabMoreOrphans "Ocultos" "Tiddlers ocultos" TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "Este tiddler oculto permite controlar bastantes opciones avanzadas",
	ColorPalette: "Los valores en este tiddler oculto configuran el esquema de colores de la interfaz de ~TiddlyWiki",
	DefaultTiddlers: "Los tiddlers listados en este tiddler oculto son que se mostrarán por defecto cuando se abre ~TiddlyWiki",
	EditTemplate: "La plantilla HTML en este tiddler oculto indica cómo se muestran los tiddlers mientras se editan",
	GettingStarted: "Este tiddler oculto contiene las instrucciones básicas de utilización",
	ImportTiddlers: "Este tiddler oculto permite acceder a los tiddlers que se están importando",
	MainMenu: "Este tiddler oculto contiene los apartados que se muestran en el menú principal de la columna de la izquierda de la pantalla",
	MarkupPreHead: "Este tiddler se inserta al principio de la sección <head> del archivo HTML de TiddlyWiki",
	MarkupPostHead: "Este tiddler se inserta al final de la sección  <head> del archivo HTML de TiddlyWiki",
	MarkupPreBody: "Este tiddler se inserta al principio de la sección <body> del archivo HTML de TiddlyWiki",
	MarkupPostBody: "Este tiddler se inserta al final de la sección <body> del archivo HTML de TiddlyWiki, justo antes del bloque de script",
	OptionsPanel: "Este tiddler oculto contiene los apartados de la opción desplegable Opciones, de la barra de la derecha",
	PageTemplate: "La plantilla HTML en este tiddler oculto determina la estructura general de ~TiddlyWiki",
	PluginManager: "Este tiddler oculto permite acceder al Gestor de Complementos",
	SideBarOptions: "Este tiddler oculto contiene lo que hay en el apartado de opciones de la barra de la derecha",
	SideBarTabs: "Este tiddler oculto contiene lo que hay en el panel de pestañas de la barra de la derecha",
	SiteSubtitle: "Este tiddler oculto contiene la segunda parte del título de la página",
	SiteTitle: "Este tiddler oculto contiene la primera parte del título de la página",
	SiteUrl: "Este tiddler oculto debería contener la dirección completa URL en la que se publica",
	StyleSheetColours: "Este tiddler oculto contiene las definiciones para CSS relacionadas con el color de los elementos de la página",
	StyleSheet: "En este tiddler oculto se pueden poner definiciones para CSS personales",
	StyleSheetLayout: "Este tiddler oculto contiene las definiciones para CSS relacionadas con la distribución de los elementos de la página. ''NO EDITE ESTE TIDDLER'', si quiere hacer alguna modificación hágalo en el tiddler oculto StyleSheet",
	StyleSheetLocale: "Este tiddler oculto contiene las definiciones para CSS relacionadas con la traducción al idioma local",
	StyleSheetPrint: "Este tiddler oculto contiene las definiciones para CSS relacionadas con la impresión",
	TabAll: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Todo' de la barra de la derecha",
	TabMore: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Más' de la barra de la derecha",
	TabMoreMissing: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Perdidos' de la barra de la derecha",
	TabMoreOrphans: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Huérfanos' de la barra de la derecha",
	TabMoreShadowed: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Ocultos' de la barra de la derecha",
	TabTags: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Etiquetas' de la barra de la derecha",
	TabTimeline: "Este tiddler oculto contiene todo lo que hay en la pestaña 'Historial' de la barra de la derecha",
	ToolbarCommands: "Este tiddler oculto indica los comandos que deben mostrarse en la barra de herramientas de cualquier tiddler",	
	ViewTemplate: "Este tiddler oculto contiene la plantilla HTML que indica cómo se muestran los tiddlers"
	});

//}}}
