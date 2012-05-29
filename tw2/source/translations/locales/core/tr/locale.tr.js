/***
|''Name:''|TurkishTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Turkish|
|''Author:''|Kıvılcım Hindistan|
|''Source:''|www.fazlamesai.net/sundance|
|''Subversion:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/tr/locale.tr.js|
|''Version:''|0.1.1|
|''Date:''|Jan 05, 2007|
|''Comments:''|Please make comments at http://groups.google.co.uk/group/TiddlyWikiDev|
|''License:''|[[Creative Commons Attribution-ShareAlike 2.5 License|http://creativecommons.org/licenses/by-sa/2.5/]]|
|''~CoreVersion:''|2.1.0|
***/

/*{{{*/
// Translateable strings
// ---------------------

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "tr"; // W3C language tag

merge(config.options,{
	txtUserName: "İsminiz"});

config.tasks = {
	tidy: {text: "tidy up", tooltip: "Make bulk changes across groups of tiddlers", content: 'Coming soon...\n\nThis tab will allow bulk operations on tiddlers, and tags. It will be a generalised, extensible version of the plugins tab'},
	sync: {text: "sync", tooltip: "Synchronise changes with other TiddlyWiki files and servers", content: '<<sync>>'},
	importTask: {text: "import", tooltip: "Import tiddlers and plugins from other TiddlyWiki files and servers", content: '<<importTiddlers>>'},
	copy: {text: "copy", tooltip: "Copy tiddlers to other TiddlyWiki files and servers", content: 'Coming soon...\n\nThis tab will allow tiddlers to be copied to remote servers'},
	plugins: {text: "plugins", tooltip: "Manage installed plugins", content: '<<plugins>>'}
};

merge(config.messages,{
	customConfigError: "Pluginleri yüklerken problemlerle karşılaşılmıştır. Detaylar için Plugin Yöneticisine bakınız.",
	pluginError: "Hata: %0",
	pluginDisabled: "'systemConfigDisable' etiketi tarafından devre dışı bırakıldığı için işleme konulmamıştır.",
	pluginForced: "'systemConfigForce' etiketi yüzünden işleme konulmuştur.tag",
	pluginVersionError: "Bu plugin Tiddly Wiki'nin yeni bir sürümünü gerektirdiğinden çalıştırılmamıştır.",
	nothingSelected: "Seçili öğe yok. Öncelikle bir ya da birden fazla öğe seçmeniz lazım.",
	savedSnapshotError: "Görünüşe göre TiddlyWiki hatalı olarak kaydedilmiştir. Detaylar için http://www.tiddlywiki.com/#DownloadSoftware adresine bakın",
	subtitleUnknown: "(bilinmiyor)",
	undefinedTiddlerToolTip: "'%0' isminde bir notcuk yok",
	shadowedTiddlerToolTip: "'%0' isminde oluşturulmuş bir notcuk yok, fakat ön tanımlı bir gölge değer var",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "%0'a dış link",
	noTags: "Etiketlenmiş notcuk bulunmamaktadır",
	notFileUrlError: "Değişiklikleri kaydedebilmek için bu TiddlyWiki'yi bir dosyaya kaydetmeniz gerekmektedir",
	cantSaveError: "It's not possible to save changes. Possible reasons include:\n- your browser doesn't support saving (Firefox, Internet Explorer, Safari and Opera all work if properly configured)\n- the pathname to your TiddlyWiki file contains illegal characters\n- the TiddlyWiki HTML file has been moved or renamed",
	invalidFileError: "Orjinal '%0' dosyası geçerli bir TiddlyWiki'ye benzemiyor",
	backupSaved: "Yedek dosyası kaydedildi",
	backupFailed: "Yedek dosyasının kaydı başarılamadı",
	rssSaved: "RSS akışı kaydedildi",
	rssFailed: "RSS akış dosyası kaydedilemedi",
	emptySaved: "Boş şablon dosyası kaydedildi",
	emptyFailed: "Boş şablon dosyası kaydedilemedi",
	mainSaved: "Ana TiddlyWiki dosyası kaydedildi",
	mainFailed: "Ana TiddlyWiki dosyasının kaydı başarılamadı. Yaptığınız değişiklikler kaydedilemedi.",
	macroError: "<<%0>> makrosunda hata var",
	macroErrorDetails: "<<%0>>:\n%1 makrosu çalıştırılırken hata gerçekleşti",
	missingMacro: "Böyle bir makro yok",
	overwriteWarning: "'%0' isimli bir notcuk halihazırda var. Üstüne yazmak için OK seçin",
	unsavedChangesWarning: "DİKKAT!  TiddlyWiki'de kaydedilmemiş değişiklikler var\n\n Kaydetmek için OK'e basın\nDeğişikliklerden vazgeçmek için CANCEL'a basın",
	confirmExit: "--------------------------------\n\nTiddlyWiki'de kaydedilmemiş değişiklikler var. Eğer devam ederseniz bu değişiklikleri kaybedeceksiniz.\n\n--------------------------------",
	saveInstructions: "DeğişiklikleriKaydet",
	unsupportedTWFormat: "Desteklenmeyen TiddlyWiki formatı '%0'",
	tiddlerSaveError: "'%0 isimli notcuku kaydederken hata oluştu'",
	tiddlerLoadError: "'%0' isimli notcuku yüklerken hata oluştu",
	wrongSaveFormat: "'%0' kayıt formatında kaydedilemedi. Kayıt için standart format kullanılıyor..",
	invalidFieldName: "%0 geçersiz alan ismi",
	fieldCannotBeChanged: "'%0' alanı değiştirilemez.",
	backstagePrompt: "backstage: "});

merge(config.messages.messageClose,{
	text: "kapat",
	tooltip: "bu mesaj alanını kapat"});

config.messages.dates.months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım","Aralık"];
config.messages.dates.days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
config.messages.dates.shortMonths = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
config.messages.dates.shortDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.views.wikified.tag,{
	labelNoTags: "etiket yok",
	labelTags: "etiketler: ",
	openTag: "açık etiketler '%0'",
	tooltip: "'%0' ile etiketlenmiş notcukları göster",
	openAllText: "hepsini aç",
	openAllTooltip: "Bu notcuklar için hepsini aç",
	popupNone: "'%0' ile etiketlenmiş başka notcuk yok"});

merge(config.views.wikified,{
	defaultText: "'%0' notu halihazırda mevcut değil. Oluşturmak için çift klikleyin",
	defaultModifier: "(eksik)",
	shadowModifier: "(dahili gölge notcuk)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "Oluşturulduğu tarih"});

merge(config.views.editor,{
	tagPrompt: "Etiketleri boşluklarla ayırarak yazınız. Eğer gerekirse  [[çift köşeli parantez]] kullanın, yad da mevcut etiketlerden seçtiklerinizi ekleyin",
	defaultText: "'%0' için olan metni girin"});

merge(config.views.editor.tagChooser,{
	text: "tags",
	tooltip: "Bu nota uygun etiketleri seçiniz",
	popupNone: "Tanımlanmış bir etiket bulunmamaktadır",
	tagTooltip: "'%0' isimli notu ekle"});

merge(config.macros.search,{
	label: "arama",
	prompt: "Bu TiddlyWiki'de ara",
	accessKey: "F",
	successMsg: "%1'e uyan %0 notcuk bulundu",
	failureMsg: "%0'e uygun notcuk bulunamadı"});

merge(config.macros.tagging,{
	label: "etiketliyor: ",
	labelNotTag: "etiketlenmiyor",
	tooltip: "'%0' ile etiketlenmiş notcuklar"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});

merge(config.macros.allTags,{
	tooltip: "'%0' ile etiketlenmiş notcukları göster",
	noTags: "Etiketlenmiş notcuk bulunmamakta"});

config.macros.list.all.prompt = "Bütün notcuklar alfabetik sırada";
config.macros.list.missing.prompt = "Kendilerine bağ bulunan fakat tanımlanmamış notcuklar";
config.macros.list.orphans.prompt = "Başka notlardan kendisine hiçbir bağ bulunmayan notcuklar";
config.macros.list.shadowed.prompt = "Öntanımlı içerikle doldurulmuş notcuklar";

merge(config.macros.closeAll,{
	label: "hepsini kapat",
	prompt: "Bütün görüntülenen notcukları kapat.(düzenlenenler dışında)"});

merge(config.macros.permaview,{
	label: "kalıcı görüntü",
	prompt: "Görüntülenmekte olan mevcut bütün notlara işaret eden bir bağ"});

merge(config.macros.saveChanges,{
	label: "değişiklikleri kaydet",
	prompt: "Yeni bir TiddlyWiki oluşturmak için bütün notcukları kaydet",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "yeni notcuk",
	prompt: "yeni bir notcuk oluştur",
	title: "Yeni Notcuk ",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "yeni jurnal",
	prompt: "Mevcut tarih ve saatten yeni bir notcuk oluştur",
	accessKey: "J"});

merge(config.macros.plugins,{
	wizardTitle: "Pluginler",
	step1Title: "Şu anda yüklenmekte olan pluginler",
	step1Html: "<input type='hidden' name='markList'></input>",
	skippedText: "(Bu plugin TiddlyWiki başlatıldıktan sonra eklendiği için çalıştırılamamıştır)",
	noPluginText: "Kurulu plugin bulunmamaktadır",
	confirmDeleteText: "Bu notcukları silmek istiyor musunuz?:\n\n%0",
	removeLabel: "remove systemConfig tag",
	removePrompt: "Remove systemConfig tag",
	deleteLabel: "delete",
	deletePrompt: "Delete these tiddlers forever",
	listViewTemplate : {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Title', field: 'title', tiddlerLink: 'title', title: "Başlık", type: 'TiddlerLink'},
			{name: 'Forced', field: 'forced', title: "Zorunlu", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Devredışı", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Yüklü", type: 'Boolean', trueText: "Evet", falseText: "Hayır"},
			{name: 'Error', field: 'error', title: "Durum", type: 'Boolean', trueText: "Hata", falseText: "Tamam"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.refreshDisplay,{
	label: "yenile",
	prompt: "Bütün TiddlyWiki ekranını yenile"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Mevcut notcukları salt-okunur bir TiddlyWiki'ye giremezsiniz. TiddlyWiki dosyasını  file:// URL şeklinde yerelinizde açmayı deneyin",
	wizardTitle: "Başka bir TiddlyWiki dosyasından notcukları almak",
	step1Title: "Adım 1: TiddlyWiki dosyasını seçin",
	step1Html: "URL ya da dosya sistemindeki yeri girin: <input type='text' size=50 name='txtPath'><br>...veya dosyayı bulun: <input type='file' size=50 name='txtBrowse'><br>...ya da daha önceden tanımlanmış bir akışı seçin: <select name='selFeeds'><option value=''>Seçin...</option</select>",
	fetchLabel: "Getir",
	fetchPrompt: "TiddlyWiki dosyasını getir",
	fetchError: "TiddlyWiki dosyası getirilirken problemler yaşandı",
	step2Title: "Adım 2: TiddlyWiki dosyası yükleniyor",
	step2Html: "Please wait while the file is loaded from: <strong><input type='hidden' name='markPath'></input></strong>",
	cancelLabel: "cancel",
	cancelPrompt: "Cancel this import",
	step3Title: "Adım 3: Transfer edilecek notcukları seçin",
	step3Html: "<input type='hidden' name='markList'></input>",
	importLabel: "import",
	importPrompt: "Import these tiddlers",
	confirmOverwriteText: "Bu notcukların üzerine yazmak istiyor musunuz? :\n\n%0",
	step4Title: "%0 notcuk transfer edildi",
	step4Html: "<input type='hidden' name='markReport'></input>",
	doneLabel: "bitti",
	donePrompt: "Close this wizard",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Title', field: 'title', title: "Başlık", type: 'String'},
			{name: 'Snippet', field: 'text', title: "Snippet", type: 'String'},
			{name: 'Tags', field: 'tags', title: "Etiketler", type: 'Tags'}
			],
		rowClasses: [
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
	text: "kapat",
	tooltip: " Bu notu kapat"});

merge(config.commands.closeOthers,{
	text: "diğerlerini kapat",
	tooltip: "Bütün diğer notcukları kapat"});

merge(config.commands.editTiddler,{
	text: "düzenle",
	tooltip: "Bu notu düzenle",
	readOnlyText: "göster",
	readOnlyTooltip: "Bu notun kaynak kodunu göster"});

merge(config.commands.saveTiddler,{
	text: "bitti",
	tooltip: "Bu nottaki değişiklikleri kaydet"});

merge(config.commands.cancelTiddler,{
	text: "iptal et",
	tooltip: "Bu nottaki değişiklikleri iptal et",
	warning: "'%0' notundaki değişikliklerinizi iptal etmek istiyor musunuz?",
	readOnlyText: "bitti",
	readOnlyTooltip: "B notu normal haliyle göster"});

merge(config.commands.deleteTiddler,{
	text: "sil",
	tooltip: "Bu notu sil",
	warning: "'%0' notunu silmek istiyor musunuz?"});

merge(config.commands.permalink,{
	text: "kalıcı bağ",
	tooltip: "Bu notcuk için kalıcı bağ"});

merge(config.commands.references,{
	text: "referanslar",
	tooltip: "Bu nota olan referansları göster",
	popupNone: "Hiç referans yok"});

merge(config.commands.jump,{
	text: "atla",
	tooltip: "Açık olan bir başka nota geçmek"});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[Başlamak]]",
	MainMenu: "[[Başlamak]]",
	SiteTitle: "Benim ~TiddlyWiki'm",
	SiteSubtitle: "tekrar kullanılabilir, sırasal olmayan, web defteri",
	SiteUrl: "http://www.tiddlywiki.com/",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "seçenekler »" "Gelişmiş TiddlyWiki seçeneklerini değiştirmek">>',
	SideBarTabs: '<<tabs txtMainTab "Zaman Akışı" "Zaman Akışı" TabTimeline "Tümü" "Bütün notcuklar" TabAll "Etiket" "Bütün etiketler" TabTags "Daha" "Daha fazla notcuk" TabMore>>',
	TabTimeline: '<<timeline>>',
	TabAll: '<<list all>>',
	TabTags: '<<allTags excludeLists>>',
	TabMore: '<<tabs txtMoreTab "Kayıp" "Kayıp notcuklar" TabMoreMissing "Yetimler" "Yetim notcuklar" TabMoreOrphans "Gölgelenmiş" "Gölgelenmiş notcuklar" TabMoreShadowed>>',
	TabMoreMissing: '<<list missing>>',
	TabMoreOrphans: '<<list orphans>>',
	TabMoreShadowed: '<<list shadowed>>',
	PluginManager: '<<plugins>>',
	ImportTiddlers: '<<importTiddlers>>'});

/*}}}*/
