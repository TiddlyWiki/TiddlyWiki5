/***
|''Name:''|KoreanTranslationPlugin|
|''Description:''|Translation of TiddlyWiki into Korean|
|''Author:''|Snooey(Seongsu Yoon) (tiddlywiki (at) snooey (dot) net)|
|''Source:''|http://snooey.net/tiddlywiki/locale.ko.js |
|'' ''|http://snooey.net/tiddlywiki/#KoreanTranslationPlugin |
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/ko/locale.ko.js |
|''Version:''|0.6.0|
|''Date:''|Sep 13, 2010|
|''Comments:''|If you have suggestion about this translation, please make comments at http://blog.snooey.net/guestbook/ or mail to me |
|'' ''|another suggestion, please make comments at http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.6.1|
***/

/***
|''이름:''|KoreanTranslationPlugin|
|''설명:''|TiddlyWiki를 한국어로 번역|
|''제작자:''|Snooey(Seongsu Yoon) (tiddlywiki (at) snooey (dot) net)|
|''소스:''|http://snooey.net/tiddlywiki/locale.ko.js |
|'' ''|http://snooey.net/tiddlywiki/#KoreanTranslationPlugin |
|''코드 저장소:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/ko/locale.ko.js |
|''버전:''|0.6.0|
|''날짜:''|2010년 9월 13일|
|''덧글:''|이 번역에 대한 제안이 있으신 경우, http://blog.snooey.net/guestbook/ 또는 제게 메일을 보내주십시요. |
|'' ''|다른 제안은 http://groups.google.co.uk/group/TiddlyWikiDev으로 보내주십시요. |
|''라이센스:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''코어 버전:''|2.6.1|
***/

//{{{
//--
//-- 번역 가능한 문장
//--

// "쌍 따옴표" 내에 둔 구문만 수정하시고, '온 따옴표' 내에 둔 구문은 수정하지 마십시요.

config.locale = "ko"; // W3C 언어 태그

if (config.options.txtUserName == 'YourName') // 이 줄은 번역하지 마시고, 다음 줄부터 번역하십시요.
	merge(config.options,{txtUserName: "익명"});

merge(config.tasks,{
	save: {text: "저장", tooltip: "이 TiddlyWiki에 바뀐점을 저장합니다", action: saveChanges},
	sync: {text: "동기화", tooltip: "로컬 또는 서버에 있는 다른 TiddlyWiki 파일과의 차이점을 동기화합니다", content: '<<sync>>'},
	importTask: {text: "가져오기", tooltip: "로컬 또는 서버에 있는 다른 TiddlyWiki 파일에서 티들러와 플러그인을 가져옵니다", content: '<<importTiddlers>>'},
	tweak: {text: "모양 조정", tooltip: "TiddlyWiki의 모양과 형식을 조정합니다", content: '<<options>>'},
	upgrade: {text: "업그레이드", tooltip: "TiddlyWiki의 코어 코드를 업그레이드합니다", content: '<<upgrade>>'},
	plugins: {text: "플러그인", tooltip: "설치된 플러그인을 관리합니다", content: '<<plugins>>'}
});

// Options은 옵션 패널과 쿠키에 설정될 수 있습니다.
merge(config.optionsDesc,{
	txtUserName: "편집한 티들러에 서명할 이름을 입력하세요.",
	chkRegExpSearch: "찾을 때 정규식을 사용할 수 있게 합니다.",
	chkCaseSensitiveSearch: "알파벳의 대소문자를 구분하여 찾습니다.",
	chkIncrementalSearch: "키 단위로 증가해가면서 찾습니다.",
	chkAnimate: "애니메이션 기능을 활성화합니다.",
	chkSaveBackups: "바뀐점을 저장할 때 백업을 만듭니다.",
	chkAutoSave: "자동으로 바뀐점을 저장합니다.",
	chkGenerateAnRssFeed: "바뀐점을 저장할 때 RSS 피드를 만듭니다.",
	chkSaveEmptyTemplate: "바뀐점을 저장할 때 빈 템플릿 파일을 만듭니다.",
	chkOpenInNewWindow: "외부 링크를 새 창으로 엽니다.",
	chkToggleLinks: "링크를 클릭하여 티들러를 열 때 같은 이름의 티들러가 있다면 닫히게 합니다.",
	chkHttpReadOnly: "HTTP로 볼 때 편집 기능을 숨깁니다.",
	chkForceMinorUpdate: "티들러를 편집할 때 수정한 날짜와 이름으로 업데이트하지 않습니다.",
	chkConfirmDelete: "티들러를 삭제하기 전에 확인합니다.",
	chkInsertTabs: "탭 키를 누르면 다른 입력 항목으로 넘어가지 않고 현재 커서 위치에 탭 문자를 넣습니다.",
	txtBackupFolder: "백업 파일을 저장할 때 쓸 폴더의 이름을 입력하세요.",
	txtMaxEditRows: "편집 상자의 최대 줄 수를 입력하세요.",
	txtFileSystemCharSet: "변경 사항 저장할 때 기본으로 사용할 문자셋(인코딩)을 입력하세요. (Firefox/Mozilla 전용)",
	txtTheme: "사용할 테마의 이릉을 입력하세요."});

merge(config.messages,{
	customConfigError: "플러그인을 읽어들이는 데에 문제가 발생하였습니다. PluginManager에서 자세한 사항을 확인하십시요.",
	pluginError: "오류: %0",
	pluginDisabled: "이 플러그인은 'systemConfigDisable' 태그가 있어 실행하지 않았습니다.",
	pluginForced: "이 플러그인은 'systemConfigForce' 태그가 있어 강제로 실행하였습니다.",
	pluginVersionError: "이 플러그인은 새 버전의 TiddlyWiki에서 작동하므로 실행하지 않았습니다.",
	nothingSelected: "선택한 것이 없습니다. 하나 이상을 먼저 선택하십시오.",
	savedSnapshotError: "이 TiddlyWiki는 잘못 저장된 것으로 보입니다. http://www.tiddlywiki.com/#Download에서 자세한 사항을 확인하십시오.",
	subtitleUnknown: "(알려지지 않음)",
	undefinedTiddlerToolTip: "'%0' 티들러가 아직 만들어지지 않았습니다.",
	shadowedTiddlerToolTip: "'%0' 티들러가 아직 만들어지지 않았지만, 숨김 티들러로 이미 정의되어 있습니다.",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "%0을(를) 여는 외부 링크",
	noTags: "태그가 달린 티들러가 없습니다.",
	notFileUrlError: "바뀐점을 저장하려면 먼저 이 TiddlyWiki를 저장해야 합니다.",
	cantSaveError: "바뀐점을 저장할 수 없습니다. 다음 이유가 원인일 수 있습니다.\n- 사용중인 브라우저가 저장 기능을 지원하지 않습니다. (Firefox 또는 Internet Explorer, Safari, Opera는 올바르게 설정하였다면 정상 동작합니다.)\n- 이 TiddlyWiki 파일이 위치한 경로가 잘못된 문자를 포함하고 있습니다.\n- 이 TiddlyWiki의 원본 HTML 파일의 이름이 바뀌었거나 지워졌습니다.",
	invalidFileError: "원본 파일 '%0' 이(가) 올바른 TiddlyWiki로 보이지 않습니다.",
	backupSaved: "백업이 저장되었습니다.",
	backupFailed: "백업 파일을 저장하지 못하였습니다.",
	rssSaved: "RSS 피드가 저장되었습니다.",
	rssFailed: "RSS 피드 파일을 저장하지 못하였습니다.",
	emptySaved: "빈 템플릿 파일이 저장되었습니다.",
	emptyFailed: "빈 템플릿 파일을 저장하지 못하였습니다.",
	mainSaved: "메인 TiddlyWiki 파일이 저장되었습니다.",
	mainFailed: "메인 TiddlyWiki 파일을 저장하지 못하였습니다. 변경 사항이 저장되지 않았습니다.",
	macroError: "<<\%0>> 매크로가 오류를 가지고 있습니다.",
	macroErrorDetails: "<<\%0>> 매크로를 실행하는 데에 다음 오류가 발생하였습니다.\n%1",
	missingMacro: "매크로가 존재하지 않습니다.",
	overwriteWarning: "'%0' 티들러가 이미 존재합니다. 덮어쓰려면 확인을 누르십시오.",
	unsavedChangesWarning: "주의! TiddlyWiki가 바뀐점을 저장하지 않았습니다.\n\n바뀐점을 저장하려면 확인을 누르십시요.\n바뀐점을 저장하지 않으려면 취소를 누르십시요.",
	confirmExit: "--------------------------------\n\nTiddlyWiki가 바뀐점을 저장하지 않았습니다. 계속하면 바뀐점을 잃어버리게 될니다.\n\n--------------------------------",
	saveInstructions: "바뀐점 저장",
	unsupportedTWFormat: "'%0'은(는) TiddlyWiki가 지원하지 않는 형식입니다.",
	tiddlerSaveError: "'%0' 티들러를 저장하는 중에 오류가 발생하였습니다.",
	tiddlerLoadError: "'%0' 티들러를 읽어들이는 중에 오류가 발생하였습니다.",
	wrongSaveFormat: "저장 형식 '%0'(으)로 저장할 수 없습니다. 저장하려면 표준 형식을 사용하십시요.",
	invalidFieldName: "%0은(는) 잘못된 입력 항목 이름입니다.",
	fieldCannotBeChanged: "'%0' 입력 항목이 변경되지 않았습니다.",
	loadingMissingTiddler: "'%0' 티들러를 '%1' 서버에서 가져오려 하고 있습니다.\n\n위치: 서버 '%2'의 작업공간 '%3'",
	upgradeDone: "%0 버전으로 업그레이드를 완료하였습니다.\n\n새 TiddlyWiki를 불러오려면 '확인' 을 누르십시요."});

merge(config.messages.messageClose,{
	text: "닫기",
	tooltip: "메세지 창을 닫습니다."});

config.messages.backstage = {
	open: {text: "고급도구", tooltip: "작업을 만들거나 수행, 조정할 수 있는 고급도구 공간을 엽니다."},
	close: {text: "닫기", tooltip: "고급도구 공간을 닫습니다."},
	prompt: "고급도구: ",
	decal: {
		edit: {text: "편집", tooltip: "'%0' 티들러를 편집합니다."}
	}
};

config.messages.listView = {
	tiddlerTooltip: "이 티들러의 본문 전체를 보려면 클릭하십시요.",
	previewUnavailable: "(미리 보기가 없습니다.)"
};

config.messages.dates.months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월","12월"];
config.messages.dates.days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
config.messages.dates.shortMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11","12"];
config.messages.dates.shortDays = ["일", "월", "화", "수", "목", "금", "토"];
//날짜 형식 설정입니다. 한국어에는 무의미하지요.
config.messages.dates.daySuffixes = ["일","일","일","일","일","일","일","일","일","일",
		"일","일","일","일","일","일","일","일","일","일",
		"일","일","일","일","일","일","일","일","일","일",
		"일"];
config.messages.dates.am = "오전";
config.messages.dates.pm = "오후";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "태그 없음",
	labelTags: "달린 태그: ",
	openTag: "'%0' 태그 열기",
	tooltip: "'%0' 태그가 달린 티들러 모두 열기",
	openAllText: "모두 열기",
	openAllTooltip: "이 티들러 모두 열기",
	popupNone: "'%0' 태그가 달린 다른 티들러가 없습니다."});

merge(config.views.wikified,{
	defaultText: "'%0' 티들러는 아직 없습니다. 만드려면 두번 클릭하세요.",
	defaultModifier: "(빠짐)",
	shadowModifier: "(내장 기능 숨김 티들러)",
	dateFormat: "YYYY년 MM월 DD일", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "만든 날짜:"});

merge(config.views.editor,{
	tagPrompt: "태그는 공백으로 구분하여 입력하며, 필요한 경우 [[대괄호를 두 번 사용]]하거나, 이미 있는 태그를 추가하십시오.",
	defaultText: "'%0'에 넣을 본문을 입력하십시오."});

merge(config.views.editor.tagChooser,{
	text: "태그",
	tooltip: "이 티들러에 이미 있는 태그를 추가할 수 있습니다.",
	popupNone: "아무 태그도 정의되지 않았습니다.",
	tagTooltip: "'%0' 태그를 추가합니다."});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024*1024, template: "%0\u00a0TB"},
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0바이트"}
		]});

merge(config.macros.search,{
	label: "찾기",
	prompt: "이 TiddlyWiki에서 찾기",
	accessKey: "F",
	successMsg: "%1을(를) 포함한 티들러를 %0개 찾았습니다.",
	failureMsg: "%0을(를) 포함한 티들러를 찾지 못하였습니다."});

merge(config.macros.tagging,{
	label: "'태그 달림: ",
	labelNotTag: "태그가 달리지 않음",
	tooltip: "'%0'태그가 달린 티들러의 목록"});

merge(config.macros.timeline,{
	dateFormat: "YYYY년 MM월 DD일"});// 왼쪽에 나온 대로 날짜 형식을 수정하시면 됩니다. Y와 M, D는 수정하시면 안됩니다.

merge(config.macros.allTags,{
	tooltip: "'%0' 태그가 달린 티들러를 보입니다.",
	noTags: "태그가 달린 티들러가 없습니다."});

config.macros.list.all.prompt = "모든 티들러를 알파벳순으로 정렬하여 보입니다.";
config.macros.list.missing.prompt = "링크는 되어 있으나 정의되지 않은 티들러를 보입니다.";
config.macros.list.orphans.prompt = "다른 티들러에 링크되지 않은 티들러를 보입니다.";
config.macros.list.shadowed.prompt = "기본값 본문을 가진 숨김 티들러를 보입니다.";
config.macros.list.touched.prompt = "개별 수정한 티들러를 보입니다.";

merge(config.macros.closeAll,{
	label: "모두 닫기",
	prompt: "열린 모든 티들러를 닫습니다(편집중인 티들러는 제외합니다)."});

merge(config.macros.permaview,{
	label: "절대주소",
	prompt: "현재 열린 티들러를 모두 볼 수 있는 URL 링크로 이동합니다."});

merge(config.macros.saveChanges,{
	label: "바뀐점 저장",
	prompt: "모든 티들러를 저장하여 새 TiddlyWiki를 만듭니다.",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "새 티들러",
	prompt: "새 티들러를 만듭니다.",
	title: "새 티들러",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "새 일정",
	prompt: "현재 날자와 시간으로 새 티들러를 만듭니다.",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "고급 옵션 조정",
	step1Title: "이 옵션은 사용중인 브라우저의 쿠키로 저장됩니다.",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>알림 없는 보이기</input>",
	unknownDescription: "//(알림 없음)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "옵션", type: 'String'},
			{name: 'Description', field: 'description', title: "설명", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "기능이름", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'}
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "플러그인 관리",
	step1Title: "현재 읽은 플러그인",
	step1Html: "<input type='hidden' name='markList'></input>", // 번역 금지
	skippedText: "(이 플러그인은 구동할 때부터 추가되어 있었으므로 실행되지 않았습니다.)",
	noPluginText: "설치한 플러그인이 없습니다.",
	confirmDeleteText: "다음 플러그인을 정말 삭제하시겠습니까?\n\n%0",
	removeLabel: "systemConfig 태그 제거",
	removePrompt: "systemConfig 태그를 제거합니다.",
	deleteLabel: "삭제",
	deletePrompt: "이 티들러를 완전히 삭제합니다.",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Description', field: 'desc', title: "설명", type: 'String'},
			{name: 'Tiddler', field: 'tiddler', title: "티들러", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "크기", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "강제 실행", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "비활성화", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "읽음", type: 'Boolean', trueText: "Yes", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "구동 소요시간", type: 'String'},
			{name: 'Error', field: 'error', title: "상태", type: 'Boolean', trueText: "오류", falseText: "정상"},
			{name: 'Log', field: 'log', title: "기록", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "더 보기",
	morePrompt: "추가 명령을 보입니다.",
	lessLabel: "가리기",
	lessPrompt: "추가 명령을 숨깁니다.",
	separator: "|"
	});

merge(config.macros.refreshDisplay,{
	label: "새로 고침",
	prompt: "이 TiddlyWiki의 전체 화면을 새로 그립니다."
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "읽기 전용 TiddlyWiki 파일에서 가져올 수 없습니다. file:// URL을 사용해서 열어보십시오.",
	wizardTitle: "다른 파일이나 서버에서 티들러 가져오기",
	step1Title: "1단계: TiddlyWiki 파일이 있는 위치를 지정합니다.",
	step1Html: "서버 종류 지정: <select name='selTypes'><option value=''>선택하기...</option></select><br>URL 또는 경로 이름: <input type='text' size=50 name='txtPath'><br>또는 파일 찾기 이용: <input type='file' size=50 name='txtBrowse'><br><hr>또는 미리 정의된 피드: <select name='selFeeds'><option value=''>선택하기...</option></select>",
	openLabel: "열기",
	openPrompt: "파일 또는 서버를 엽니다.",
	openError: "Tiddlywiki 파일을 불러오는 데에 문제가 발생하였습니다.",
	statusOpenHost: "호스트를 열고 있습니다.",
	statusGetWorkspaceList: "사용 가능한 작업공간 목록을 받아오고 있습니다.",
	step2Title: "2단계: 작업공간을 선택합니다.",
	step2Html: "작업공간 이름 입력: <input type='text' size=50 name='txtWorkspace'><br>.또는 작업공간 선택: <select name='selWorkspace'><option value=''>선택하기...</option></select>",
	cancelLabel: "취소",
	cancelPrompt: "가져오기를 취소합니다.",
	statusOpenWorkspace: "작업공간을 열고 있습니다.",
	statusGetTiddlerList: "사용 가능한 티들러의 목록을 받아오고 있습니다.",
	errorGettingTiddlerList: "티들러 목록을 받아오는 중에 오류가 발생하였습니다. 다시 시도하려면 취소를 클릭하세요.",
	step3Title: "3단계: 가져올 티들러를 선택합니다.",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>다음에 바뀐점이 있을 때 동기화하도록 이 서버에 링크 유지</input><br><input type='checkbox' name='chkSave'>이 서버의 자세한 정보를  'systemServer' 태그를 달아 이 티들러에 기록:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "가져오기",
	importPrompt: "이 티들러를 가져옵니다.",
	confirmOverwriteText: "다음 티들러를 덮어쓰시겠습니까?\n\n%0",
	step4Title: "4단계: %0개의 티들러를 가져오고 있습니다.",
	step4Html: "<input type='hidden' name='markReport'></input>", // 번역 금지
	doneLabel: "완료",
	donePrompt: "마법사를 닫습니다.",
	statusDoingImport: "티들러를 불러오고 있습니다.",
	statusDoneImport: "모든 티들러를 가져왔습니다.",
	systemServerNamePattern: "호스트 %1의 %2",
	systemServerNamePatternNoWorkspace: "호스트 %1",
	confirmOverwriteSaveTiddler: "'%0' 티들러가 이미 존재합니다. 이 서버에서 가져온 내용으로 덮어쓰려면 '확인'을, 내용을 유지하려면 '취소'를 선택하십시오.",
	serverSaveTemplate: "|''종류:''|%0|\n|''URL:''|%1|\n|''작업공간:''|%2|\n\n이 티들러는 해당 서버의 자세한 정보에 대한 기록을 내용으로 하여 자동으로 생성한 티들러입니다.",
	serverSaveModifier: "(시스템)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "티들러", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "크기", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "태그", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.upgrade,{
	wizardTitle: "TiddlyWiki 코어 코드 업그레이드",
	step1Title: "이 TiddlyWiki를 새 버전으로 업데이트하거나 고칩니다.",
	step1Html: "이 Tiddlywiki의 코어 코드를 새 버전으로 업그레이드하려고 합니다. (위치: <a href='%0' class='externalLink' target='_blank'>%1</a>). 업그레이드 중에 내용을 보존합니다.<br><br>코어를 업그레이드하면 기존 플러그인과 충돌을 일으킬 수 있습니다. 만약 업그레이드한 파일을 실행하는 데에 문제가 발생한다면, <a href='http://www.tiddlywiki.org/wiki/CoreUpgrades' class='externalLink' target='_blank'>http://www.tiddlywiki.org/wiki/CoreUpgrades</a>를 참조해 주십시오.",
	errorCantUpgrade: "이 TiddlyWiki는 로컬에 저장되어 있지 않기 때문에 업그레이드할 수 없습니다.",
	errorNotSaved: "업그레이드하기 전에 바뀐점을 저장해야 합니다.",
	step2Title: "업그레이드 정보 확인",
	step2Html_downgrade: "이 TiddlyWiki의 버전을 %1에서 %0으로 다운그레이드하려고 합니다.<br><br>코어 코드를 옛 버전으로 다운그레이드하는 것은 권장하지 않습니다.",
	step2Html_restore: "이 TiddlyWiki의 코어 코드는 이미 새 버전(%0)을 사용하고 있습니다.<br><br>언제든지 코어 코드를 망가뜨리지 않고 업그레이드 과정을 계속할 수 있습니다.",
	step2Html_upgrade: "이 TiddlyWiki의 버전을 %1에서 %0로 업그레이드하려고 합니다.",
	upgradeLabel: "업그레이드",
	upgradePrompt: "업그레이드 과정을 준비합니다.",
	statusPreparingBackup: "백업을 준비합니다.",
	statusSavingBackup: "백업 파일을 저장하고 있습니다.",
	errorSavingBackup: "백업 파일을 저장하는 중에 문제가 발생하였습니다.",
	statusLoadingCore: "코어 코드를 읽어들이고 있습니다.",
	errorLoadingCore: "코어 코드를 읽어들이는 중에 문제가 발생하였습니다.",
	errorCoreFormat: "새 코어 코드에 오류가 있습니다.",
	statusSavingCore: "새 코어 코드를 저장하고 있습니다.",
	statusReloadingCore: "새 코어 코드를 다시 읽어들이고 있습니다.",
	startLabel: "시작",
	startPrompt: "업그레이드 과정을 시작합니다.",
	cancelLabel: "취소",
	cancelPrompt: "업그레이드 과정을 취소합니다.",
	step3Title: "업그레이드가 취소되었습니다.",
	step3Html: "업그레이드 과정을 취소하였습니다."
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "티들러", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "서버 종류", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "서버 호스트", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "서버 작업공간", type: 'String'},
			{name: 'Status', field: 'status', title: "동기화 상태", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "서버 URL", text: "View", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "이 티들러 동기화", name: 'sync'}
			]},
	wizardTitle: "외부 서버 또는 파일과 동기화",
	step1Title: "동기화하려는 티들러를 선택하여 주십시요.",
	step1Html: "<input type='hidden' name='markList'></input>", // 번역 금지
	syncLabel: "동기화",
	syncPrompt: "이 티들러를 동기화합니다.",
	hasChanged: "바뀐 점이 있음",
	hasNotChanged: "바뀌지 않음",
	syncStatusList: {
		none: {text: "...", display:null, className:'notChanged'},
		changedServer: {text: "서버에서 바뀜", display:null, className:'changedServer'},
		changedLocally: {text: "로컬에서 바뀜", display:null, className:'changedLocally'},
		changedBoth: {text: "서버와 로컬에서 바뀜", display:null, className:'changedBoth'},
		notFound: {text: "서버에서 찾을 수 없음", display:null, className:'notFound'},
		putToServer: {text: "서버에 업데이트를 저장함", display:null, className:'putToServer'},
		gotFromServer: {text: "서버에서 업데이트를 가져옴", display:null, className:'gotFromServer'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "닫기",
	tooltip: "이 티들러를 닫습니다."});

merge(config.commands.closeOthers,{
	text: "다른 티들러 닫기",
	tooltip: "다른 티들러를 모두 닫습니다."});

merge(config.commands.editTiddler,{
	text: "편집",
	tooltip: "이 티들러들 편집합니다.",
	readOnlyText: "보기",
	readOnlyTooltip: "이 티들러의 원본을 봅니다."});

merge(config.commands.saveTiddler,{
	text: "완료",
	tooltip: "이 티들러의 바뀐점을 저장합니다."});

merge(config.commands.cancelTiddler,{
	text: "취소",
	tooltip: "이 티들러의 바뀐점을 되돌립니다.",
	warning: "'%0'의 바뀐점을 정말 버리시겠습니까?",
	readOnlyText: "완료",
	readOnlyTooltip: "이 티들러를 보통 모양로 봅니다."});

merge(config.commands.deleteTiddler,{
	text: "삭제",
	tooltip: "이 티들러를 삭제합니다.",
	warning: "'%0'을(를) 정말 삭제하시겠습니까?"});

merge(config.commands.permalink,{
	text: "절대주소",
	tooltip: "이 티들러의 절대주소입니다."});

merge(config.commands.references,{
	text: "연관글",
	tooltip: "이 티들러를 링크한 티들러를 보여줍니다.",
	popupNone: "연관글 없음"});

merge(config.commands.jump,{
	text: "건너뛰기",
	tooltip: "열려있는 다른 티들러로 건너뜁니다."});

merge(config.commands.syncing,{
	text: "동기화",
	tooltip: "이 티들러를 서버 또는 외부 파일과 동기화합니다.",
	currentlySyncing: "<div>현재 <span class='popupHighlight'>'%0'</span>을 통해 다음과 동기화하고 있습니다.</"+"div><div>호스트: <span class='popupHighlight'>%1</span></"+"div><div>작업공간: <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "현재 동기화하고 있지 않습니다.",
	captionUnSync: "이 티들러의 동기화를 중단.",
	chooseServer: "이 티들러를 다른 서버와 동기화",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "입력 항목",
	tooltip: "이 티들러의 확장된 입력 항목을 보여줍니다.",
	emptyText: "이 티들러에 확장된 입력 항목이 없습니다.",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "필드", type: 'String'},
			{name: 'Value', field: 'value', title: "값", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "GettingStarted",
	MainMenu: "[[처음 사용자용 문서|GettingStarted]]\n\n\n^^~TiddlyWiki 버전 <<version>>\nⓒ 2009 [[UnaMesa|http://www.unamesa.org/]]^^",
	GettingStarted: "비어있는 이 TiddlyWiki를 사용하기 전에 아래 티들러를 수정해야 합니다.\n* SiteTitle 및 SiteSubtitle: 페이지 상단에 보이는 이 사이트의 제목과 부제목입니다. (저장 후에는 이 파일을 연 브라우저의 제목 표시줄에도 보입니다.)\n* MainMenu: 메인 메뉴입니다. 대부분 왼쪽에 있습니다.\n* DefaultTiddlers: TiddlyWiki를 열 때 띄울 티들러의 이름을 포함하고 있습니다.\n그리고, 편집한 티들러에 서명할 이름을 입력해 주십시오. <<option txtUserName>>",
	SiteTitle: "내 TiddlyWiki",
	SiteSubtitle: "개인용으로 사용할 수 있는 재사용 가능한 줄 없는 웹 노트",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "이 TiddlyWiki에서 인터페이스 옵션을 설정하면 사용중인 브라우저에 저장됩니다.\n\n편집한 티들러에 서명할 이름입니다. 위키 단어 형식에 맞게 입력하십시오. (예: 익명)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> [[백업 저장|SaveBackups]]\n<<option chkAutoSave>> [[자동 저장|AutoSave]]\n<<option chkRegExpSearch>> [[정규식 찾기|RegExpSearch]]\n<<option chkCaseSensitiveSearch>> [[대소문자 구분하여 찾기|CaseSensitiveSearch]]\n<<option chkAnimate>> [[애니메이션 활성화|EnableAnimations]]\n----\n[[고급 옵션|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "YYYY년 MM월 DD일" "일정">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "옵션 \u00bb" "TiddlyWiki의 고급 옵션을 바꿉니다.">>',
	SideBarTabs: '<<tabs txtMainTab "시간순" "티들러를 시간순으로 나열합니다." TabTimeline "모두봄" "모든 티들러를 보입니다." TabAll "태그" "모든 태그를 보입니다." TabTags "기타" "목록을 다른 모양으로 보입니다." TabMore>>',
	TabMore: '<<tabs txtMoreTab "빠짐" "빠진 티들러를 보입니다." TabMoreMissing "외톨이" "외톨이 티들러를 보입니다." TabMoreOrphans "숨김" "숨김 티들러를 보입니다." TabMoreShadowed>>'
	});

merge(config.annotations,{
	AdvancedOptions: "이 숨김 티들러는 몇 가지 고급 옵션에 접근할 수 있도록 합니다.",
	ColorPalette: "이 숨김 티들러의 값들은 이 TiddlyWiki의 사용자 인터페이스에 쓸 색 배합을 결정합니다.",
	DefaultTiddlers: "이 숨김 티들러는 이 TiddlyWiki가 시작했을 때 자동으로 보여지는 티들러를 나열합니다.",
	EditTemplate: "이 숨김 티들러의 HTML 템플릿은 티들러를 편집할 때 어떤 식으로 보일 지를 결정합니다.",
	GettingStarted: "이 숨김 티들러는 기본 사용법을 설명하는 내용을 가지고 있습니다.",
	ImportTiddlers: "이 숨김 티들러는 티들러를 가져오는 기능을 제공합니다.",
	MainMenu: "이 숨김 티들러는 왼쪽 열의 메인 메뉴로 쓰입니다.",
	MarkupPreHead: "이 티들러는 이 TiddlyWiki HTML 파일의 <head> 태그 내 상단에 삽입됩니다.",
	MarkupPostHead: "이 티들러는 이 TiddlyWiki HTML 파일의 <head> 태그 내 하단에 삽입됩니다.",
	MarkupPreBody: "이 티들러는 이 TiddlyWiki HTML 파일의 <body> 태그 내 상단에 삽입됩니다.",
	MarkupPostBody: "이 티들러는 이 TiddlyWiki HTML 파일의 <body> 태그 내 하단에 있는 script 부분 바로 다음에 삽입됩니다.",
	OptionsPanel: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 옵션 패널로 쓰입니다.",
	PageTemplate: "이 숨김 티들러의 HTML 템플릿은 이 TiddlyWiki의 레이아웃 전체를 결정합니다.",
	PluginManager: "이 숨김 티들러는 플러그인 관리자 기능을 제공합니다.",
	SideBarOptions: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 옵션 메뉴로 쓰입니다.",
	SideBarTabs: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 탭 패널로 쓰입니다.",
	SiteSubtitle: "이 숨김 티들러는 페이지 부제목에 쓰입니다.",
	SiteTitle: "이 숨김 티들러는 페이지 제목에 쓰입니다.",
	SiteUrl: "이 숨김 티들러의 내용은 이 위치를 출판할 때 쓸 완전한 URL 경로로 지정되어야 합니다.",
	StyleSheetColors: "이 숨김 티들러는 페이지 구성요소의 색과 관계된 CSS를 정의하고 있습니다. ''이 티들러를 수정하지 마십시오.'' 대신 StyleSheet 숨김 티들러를 편집하십시오.",
	StyleSheet: "이 티들러는 개별 CSS를 정의할 수 있습니다.",
	StyleSheetLayout: "이 숨김 티들러는 페이지 구성요소의 레이아웃과 관계된 CSS를 정의하고 있습니다. ''이 티들러를 수정하지 마십시오.'' 대신 StyleSheet 숨김 티들러를 편집하십시오.",
	StyleSheetLocale: "이 숨김 티들러는 언어 특성에 따른 CSS를 정의하고 있습니다.",
	StyleSheetPrint: "이 숨김 티들러는 인쇄와 관련된 CSS를 정의하고 있습니다.",
	TabAll: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '모두봄' 탭의 내용입니다.",
	TabMore: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '더보기' 탭의 내용입니다.",
	TabMoreMissing: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '빠짐' 탭의 내용입니다.",
	TabMoreOrphans: "이 숨김 티들러는 오른쪽 열 사이드바의 '외톨이' 탭의 내용입니다.",
	TabMoreShadowed: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '숨김' 탭의 내용입니다.",
	TabTags: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '태그' 탭의 내용입니다.",
	TabTimeline: "이 숨김 티들러는 오른쪽 열에 있는 사이드바의 '시간순' 탭의 내용입니다.",
	ToolbarCommands: "이 숨김 티들러는 티들러에 표시하는 오른쪽 상단 도구 모음에 보이는 명령의 배치를 결정합니다.",
	ViewTemplate: "이 숨김 티들러의 HTML 템플릿은 티들러가 어떻게 보일 지를 결정합니다."
	});

//}}}