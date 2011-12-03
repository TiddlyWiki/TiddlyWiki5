/***
|''Name:''|zh-HantTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Traditional Chinese|
|''Source:''|http://tiddlywiki-zh.googlecode.com/svn/trunk/|
|''Subversion:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/zh-Hant/locale.zh-Hant.js|
|''Author:''|BramChen (bram.chen (at) gmail (dot) com)|
|''Version:''|2.6|
|''Date:''|Aug 06, 2010|
|''Comments:''|Please make comments at http://groups.google.com/group/TiddlyWiki-zh/|
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]]|
|''~CoreVersion:''|2.4.1|
***/

//{{{
// --
// -- Translateable strings
// --

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = 'zh-Hant'; // W3C language tag
config.options.txtFileSystemCharSet = 'BIG5';

if (config.options.txtUserName == 'YourName' || !config.options.txtUserName) // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "YourName"});

merge(config.tasks,{
	save: {text: "儲存", tooltip: "儲存變更至此 TiddlyWiki", action: saveChanges},
	sync: {text: "同步", tooltip: "將你的資料內容與外部伺服器與檔案同步", content: '<<sync>>'},
	importTask: {text: "導入", tooltip: "自其他檔案或伺服器導入文章或套件", content: '<<importTiddlers>>'},
	tweak: {text: "選項", tooltip: "改變此 TiddlyWiki 的顯示與行為的設定", content: '<<options>>'},
	upgrade: {text: "更新", tooltip: "更新 TiddlyWiki 核心程式", content: '<<upgrade>>'},
	plugins: {text: "套件管理", tooltip: "管理已安裝的套件", content: '<<plugins>>'}
});

merge(config.optionsDesc,{
	txtUserName: "編輯文章所使用之作者署名",
	chkRegExpSearch: "啟用正規式搜尋",
	chkCaseSensitiveSearch: "搜尋時，區分大小寫",
	chkIncrementalSearch: "隨打即找搜尋",
	chkAnimate: "使用動畫顯示",
	chkSaveBackups: "儲存變更前，保留備份檔案",
	chkAutoSave: "自動儲存變更",
	chkGenerateAnRssFeed: "儲存變更時，也儲存 RSS feed",
	chkSaveEmptyTemplate: "儲存變更時，也儲存空白範本",
	chkOpenInNewWindow: "於新視窗開啟連結",
	chkToggleLinks: "點擊已開啟文章連結時，將其關閉",
	chkHttpReadOnly: "非本機瀏覽文件時，隱藏編輯功能",
	chkForceMinorUpdate: "修改文章時，不變更作者名稱與日期時間",
	chkConfirmDelete: "刪除文章前須確認",
	chkInsertTabs: "使用 tab 鍵插入定位字元，而非跳至下一個欄位",
	txtBackupFolder: "存放備份檔案的資料夾",
	txtMaxEditRows: "編輯模式中顯示列數",
	txtTheme: "使用的佈景名稱",
	txtFileSystemCharSet: "指定儲存文件所在之檔案系統之字集 (僅適用於 Firefox/Mozilla only)"});

// Messages
merge(config.messages,{
	customConfigError: "套件載入發生錯誤，詳細請參考 PluginManager",
	pluginError: "發生錯誤: %0",
	pluginDisabled: "未執行，因標籤設為 'systemConfigDisable'",
	pluginForced: "已執行，因標籤設為 'systemConfigForce'",
	pluginVersionError: "未執行，套件需較新版本的 TiddlyWiki",
	nothingSelected: "尚未作任何選擇，至少需選擇一項",
	savedSnapshotError: "此 TiddlyWiki 未正確存檔，詳見 http://www.tiddlywiki.com/#Download",
	subtitleUnknown: "(未知)",
	undefinedTiddlerToolTip: "'%0' 尚無內容",
	shadowedTiddlerToolTip: "'%0' 尚無內容, 但已定義隱藏的預設值",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "外部連結至 %0",
	noTags: "未設定標籤的文章",
	notFileUrlError: "須先將此 TiddlyWiki 存至檔案，才可儲存變更",
	cantSaveError: "無法儲存變更。可能的原因有：\n- 你的瀏覽器不支援此儲存功能（Firefox, Internet Explorer, Safari and Opera 經適當設定後可儲存變更）\n- 也可能是你的 TiddlyWiki 檔名包含不合法的字元所致。\n- 或是 TiddlyWiki 文件被改名或搬移。",
	invalidFileError: " '%0' 非有效之 TiddlyWiki 文件",
	backupSaved: "已儲存備份",
	backupFailed: "無法儲存備份",
	rssSaved: "RSS feed 已儲存",
	rssFailed: "無法儲存 RSS feed ",
	emptySaved: "已儲存範本",
	emptyFailed: "無法儲存範本",
	mainSaved: "主要的TiddlyWiki已儲存",
	mainFailed: "無法儲存主要 TiddlyWiki，所作的改變未儲存",
	macroError: "巨集 <<\%0>> 執行錯誤",
	macroErrorDetails: "執行巨集 <<\%0>> 時，發生錯誤 :\n%1",
	missingMacro: "無此巨集",
	overwriteWarning: "'%0' 已存在，[確定]覆寫之",
	unsavedChangesWarning: "注意！ 尚未儲存變更\n\n[確定]存檔，或[取消]放棄存檔？",
	confirmExit: "--------------------------------\n\nTiddlyWiki 以更改內容尚未儲存，繼續的話將遺失這些更動\n\n--------------------------------",
	saveInstructions: "SaveChanges",
	unsupportedTWFormat: "未支援此 TiddlyWiki 格式：'%0'",
	tiddlerSaveError: "儲存文章 '%0' 時，發生錯誤。",
	tiddlerLoadError: "載入文章 '%0' 時，發生錯誤。",
	wrongSaveFormat: "無法使用格式 '%0' 儲存，請使用標准格式存放",
	invalidFieldName: "無效的欄位名稱：%0",
	fieldCannotBeChanged: "無法變更欄位：'%0'",
	loadingMissingTiddler: "正從伺服器 '%1' 的：\n\n工作區 '%3' 中的 '%2' 擷取文章 '%0'",
	upgradeDone: "已更新至 %0 版\n\n點擊 '確定' 重新載入更新後的 TiddlyWiki",
	invalidCookie: "無效的 cookie '%0'"});

merge(config.messages.messageClose,{
	text: "關閉",
	tooltip: "關閉此訊息"});

merge(config.messages,{
	backstage: {
		open: {text: "控制台", tooltip: "開啟控制台執行編寫工作"},
		close: {text: "關閉", tooltip: "關閉控制台"},
		prompt: "控制台：",
		decal: {
			edit: {text: "編輯", tooltip: "編輯 '%0'"}
		}}});

merge(config.messages,{
	listView: {
		tiddlerTooltip: "檢視全文",
		previewUnavailable: "(無法預覽)"}});

merge(config.messages,{
	dates: {
	months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
	days: ["星期日", "星期一","星期二", "星期三", "星期四", "星期五", "星期六"],
	shortMonths: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
	shortDays: ["日", "一","二", "三", "四", "五", "六"],
	daySuffixes: ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"],
	am: "上午",
	pm: "下午"}});

merge(config.messages.tiddlerPopup,{ 
	});

merge(config.views.wikified.tag,{
	labelNoTags: "未設標籤",
	labelTags: "標籤: ",
	openTag: "開啟標籤 '%0'",
	tooltip: "顯示標籤為 '%0' 的文章",
	openAllText: "開啟以下所有文章",
	openAllTooltip: "開啟以下所有文章",
	popupNone: "僅此文標籤為 '%0'"});

merge(config.views.wikified,{
	defaultText: "",
	defaultModifier: "(未完成)",
	shadowModifier: "(預設)",
	dateFormat: "YYYY年0MM月0DD日",
	createdPrompt: "建立於"});

merge(config.views.editor,{
	tagPrompt: "設定標籤之間以空白區隔，[[標籤含空白時請使用雙中括弧]]，或點選現有之標籤加入",
	defaultText: ""});

merge(config.views.editor.tagChooser,{
	text: "標籤",
	tooltip: "點選現有之標籤加至本文章",
	popupNone: "未設定標籤",
	tagTooltip: "加入標籤 '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: " 尋找",
	prompt: "搜尋本 Wiki",
	accessKey: "F",
	successMsg: " %0 篇符合條件: %1",
	failureMsg: " 無符合條件: %0"});

merge(config.macros.tagging,{
	label: "引用標籤:",
	labelNotTag: "無引用標籤",
	tooltip: "列出標籤為 '%0' 的文章"});

merge(config.macros.timeline,{
	dateFormat: "YYYY年0MM月0DD日"});

merge(config.macros.allTags,{
	tooltip: "顯示文章- 標籤為'%0'",
	noTags: "沒有標籤"});

config.macros.list.all.prompt = "依字母排序";
config.macros.list.missing.prompt = "被引用且內容空白的文章";
config.macros.list.orphans.prompt = "未被引用的文章";
config.macros.list.shadowed.prompt = "這些隱藏的文章已預設內容";
config.macros.list.touched.prompt = "自下載或新增後被修改過的文章"; 

merge(config.macros.closeAll,{
	label: "全部關閉",
	prompt: "關閉所有開啟中的 tiddler (編輯中除外)"});

merge(config.macros.permaview,{
	label: "引用連結",
	prompt: "可存取現有開啟之文章的連結位址"});

merge(config.macros.saveChanges,{
	label: "儲存變更",
	prompt: "儲存所有文章，產生新的版本",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "新增文章",
	prompt: "新增 tiddler",
	title: "新增文章",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "新增日誌",
	prompt: "新增 jounal",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "增訂的進階選項",
	step1Title: "增訂的選項儲存於瀏覽器的 cookies",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>顯示未知選項</input>",
	unknownDescription: "//(未知)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "選項", type: 'String'},
			{name: 'Description', field: 'description', title: "說明", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "名稱", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "擴充套件管理",
	step1Title: "- 已載入之套件",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(此套件因剛加入，故尚未執行)",
	noPluginText: "未安裝套件",
	confirmDeleteText: "確認是否刪除所選套件:\n\n%0",
	removeLabel: "移除 systemConfig 標籤",
	removePrompt: "移除 systemConfig 標籤",
	deleteLabel: "刪除",
	deletePrompt: "永遠刪除所選套件",

	listViewTemplate : {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "套件", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "說明", type: 'String'},
			{name: 'Version', field: 'Version', title: "版本", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "大小", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "強制執行", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "停用", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "已載入", type: "Boolean", trueText: "是", falseText: "否"},
			{name: 'Startup Time', field: 'startupTime', title: "載入時間", type: 'String'},
			{name: 'Error', field: 'error', title: "載入狀態", type: 'Boolean', trueText: "錯誤", falseText: "正常"},
			{name: 'Log', field: 'log', title: "紀錄", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "+",
	morePrompt: "顯示更多工具列命令",
	lessLabel: "-",
	lessPrompt: "隱藏部份工具列命令",
	separator: "|"
	});
	
merge(config.macros.refreshDisplay,{
	label: "刷新",
	prompt: "刷新此 TiddlyWiki 顯示"
	});
	
merge(config.macros.importTiddlers,{
	readOnlyWarning: "TiddlyWiki 於唯讀模式下，不支援導入文章。請由本機（file://）開啟 TiddlyWiki 文件",
	wizardTitle: "自其他檔案或伺服器導入文章",
	step1Title: "步驟一：指定伺服器或來源文件",
	step1Html: "指定伺服器類型：<select name='selTypes'><option value=''>選取...</option></select><br>請輸入網址或路徑：<input type='text' size=50 name='txtPath'><br>...或選擇來源文件：<input type='file' size=50 name='txtBrowse'><br><hr>...或選擇指定的饋入來源：<select name='selFeeds'><option value=''>選取...</option></select>",
	openLabel: "開啟",
	openPrompt: "開啟檔案或",
	statusOpenHost: "正與伺服器建立連線",
	statusGetWorkspaceList: "正在取得可用之文章清單",
	errorGettingTiddlerList: "取得文章清單時發生錯誤，請點選「取消」後重試。",
	step2Title: "步驟二：選擇工作區",
	step2Html: "輸入工作區名稱：<input type='text' size=50 name='txtWorkspace'><br>...或選擇工作區：<select name='selWorkspace'><option value=''>選取...</option></select>",
	cancelLabel: "取消",
	cancelPrompt: "取消本次導入動作",
	statusOpenWorkspace: "正在開啟工作區",
	statusGetTiddlerList: "正在取得可用之文章清單",
	step3Title: "步驟三：選擇欲導入之文章",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>保持這些文章與伺服器的連結，便於同步後續的變更。</input><br><input type='checkbox' name='chkSave'>儲存此伺服器的詳細資訊於標籤為 'systemServer' 的文章名為：</input> <input type='text' size=25 name='txtSaveTiddler'>", 
	importLabel: "導入",
	importPrompt: "導入所選文章",
	confirmOverwriteText: "確定要覆寫這些文章：\n\n%0",
	step4Title: "步驟四：正在導入%0 篇文章",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "完成",
	donePrompt: "關閉",
	statusDoingImport: "正在導入文章 ...",
	statusDoneImport: "所選文章已導入",
	systemServerNamePattern: "%2 位於 %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "此 tiddler '%0' 已經存在。點擊「確定」以伺服器上料覆寫之，或「取消」不變更後離開",
	serverSaveTemplate: "|''Type:''|%0|\n|''網址：''|%1|\n|''工作區：''|%2|\n\n此文為自動產生紀錄伺服器之相關資訊。",
	serverSaveModifier: "（系統）",

	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "文章", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "大小", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "標籤", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "更新 TiddlyWiki 核心程式",
	step1Title: "更新或修補此 TiddlyWiki 至最新版本",
	step1Html: "您將更新至最新版本的 TiddlyWiki 核心程式 (自 <a href='%0' class='externalLink' target='_blank'>%1</a>)。 在更新過程中，您的資料將被保留。<br><br>請注意：更新核心可能不相容於其他套件。若對更新的檔案有問題，詳見 <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "j無法更新此 TiddlyWiki. 您只能自本機端的 TiddlyWiki 檔案執行更新程序",
	errorNotSaved: "執行更新之前，請先儲存變更",
	step2Title: "確認更新步驟",
	step2Html_downgrade: "您的 TiddlyWiki 將自 %1 版降級至 %0版。<br><br>不建議降級至較舊的版本。",
	step2Html_restore: "此 TiddlyWiki 核心已是最新版 (%0)。<br><br>您可以繼續更新作業以確認核心程式未曾毀損。",
	step2Html_upgrade: "您的 TiddlyWiki 将自 %1 版更新至 %0 版",
	upgradeLabel: "更新",
	upgradePrompt: "準備更新作業",
	statusPreparingBackup: "準備備份中",
	statusSavingBackup: "備份檔案",
	errorSavingBackup: "備份檔案時發生問題",
	statusLoadingCore: "核心程式載入中",
	errorLoadingCore: "載入核心程式時，發生錯誤",
	errorCoreFormat: "新版核心程式發生錯誤",
	statusSavingCore: "正在儲存新版核心程式",
	statusReloadingCore: "新版核心程式載入中",
	startLabel: "開始",
	startPrompt: "開始更新作業",
	cancelLabel: "取消",
	cancelPrompt: "取消更新作業",
	step3Title: "已取消更新作業",
	step3Html: "您已取消更新作業"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "文章", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "伺服器類型", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "伺服器主機", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "伺服器工作區", type: 'String'},
			{name: 'Status', field: 'status', title: "同步情形", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "伺服器網址", text: "檢視", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "同步更新這些文章", name: 'sync'}
			]},
	wizardTitle: "將你的資料內容與外部伺服器與檔案同步",
	step1Title: "選擇欲同步的文章",
	step1Html: '<input type="hidden" name="markList"></input>', // DO NOT TRANSLATE
	syncLabel: "同步",
	syncPrompt: "同步更新這些文章",
	hasChanged: "已更動",
	hasNotChanged: "未更動",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "伺服器資料已更動", display:null, className:'changedServer'},
		changedLocally: {text: "本機資料已更動", display:null, className:'changedLocally'},
		changedBoth: {text: "已同時更新本機與伺服器上的資料", display:null, className:'changedBoth'},
		notFound: {text: "伺服器無此資料", display:null, className:'notFound'},
		putToServer: {text: "已儲存更新資料至伺服器", display:null, className:'putToServer'},
		gotFromServer: {text: "已從伺服器擷取更新資料", display:null, className:'gotFromServer'}
		}
	});

merge(config.macros.annotations,{
	});

merge(config.commands.closeTiddler,{
	text: "關閉",
	tooltip: "關閉本文"});

merge(config.commands.closeOthers,{
	text: "關閉其他",
	tooltip: "關閉其他文章"});

merge(config.commands.editTiddler,{
	text: "編輯",
	tooltip: "編輯本文",
	readOnlyText: "檢視",
	readOnlyTooltip: "檢視本文之原始內容"});

merge(config.commands.saveTiddler,{
	text: "完成",
	tooltip: "確定修改"});

merge(config.commands.cancelTiddler,{
	text: "取消",
	tooltip: "取消修改",
	warning: "確定取消對 '%0' 的修改嗎?",
	readOnlyText: "完成",
	readOnlyTooltip: "返回正常顯示模式"});

merge(config.commands.deleteTiddler,{
	text: "刪除",
	tooltip: "刪除文章",
	warning: "確定刪除 '%0'?"});

merge(config.commands.permalink,{
	text: "引用連結",
	tooltip: "本文引用連結"});

merge(config.commands.references,{
	text: "引用",
	tooltip: "引用本文的文章",
	popupNone: "本文未被引用"});

merge(config.commands.jump,{
	text: "捲頁",
	tooltip: "捲頁至其他已開啟的文章"});

merge(config.commands.syncing,{
	text: "同步",
	tooltip: "本文章與伺服器或其他外部檔案的同步資訊",
	currentlySyncing: "<div>同步類型：<span class='popupHighlight'>'%0'</span></"+"div><div>與伺服器：<span class='popupHighlight'>%1 同步</span></"+"div><div>工作區：<span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "無進行中的同步動作",
	captionUnSync: "停止同步此文章",
	chooseServer: "與其他伺服器同步此文章:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "欄位",
	tooltip: "顯示此文章的擴充資訊",
	emptyText: "此文章沒有擴充欄位",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "擴充欄位", type: 'String'},
			{name: 'Value', field: 'value', title: "內容", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[GettingStarted]]",
	GettingStarted: "使用此 TiddlyWiki 的空白範本之前，請先修改以下預設文章：\n* SiteTitle 及 SiteSubtitle：網站的標題和副標題，顯示於頁面上方<br />（在儲存變更後，將顯示於瀏覽器視窗的標題列）。\n* MainMenu：主選單（通常在頁面左側）。\n* DefaultTiddlers：內含一些文章的標題，可於載入TiddlyWiki 後的預設開啟。\n請輸入您的大名，作為所建立/ 編輯的文章署名：<<option txtUserName>>",
	MainMenu: "[[使用說明|GettingStarted]]\n\n\n版本：<<version>>",
	OptionsPanel: "這些設定將暫存於瀏覽器\n請簽名<<option txtUserName>>\n (範例：WikiWord)\n\n <<option chkSaveBackups>> 儲存備份\n <<option chkAutoSave>> 自動儲存\n <<option chkRegExpSearch>> 正規式搜尋\n <<option chkCaseSensitiveSearch>> 區分大小寫搜尋\n <<option chkAnimate>> 使用動畫顯示\n----\n [[進階選項|AdvancedOptions]]",
	SiteTitle: "我的 TiddlyWiki",
	SiteSubtitle: "一個可重複使用的個人網頁式筆記本",
	SiteUrl: '',
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal " YYYY年0MM月0DD日" "日誌">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "偏好設定 \u00bb" "變更 TiddlyWiki 選項">>',
	SideBarTabs: '<<tabs txtMainTab "最近更新" "依更新日期排序" TabTimeline "全部" "所有文章" TabAll "分類" "所有標籤" TabTags "更多" "其他" TabMore>>',
	StyleSheet: '[[StyleSheetLocale]]',
	TabMore: '<<tabs txtMoreTab "未完成" "內容空白的文章" TabMoreMissing "未引用" "未被引用的文章" TabMoreOrphans "預設文章" "已預設內容的隱藏文章" TabMoreShadowed>>'
});

merge(config.annotations,{
	AdvancedOptions: "此預設文章可以存取一些進階選項。",
	ColorPalette: "此預設文章裡的設定值，將決定 ~TiddlyWiki 使用者介面的配色。",
	DefaultTiddlers: "當 ~TiddlyWiki 在瀏覽器中開啟時，此預設文章裡列出的文章，將被自動顯示。",
	EditTemplate: "此預設文章裡的 HTML template 將決定文章進入編輯模式時的顯示版面。",
	GettingStarted: "此預設文章提供基本的使用說明。",
	ImportTiddlers: "此預設文章提供存取導入中的文章。",
	MainMenu: "此預設文章的內容，為於螢幕左側主選單的內容",
	MarkupPreHead: "此文章的內容將加至 TiddlyWiki 文件的 <head> 段落的起始",
	MarkupPostHead: "此文章的內容將加至 TiddlyWiki 文件的 <head> 段落的最後",
	MarkupPreBody: "此文章的內容將加至 TiddlyWiki 文件的 <body> 段落的起始",
	MarkupPostBody: "此文章的內容將加至 TiddlyWiki 文件的 <body> 段落的最後，於 script 區塊之後",
	OptionsPanel: "此預設文章的內容，為於螢幕右側副選單中的選項面板裡的內容",
	PageTemplate: "此預設文章裡的 HTML template 決定的 ~TiddlyWiki 主要的版面配置",
	PluginManager: "此預設文章提供存取套件管理員",
	SideBarOptions: "此預設文章的內容，為於螢幕右側副選單中選項面板裡的內容",
	SideBarTabs: "此預設文章的內容，為於螢幕右側副選單中的頁籤面板裡的內容",
	SiteSubtitle: "此預設文章的內容為頁面的副標題",
	SiteTitle: "此預設文章的內容為頁面的主標題",
	SiteUrl: "此預設文章的內容須設定為文件發佈時的完整網址",
	StyleSheetColors: "此預設文章內含的 CSS 規則，為相關的頁面元素的配色。''勿修改此文''，請於 StyleSheet 中作增修",
	StyleSheet: "此預設文章內容可包含 CSS 規則",
	StyleSheetLayout: "此預設文章內含的 CSS 規則，為相關的頁面元素的版面配置。''勿修改此文''，請於 StyleSheet 中作增修",
	StyleSheetLocale: "此預設文章內含的 CSS 規則，可依翻譯語系做適當調整",
	StyleSheetPrint: "此預設文章內含的 CSS 規則，用於列印時的樣式",
	TabAll: "此預設文章的內容，為於螢幕右側副選單中的「全部」頁籤的內容",
	TabMore: "此預設文章的內容，為於螢幕右側副選單中的「更多」頁籤的內容",
	TabMoreMissing: "此預設文章的內容，為於螢幕右側副選單中的「未完成」頁籤的內容",
	TabMoreOrphans: "此預設文章的內容，為於螢幕右側副選單中的「未引用」頁籤的內容",
	TabMoreShadowed: "此預設文章的內容，為於螢幕右側副選單中的「預設文章」頁籤的內容",
	TabTags: "此預設文章的內容，為於螢幕右側副選單中的「分類」頁籤的內容",
	TabTimeline: "此預設文章的內容，為於螢幕右側副選單中的「最近更新」頁籤的內容",
	ToolbarCommands: "此預設文章的內容，為顯示於文章工具列之命令",
	ViewTemplate: "此預設文章裡的 HTML template 決定文章顯示的樣子"
	});
//}}}
