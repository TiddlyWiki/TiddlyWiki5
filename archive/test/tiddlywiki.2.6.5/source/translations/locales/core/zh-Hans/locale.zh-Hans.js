/***
|''Name:''|zh-HansTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Simply Chinese|
|''Source:''|http://tiddlywiki-zh.googlecode.com/svn/trunk/|
|''Subversion:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/zh-Hans/locale.zh-Hans.js|
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

config.locale = 'zh-Hans'; // W3C language tag
config.options.txtFileSystemCharSet = 'GBK';

if (config.options.txtUserName == 'YourName' || !config.options.txtUserName) // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "YourName"});

merge(config.tasks,{
	save: {text: "保存", tooltip: "保存变更至此 TiddlyWiki", action: saveChanges},
	sync: {text: "同步", tooltip: "将你的资料内容与外部服务器与文件同步", content: '<<sync>>'},
	importTask: {text: "导入", tooltip: "自其他文件或服务器导入文章或插件", content: '<<importTiddlers>>'},
	tweak: {text: "选项", tooltip: "改变此 TiddlyWiki 显示与行为设置", content: '<<options>>'},
	upgrade: {text: "更新", tooltip: "更新 TiddlyWiki 核心程序", content: '<<upgrade>>'},
	plugins: {text: "插件管理", tooltip: "管理已安装的插件", content: '<<plugins>>'}
});

merge(config.optionsDesc,{
	txtUserName: "编辑文章所使用之作者署名",
	chkRegExpSearch: "启用正则式查找",
	chkCaseSensitiveSearch: "查找时，区分大小写",
	chkIncrementalSearch: "随打即找搜索",
	chkAnimate: "使用动画显示",
	chkSaveBackups: "保存变更前，保留备份文件",
	chkAutoSave: "自动保存变更",
	chkGenerateAnRssFeed: "保存变更时，也保存 RSS feed",
	chkSaveEmptyTemplate: "保存变更时，也保存空白模版",
	chkOpenInNewWindow: "于新窗口开启链接",
	chkToggleLinks: "点击已开启文章炼结时，将其关闭",
	chkHttpReadOnly: "非本机浏览文件时，隐藏编辑功能",
	chkForceMinorUpdate: "修改文章时，不变更作者名称与日期时间",
	chkConfirmDelete: "删除文章前须确认",
	chkInsertTabs: "使用 tab 键插入定位字符，而非跳至下一个栏位",
	txtBackupFolder: "存放备份文件的资料夹",
	txtMaxEditRows: "编辑模式中显示列数",
	txtTheme: "使用的布景名称",
	txtFileSystemCharSet: "指定保存文件所在之档案系统之字符集 (仅适用于 Firefox/Mozilla only)"});

// Messages
merge(config.messages,{
	customConfigError: "插件载入发生错误，详细请参考 PluginManager",
	pluginError: "发生错误: %0",
	pluginDisabled: "未执行，因标签设为 'systemConfigDisable'",
	pluginForced: "已执行，因标签设为 'systemConfigForce'",
	pluginVersionError: "未执行，插件需较新版本的 TiddlyWiki",
	nothingSelected: "尚未作任何选择，至少需选择一项",
	savedSnapshotError: "此 TiddlyWiki 未正确保存，详见 http://www.tiddlywiki.com/#Download",
	subtitleUnknown: "(未知)",
	undefinedTiddlerToolTip: "'%0' 尚无内容",
	shadowedTiddlerToolTip: "'%0' 尚无内容, 但已定义隐藏的默认值",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "外部链接至 %0",
	noTags: "未设置标签的文章",
	notFileUrlError: "须先将此 TiddlyWiki 存至本机文件，才可保存变更",
	cantSaveError: "无法保存变更。可能的原因有：\n- 你的浏览器不支持此保存功能（Firefox, Internet Explorer, Safari and Opera 经适当设定后可保存变更）\n- 也可能是你的 TiddlyWiki 文件名称包含不合法的字符所致。\n- 或是 TiddlyWiki 文件被改名或搬移。",
	invalidFileError: " '%0' 非有效之 TiddlyWiki 文件",
	backupSaved: "已保存备份",
	backupFailed: "无法保存备份",
	rssSaved: "RSS feed 已保存",
	rssFailed: "无法保存 RSS feed ",
	emptySaved: "已保存模版",
	emptyFailed: "无法保存模版",
	mainSaved: "主要的TiddlyWiki已保存",
	mainFailed: "无法保存主要 TiddlyWiki，所作的改变未保存",
	macroError: "宏 <<\%0>> 执行错误",
	macroErrorDetails: "执行宏 <<\%0>> 时，发生错误 :\n%1",
	missingMacro: "无此宏",
	overwriteWarning: "'%0' 已存在，[确定]覆盖之",
	unsavedChangesWarning: "注意！ 尚未保存变更\n\n[确定]保存，或[取消]放弃保存？",
	confirmExit: "--------------------------------\n\nTiddlyWiki 以更改内容尚未保存，继续的话将丢失这些更动\n\n--------------------------------",
	saveInstructions: "SaveChanges",
	unsupportedTWFormat: "未支持此 TiddlyWiki 格式：'%0'",
	tiddlerSaveError: "保存文章 '%0' 时，发生错误。",
	tiddlerLoadError: "载入文章 '%0' 时，发生错误。",
	wrongSaveFormat: "无法使用格式 '%0' 保存，请使用标准格式存放",
	invalidFieldName: "无效的栏位名称：%0",
	fieldCannotBeChanged: "无法变更栏位：'%0'",
	loadingMissingTiddler: "正从服务器 '%1' 的：\n\n工作区 '%3' 中的 '%2' 撷取文章 '%0'",
	upgradeDone: "已更新至 %0 版\n\n点击 '确定' 重新载入更新后的 TiddlyWiki",
	invalidCookie: "无效的 cookie '%0'"});

merge(config.messages.messageClose,{
	text: "关闭",
	tooltip: "关闭此讯息"});

config.messages.backstage = {
	open: {text: "控制台", tooltip: "开启控制台执行编写工作"},
	close: {text: "关闭", tooltip: "关闭控制台"},
	prompt: "控制台：",
	decal: {
		edit: {text: "编辑", tooltip: "编辑 '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "查看全文",
	previewUnavailable: "(无法预览)"
};

config.messages.dates.months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
config.messages.dates.days = ["周日", "周一","周二", "周三", "周四", "周五", "周六"];
config.messages.dates.shortMonths = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
config.messages.dates.shortDays = ["日", "一","二", "三", "四", "五", "六"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"];
config.messages.dates.am = "上午";
config.messages.dates.pm = "下午";

merge(config.messages.tiddlerPopup,{ 
	});

merge(config.views.wikified.tag,{
	labelNoTags: "未设标签",
	labelTags: "标签: ",
	openTag: "开启标签 '%0'",
	tooltip: "显示标签为 '%0' 的文章",
	openAllText: "开启以下所有文章",
	openAllTooltip: "开启以下所有文章",
	popupNone: "仅此文标签为 '%0'"});

merge(config.views.wikified,{
	defaultText: "",
	defaultModifier: "(未完成)",
	shadowModifier: "(默认)",
	dateFormat: "YYYY年0MM月0DD日",
	createdPrompt: "创建于"});

merge(config.views.editor,{
	tagPrompt: "设置标签之间以空白隔开，[[标签含空白时请使用双中括弧]]，或点选现有之标签加入",
	defaultText: ""});

merge(config.views.editor.tagChooser,{
	text: "标签",
	tooltip: "点选现有之标签加至本文章",
	popupNone: "未设置标签",
	tagTooltip: "加入标签 '%0'"});

	merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: " 查找",
	prompt: "搜索本 Wiki",
	accessKey: "F",
	successMsg: " %0 篇符合条件: %1",
	failureMsg: " 无符合条件: %0"});

merge(config.macros.tagging,{
	label: "引用标签:",
	labelNotTag: "无引用标签",
	tooltip: "列出标签为 '%0' 的文章"});

merge(config.macros.timeline,{
	dateFormat: "YYYY年0MM月0DD日"});

merge(config.macros.allTags,{
	tooltip: "显示文章- 标签为'%0'",
	noTags: "没有标签"});

config.macros.list.all.prompt = "依字母排序";
config.macros.list.missing.prompt = "被引用且内容空白的文章";
config.macros.list.orphans.prompt = "未被引用的文章";
config.macros.list.shadowed.prompt = "这些隐藏的文章已定义默认内容";
config.macros.list.touched.prompt = "自下载或添加后被修改过的文章"; 

merge(config.macros.closeAll,{
	label: "全部关闭",
	prompt: "关闭所有开启中的 tiddler (编辑中除外)"});

merge(config.macros.permaview,{
	label: "永久链接",
	prompt: "可存取现有开启之文章的链接位址"});

merge(config.macros.saveChanges,{
	label: "保存变更",
	prompt: "保存所有文章，生成新的版本",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "创建文章",
	prompt: "创建 tiddler",
	title: "创建文章",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "创建日志",
	prompt: "创建 jounal",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "增订的高级选项",
	step1Title: "增订的选项保存于浏览器的 cookies",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>显示未知选项</input>",
	unknownDescription: "//(未知)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "选项", type: 'String'},
			{name: 'Description', field: 'description', title: "说明", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "名称", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "插件管理",
	step1Title: "- 已载入之插件",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(此插件因刚加入，故尚未执行)",
	noPluginText: "未安装插件",
	confirmDeleteText: "确认是否删除所选插件:\n\n%0",
	removeLabel: "删除 'systemConfig' 标签",
	removePrompt: "删除 'systemConfig' 标签",
	deleteLabel: "删除",
	deletePrompt: "永远删除所选插件",
	listViewTemplate : {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "插件", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "说明", type: 'String'},
			{name: 'Version', field: 'Version', title: "版本", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "大小", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "强制执行", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "停用", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "已载入", type: 'Boolean', trueText: "是", falseText: "否"},
			{name: 'Startup Time', field: 'startupTime', title: "载入时间", type: 'String'},
			{name: 'Error', field: 'error', title: "载入状态", type: 'Boolean', trueText: "错误", falseText: "正常"},
			{name: 'Log', field: 'log', title: "记录", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "+",
	morePrompt: "显示更多工具命令",
	lessLabel: "-",
	lessPrompt: "隐藏部份工具命令",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "刷新",
	prompt: "刷新此 TiddlyWiki 显示"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "TiddlyWiki 于唯读模式下，不支持导入文章。请由本机（file://）开启 TiddlyWiki 文件",
	wizardTitle: "自其他档案或服务器汇入文章",
	step1Title: "步骤一：指定服务器或来源文件",
	step1Html: "指定服务器类型：<select name='selTypes'><option value=''>选取...</option></select><br>请输入网址或路径：<input type='text' size=50 name='txtPath'><br>...或选择来源文件：<input type='file' size=50 name='txtBrowse'><br><hr>...或选择指定的馈入来源：<select name='selFeeds'><option value=''>选取...</option></select>",
	openLabel: "开启",
	openPrompt: "开启文件或",
	statusOpenHost: "正与服务器建立连线",
	statusGetWorkspaceList: "正在取得可用之文章清单",
	errorGettingTiddlerList: "取得文章清单时发生错误，请点选“取消”后重试。",
	step2Title: "步骤二：选择工作区",
	step2Html: "输入工作区名称：<input type='text' size=50 name='txtWorkspace'><br>...或选择工作区：<select name='selWorkspace'><option value=''>选取...</option></select>",
	cancelLabel: "取消",
	cancelPrompt: "取消本次导入动作",
	statusOpenWorkspace: "正在开启工作区",
	statusGetTiddlerList: "正在取得可用之文章清单",
	step3Title: "步骤三：选择欲导入之文章",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>保持这些文章与服务器链接，便于同步后续的变更。</input><br><input type='checkbox' name='chkSave'>保存此服务器的详细资讯于标签为 'systemServer' 的文章名为：</input> <input type='text' size=25 name='txtSaveTiddler'>", 
	importLabel: "导入",
	importPrompt: "导入所选文章",
	confirmOverwriteText: "确定要覆写这些文章：\n\n%0",
	step4Title: "步骤四：正在导入%0 篇文章",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "完成",
	donePrompt: "关闭",
	statusDoingImport: "正在导入文章 ...",
	statusDoneImport: "所选文章已导入",
	systemServerNamePattern: "%2 位于 %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "此 tiddler '%0' 已经存在。点击“确定”以服务器上料覆写之，或“取消”不变更后离开",
	serverSaveTemplate: "|''Type:''|%0|\n|''网址：''|%1|\n|''工作区：''|%2|\n\n此文为自动产生纪录服务器之相关资讯。",
	serverSaveModifier: "（系统）",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "文章", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "大小", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "标签", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "更新 TiddlyWiki 核心程序",
	step1Title: "更新或修补此 TiddlyWiki 至最新版本",
	step1Html: "您将更新至最新版本的 TiddlyWiki 核心程序 (自 <a href='%0' class='externalLink' target='_blank'>%1</a>)。 在更新过程中，您的资料将被保留。<br><br>请注意：更新核心可能不相容于其他插件。若对更新的档案有问题，详见 <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>",
	errorCantUpgrade: "j无法更新此 TiddlyWiki. 您只能自本机端的 TiddlyWiki 文件执行更新程序",
	errorNotSaved: "执行更新之前，请先保存变更",
	step2Title: "确认更新步骤",
	step2Html_downgrade: "您的 TiddlyWiki 将自 %1 版降级至 %0版<br><br>不建议降级至较旧的版本。",
	step2Html_restore: "此 TiddlyWiki 核心已是最新版 (%0)。<br><br>您可以继续更新作业以确认核心程式未曾毁损。",
	step2Html_upgrade: "您的 TiddlyWiki 将自 %1 版更新至 %0 版",	upgradeLabel: "更新",
	upgradePrompt: "准备更新作业",
	statusPreparingBackup: "准备备份中",
	statusSavingBackup: "正在备份文件",
	errorSavingBackup: "备份文件时发生问题",
	statusLoadingCore: "核心程序载入中",
	errorLoadingCore: "载入核心程序时，发生错误",
	errorCoreFormat: "新版核心程序发生错误",
	statusSavingCore: "正在保存新版核心程序",
	statusReloadingCore: "新版核心程式载入中",
	startLabel: "开始",
	startPrompt: "开始更新作业",
	cancelLabel: "取消",
	cancelPrompt: "取消更新作业",
	step3Title: "已取消更新作业",
	step3Html: "您已取消更新作业"
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "文章", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "服务器类型", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "服务器主机", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "服务器工作区", type: 'String'},
			{name: 'Status', field: 'status', title: "同步情形", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "服务器网址", text: "检视", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "同步更新这些文章", name: 'sync'}
			]},
	wizardTitle: "将你的资料内容与外部服务器与文件同步",
	step1Title: "选择欲同步的文章",
	step1Html: '<input type="hidden" name="markList"></input>',
	syncLabel: "同步",
	syncPrompt: "同步更新这些文章",
	hasChanged: "已更动",
	hasNotChanged: "未更动",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "服务器资料已更动", display:null, className:'changedServer'},
		changedLocally: {text: "本机资料已更动", display:null, className:'changedLocally'},
		changedBoth: {text: "已同时更新本机与服务器上的资料", display:null, className:'changedBoth'},
		notFound: {text: "服务器无此资料", className:'notFound'},
		putToServer: {text: "已储存更新资料至服务器", display:null, className:'putToServer'},
		gotFromServer: {text: "已从服务器撷取更新资料", display:null, className:'gotFromServer'}
		}
	});

merge(config.macros.annotations,{
	});

merge(config.commands.closeTiddler,{
	text: "关闭",
	tooltip: "关闭本文"});

merge(config.commands.closeOthers,{
	text: "关闭其他",
	tooltip: "关闭其他文章"});

merge(config.commands.editTiddler,{
	text: "编辑",
	tooltip: "编辑本文",
	readOnlyText: "查阅",
	readOnlyTooltip: "查阅本文之原始内容"});

merge(config.commands.saveTiddler,{
	text: "完成",
	tooltip: "确定修改"});

merge(config.commands.cancelTiddler,{
	text: "取消",
	tooltip: "取消修改",
	warning: "确定取消对 '%0' 的修改吗?",
	readOnlyText: "完成",
	readOnlyTooltip: "返回正常显示模式"});

merge(config.commands.deleteTiddler,{
	text: "删除",
	tooltip: "删除文章",
	warning: "确定删除 '%0'?"});

merge(config.commands.permalink,{
	text: "永久链接",
	tooltip: "本文永久链接"});

merge(config.commands.references,{
	text: "引用",
	tooltip: "引用本文的文章",
	popupNone: "本文未被引用"});

merge(config.commands.jump,{
	text: "跳转",
	tooltip: "跳转至其他已开启的文章"});

merge(config.commands.syncing,{
	text: "同步",
	tooltip: "本文章与服务器或其他外部文件的同步资讯",
	currentlySyncing: "<div>同步类型：<span class='popupHighlight'>'%0'</span></"+"div><div>与服务器：<span class='popupHighlight'>%1 同步</span></"+"div><div>工作区：<span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "无进行中的同步动作",
	captionUnSync: "停止同步此文章",
	chooseServer: "与其他服务器同步此文章:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "栏位",
	tooltip: "显示此文章的扩充资讯",
	emptyText: "此文章没有扩充栏位",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "扩充栏位", type: 'String'},
			{name: 'Value', field: 'value', title: "内容", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "GettingStarted",
	GettingStarted: "使用此 TiddlyWiki 的空白模版之前，请先修改以下默认文章：\n* SiteTitle 及 SiteSubtitle：网站的标题和副标题，显示于页面上方<br />（在保存变更后，将显示于浏览器视窗的标题列）。\n* MainMenu：主菜单（通常在页面左侧）。\n* DefaultTiddlers：包含一些文章的标题，可于进入TiddlyWiki 后开启。\n请输入您的大名，作为所创建/ 编辑文章的署名：<<option txtUserName>>",
	MainMenu: "[[使用说明|GettingStarted]]\n\n\n版本：<<version>>",
	OptionsPanel: "这些设置将缓存于浏览器\n请签名<<option txtUserName>>\n(范例：WikiWord)\n\n<<option chkSaveBackups>> 保存备份\n<<option chkAutoSave>> 自动保存\n<<option chkRegExpSearch>> 正则式搜索\n<<option chkCaseSensitiveSearch>> 区分大小写搜索\n<<option chkAnimate>> 使用动画显示\n----\n[[进阶选项|AdvancedOptions]]",
	SiteTitle: "我的 TiddlyWiki",
	SiteSubtitle: "一个可重复使用的个人网页式笔记本",
	SiteUrl: '',
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal " YYYY年0MM月0DD日" "日志">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "偏好设置 \u00bb" "变更 TiddlyWiki 选项">>',
	SideBarTabs: '<<tabs txtMainTab "最近更新" "依更新日期排序" TabTimeline "全部" "所有文章" TabAll "分类" "所有标签" TabTags "更多" "其他" TabMore>>',
	StyleSheet: '[[StyleSheetLocale]]',
	TabMore: '<<tabs txtMoreTab "未完成" "内容空白的文章" TabMoreMissing "未引用" "未被引用的文章" TabMoreOrphans "默认文章" "默认的影子文章" TabMoreShadowed>>'
});

merge(config.annotations,{
	AdvancedOptions: "此默认文章可以存取一些进阶选项。",
	ColorPalette: "此默认文章里的设定值，将决定 ~TiddlyWiki 使用者介面的配色。",
	DefaultTiddlers: "当 ~TiddlyWiki 在浏览器中开启时，此默认文章里列出的文章，将被自动显示。",
	EditTemplate: "此默认文章里的 HTML template 将决定文章进入编辑模式时的显示版面。",
	GettingStarted: "此默认文章提供基本的使用说明。",
	ImportTiddlers: "此默认文章提供存取导入中的文章。",
	MainMenu: "此默认文章的内容，为于屏幕左侧主菜单的内容",
	MarkupPreHead: "此文章的内容将加至 TiddlyWiki 文件的 <head> 段落的起始",
	MarkupPostHead: "此文章的内容将加至 TiddlyWiki 文件的 <head> 段落的最后",
	MarkupPreBody: "此文章的内容将加至 TiddlyWiki 文件的 <body> 段落的起始",
	MarkupPostBody: "此文章的内容将加至 TiddlyWiki 文件的 <body> 段落的最后，于 script 区块之后",
	OptionsPanel: "此默认文章的内容，为于屏幕右侧副菜单中的选项面板里的内容",
	PageTemplate: "此默认文章里的 HTML template 决定的 ~TiddlyWiki 主要的版面配置",
	PluginManager: "此默认文章提供存取插件管理员",
	SideBarOptions: "此默认文章的内容，为于屏幕右侧副菜单中选项面板里的内容",
	SideBarTabs: "此默认文章的内容，为于屏幕右侧副菜单中的页签面板里的内容",
	SiteSubtitle: "此默认文章的内容为页面的副标题",
	SiteTitle: "此默认文章的内容为页面的主标题",
	SiteUrl: "此默认文章的内容须设定为文件发布时的完整网址",
	StyleSheetColors: "此默认文章内含的 CSS 规则，为相关的页面元素的配色。''勿修改此文''，请于 StyleSheet 中作增修",
	StyleSheet: "此默认文章内容可包含 CSS 规则",
	StyleSheetLayout: "此默认文章内含的 CSS 规则，为相关的页面元素的版面配置。''勿修改此文''，请于 StyleSheet 中作增修",
	StyleSheetLocale: "此默认文章内含的 CSS 规则，可依翻译语系做适当调整",
	StyleSheetPrint: "此默认文章内含的 CSS 规则，用于列印时的样式",
	TabAll: "此默认文章的内容，为于屏幕右侧的“全部”页签的内容",
	TabMore: "此默认文章的内容，为于屏幕右侧的“更多”页签的内容",
	TabMoreMissing: "此默认文章的内容，为于屏幕右侧的“未完成”页签的内容",
	TabMoreOrphans: "此默认文章的内容，为于屏幕右侧的“未引用”页签的内容",
	TabMoreShadowed: "此默认文章的内容，为于屏幕右侧的“默认文章”页签的内容",
	TabTags: "此默认文章的内容，为于屏幕右侧的“分类”页签的内容",
	TabTimeline: "此默认文章的内容，为于屏幕右侧的“最近更新”页签的内容",
	ToolbarCommands: "此默认文章的内容，为显示于文章工具列之命令",
	ViewTemplate: "此默认文章里的 HTML template 决定文章显示的样子"
	});
//}}}
