/***
|''Name:''|PluginBahasaIndonesia|
|''Description:''|Terjemah TiddlyWiki ke dalam Bahasa Indonesia|
|''Author:''|Abd Shomad (abd (dot) shomad (at) gmail (dot) com)|
|''Source:''|id-tiddlywiki.tiddlyspot.com |
|''CodeRepository:''|http://svn.tiddlywiki.org/Trunk/association/locales/core/id/locale.id.js |
|''Version:''|0.3.6|
|''Date:''|Mar 8, 2008|
|''Comments:''|Silahkan mengirimkan komentar Anda ke http://groups.google.co.uk/group/TiddlyWikiDev |
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]] |
|''~CoreVersion:''|2.3.0|
***/

//{{{
//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

config.locale = "id"; // W3C language tag

if (config.options.txtUserName == 'YourName') // do not translate this line, but do translate the next line
	merge(config.options,{txtUserName: "NamaAnda"});

merge(config.tasks,{
	save: {text: "simpan", tooltip: "Simpan perubahan di dokumen wiki", action: saveChanges},
	sync: {text: "sinkronisasi", tooltip: "Sinkronisasi perubahan-perubahan yang Anda lakukan dengan file-file TiddlyWiki atau dengan server-server di lain tempat", content: '<<sync>>'},
	importTask: {text: "impor", tooltip: "Impor tiddler-tiddler dan plugin-plugin dari file-file TiddlyWiki atau dengan server-server di lain tempat", content: '<<importTiddlers>>'},
	tweak: {text: "pilihan selera", tooltip: "Sesuaikan penampilan dan perilaku TiddlyWiki", content: '<<options>>'},
	plugins: {text: "plugin-plugin", tooltip: "Kelola plugin-plugin yang terinstall", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc,{
	txtUserName: "Nama untuk menandai perubahan-perubahan Anda",
	chkRegExpSearch: "Aktifkan regular expression untuk pencarian",
	chkCaseSensitiveSearch: "Pencarian Peka-Huruf-Besar (//Case-Sensitive//)",
	chkAnimate: "Aktifkan fitur animasi",
	chkSaveBackups: "Simpan file cadangan (//backup//) ketika menyimpan perubahan-perubahan",
	chkAutoSave: "Simpan perubahan-perubahan secara otomatis",
	chkGenerateAnRssFeed: "Hasilkan asupan RSS (//RSS feed//) ketika menyimpan perubahan-perubahan",
	chkSaveEmptyTemplate: "Hasilkan sebuah template kosong ketika menyimpan perubahan-perubahan",
	chkOpenInNewWindow: "Buka tautan-tautan eksternal (//external links//) di window baru",
	chkToggleLinks: "Klik pada tautan-tautan (//links//) untuk membuka tiddler-tiddler mengakibatkan mereka tertutup.",
	chkHttpReadOnly: "Sembunyikan fitur penyuntingan ketika ditampilkan melalui HTTP",
	chkForceMinorUpdate: "Jangan perbarui pengubah username dan pengubah tanggal ketika mengubah tiddler-tiddler",
	chkConfirmDelete: "Tanyakan penegasan (konfirmasi) sebelum menghapus tiddler-tiddler",
	chkInsertTabs: "Gunakan kunci tabulasi (tab) untuk menyisipkan tabulasi sebagai ganti perpindahan di antara kotak masukan",
	txtBackupFolder: "Nama folder untuk meyimpan cadangan-cadangan (//backup//)",
	txtMaxEditRows: "Jumlah baris maksimum untuk kotak masukan",
	txtFileSystemCharSet: "Kumpulan-huruf (//character set//) default  untuk menyimpan perubahan-perubahan (Hanya Firefox/Mozilla)"});

merge(config.messages,{
	customConfigError: "Ditemukan masalah saat memuat plugin-plugin. Silahkan membuka PluginManager untuk mengetahui lebih rinci",
	pluginError: "Kesalahan: %0",
	pluginDisabled: "Tidak dijalankan karena dilumpuhkan dengan cap 'systemConfigDisable' ",
	pluginForced: "Dijalankan karena dipaksa dengan cap 'systemConfigForce'",
	pluginVersionError: "Tidak dijalankan karena plugin ini memerlukan versi TiddlyWiki yang lebih baru",
	nothingSelected: "Tidak ada yang dipilih. Anda harus memilih satu atau beberapa item terlebih dahulu.",
	savedSnapshotError: "Sepertinya TiddlyWiki ini tersimpan secara tidak sempurna. Silahkan melihat http://www.tiddlywiki.com/#DownloadSoftware untuk mengetahui lebih rinci",
	subtitleUnknown: "(tak dikenal)",
	undefinedTiddlerToolTip: "Tiddler '%0' belum ada",
	shadowedTiddlerToolTip: "Tiddler '%0' belum ada, akan tetapi telah memiliki nilai bayangan pra-definisi (pre-defined shadow value)",
	tiddlerLinkTooltip: "%0 - %1, %2",
	externalLinkTooltip: "Tautan eksternal ke %0",
	noTags: "Tidak ada tiddler-tiddler yang memiliki cap",
	notFileUrlError: "Anda perlu untuk menyimpan TiddlyWiki ini ke suatu file sebelum Anda bisa menyimpan perubahan-perubahan",
	cantSaveError: "Adalah tidak mungkin untuk menyimpan perubahan-perubahan. Alasan-alasan yang mungkin termasuk:\n- browser Anda tidak mendukung penyimpanan (Firefox, Internet Explorer, Safari dan Opera semuanya bisa jika dikonfigurasikan secara benar)\n- alamat ke file TiddlyWiki mengandung huruf-huruf ilegal\n- file HTML TiddlyWiki telah dipindahkan atau telah diubah nama",
	invalidFileError: "File yang asli '%0' tidak tampak sebagai file TiddlyWiki yang sah",
	backupSaved: "Cadangan (//backup//) telah disimpan",
	backupFailed: "Gagal menyimpan file cadangan (//backup//)",
	rssSaved: "Asupan RSS (//RSS feed//) telah disimpan",
	rssFailed: "Gagal menyimpan file asupan RSS (//RSS feed//)",
	emptySaved: "Template kosong telah disimpan",
	emptyFailed: "Gagal untuk menyimpan file template kosong",
	mainSaved: "File TiddlyWiki utama telah disimpan",
	mainFailed: "Gagal menyimpan file TiddlyWiki utama. Perubahan-perubahan Anda belum bisa disimpan",
	macroError: "Kesalahan di macro <<\%0>>",
	macroErrorDetails: "Kesalahan terjadi saat menjalankan macro <<\%0>>:\n%1",
	missingMacro: "Tidak ada macro dengan nama tersebut",
	overwriteWarning: "Sebuah tiddler dengan nama '%0' telah ada. Pilih OK untuk menimpanya.",
	unsavedChangesWarning: "PERINGATAN! Ada beberapa perubahan-perubahan di TiddlyWiki\n\nPilih OK untuk menyimpan\nPilih CANCEL untuk membatalkan",
	confirmExit: "--------------------------------\n\nAda beberapa perubahan-perubahan yang belum disimpan di TiddlyWiki. Jika Anda melanjutkan, Anda akan kehilangan perubahan-perubahan tersebut\n\n--------------------------------",
	saveInstructions: "Simpan Perubahan",
	unsupportedTWFormat: "Format TiddlyWiki yang tidak didukung '%0'",
	tiddlerSaveError: "Gagal pada saat menyimpan tiddler '%0'",
	tiddlerLoadError: "Gagal pada saat memuat tiddler '%0'",
	wrongSaveFormat: "Tidak bisa menyimpan dengan format penyimpanan '%0'. Menggunakan bentuk standar untuk menyimpan.",
	invalidFieldName: "Nama field tidak sah %0",
	fieldCannotBeChanged: "Field '%0' tidak bisa diubah",
	loadingMissingTiddler: "Mencoba untuk mendapatkan kembali tiddler '%0' dari server '%1' pada:\n\n'%2' di ruang kerja (workspace) '%3'"});

merge(config.messages.messageClose,{
	text: "tutup",
	tooltip: "tutup area pesan ini"});

config.messages.backstage = {
	open: {text: "di belakang layar", tooltip: "Buka area di belakang layar untuk melakukan penulisan dan penyuntingan tugas-tugas (task)"},
	close: {text: "tutup", tooltip: "Tutup area di belakang layar"},
	prompt: "di belakang layar: ",
	decal: {
		edit: {text: "edit", tooltip: "Edit tiddler '%0'"}
	}
};

config.messages.listView = {
	tiddlerTooltip: "Klik untuk melihat lebih rinci dari tiddler ini",
	previewUnavailable: "(preview tidak tersedia)"
};

config.messages.dates.months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November","Desember"];
config.messages.dates.days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
config.messages.dates.shortDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"];
config.messages.dates.am = "siang";
config.messages.dates.pm = "malam";

merge(config.messages.tiddlerPopup,{
	});

merge(config.views.wikified.tag,{
	labelNoTags: "tidak ada cap",
	labelTags: "cap: ",
	openTag: "Buka cap '%0'",
	tooltip: "Tampilkan tiddler dengan cap '%0'",
	openAllText: "Buka semua",
	openAllTooltip: "Buka semua tiddler-tiddler berikut",
	popupNone: "Tidak ada tiddler dengan cap '%0'"});

merge(config.views.wikified,{
	defaultText: "Tiddler '%0' belum pernah ada. Klik-ganda (double-click) untuk membuatnya",
	defaultModifier: "(hilang)",
	shadowModifier: "(tiddler bayangan built-in)",
	dateFormat: "DD MMM YYYY", // use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D
	createdPrompt: "telah dibuat"});

merge(config.views.editor,{
	tagPrompt: "Ketikkan cap-cap dipisahkan dengan spasi, [[gunakan kurung ganda]] jika diperlukan, atau tambahkan dari yang sudah ada",
	defaultText: "Ketikkan teks untuk '%0'"});

merge(config.views.editor.tagChooser,{
	text: "cap-cap",
	tooltip: "Pilih cap-cap yang sudah ada untuk ditambahkan di tiddler ini",
	popupNone: "Tidak ada cap-cap yang di definisikan",
	tagTooltip: "Tambahkan cap '%0'"});

merge(config.messages,{
	sizeTemplates:
		[
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
		]});

merge(config.macros.search,{
	label: "cari",
	prompt: "Cari TiddlyWiki ini",
	accessKey: "F",
	successMsg: "%0 tiddler-tiddler menemukan kecocokan dengan %1",
	failureMsg: "Tidak ada tiddler-tiddler yang cocok dengan %0"});

merge(config.macros.tagging,{
	label: "mencap: ",
	labelNotTag: "tidak ada cap",
	tooltip: "Daftar tiddler-tiddler yang dicap dengan '%0'"});

merge(config.macros.timeline,{
	dateFormat: "DD MMM YYYY"});// use this to change the date format for your locale, eg "YYYY MMM DD", do not translate the Y, M or D

merge(config.macros.allTags,{
	tooltip: "Tampilkan tiddler-tiddler yang dicap dengan '%0'",
	noTags: "Tidak ada tiddler-tiddler yang dicap"});

config.macros.list.all.prompt = "Semua tiddler-tiddler dalam urutan secara alfabet";
config.macros.list.missing.prompt = "Tiddler-tiddler yang memiliki tautan-tautan menuju dia, tapi belum terdefinisikan";
config.macros.list.orphans.prompt = "Tiddler-tiddler yang tidak memiliki tautan dari tiddler-tiddler yang lain";
config.macros.list.shadowed.prompt = "Tiddler-tiddler yang dibayangi dengan isi default";
config.macros.list.touched.prompt = "Tiddler-tiddler yang telah dimodifikasi secara lokal";

merge(config.macros.closeAll,{
	label: "tutup semua",
	prompt: "Tutup semua tiddler-tiddler yang ditampilkan (kecuali beberapa yang sedang disunting)"});

merge(config.macros.permaview,{
	label: "permaview",
	prompt: "Tautan ke suatu URL yang mendapatkan kembali semua tiddler-tiddler yang ditampilkan"});

merge(config.macros.saveChanges,{
	label: "simpan perubahan",
	prompt: "Simpan semua tiddler-tiddler untuk membuat sebuah TiddlyWiki yang baru",
	accessKey: "S"});

merge(config.macros.newTiddler,{
	label: "tiddler baru",
	prompt: "Buat sebuah tiddler baru",
	title: "Tiddler Baru",
	accessKey: "N"});

merge(config.macros.newJournal,{
	label: "jurnal baru",
	prompt: "Buat sebuah tiddler dari tanggal dan waktu saat ini",
	accessKey: "J"});

merge(config.macros.options,{
	wizardTitle: "Sesuaikan pilihan-pilihan tingkat lanjut",
	step1Title: "Pilihan-pilihan ini akan disimpan di cookies di browser Anda",
	step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Tampilkan pilihan-pilihan yang tak dikenal </input>",
	unknownDescription: "//(tak dikenal)//",
	listViewTemplate: {
		columns: [
			{name: 'Option', field: 'option', title: "Pilihan", type: 'String'},
			{name: 'Description', field: 'description', title: "Deskripsi", type: 'WikiText'},
			{name: 'Name', field: 'name', title: "Nama", type: 'String'}
			],
		rowClasses: [
			{className: 'lowlight', field: 'lowlight'} 
			]}
	});

merge(config.macros.plugins,{
	wizardTitle: "Kelola plugin-plugin",
	step1Title: "Plugin-plugin yang saat ini termuat",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	skippedText: "(Plugin ini belum pernah dijalankan karena dia ditambahkan setelah proses awal (startup))",
	noPluginText: "Tidak ada plugin yang terinstall",
	confirmDeleteText: "Apakah Anda yakin untuk menghapus plugin-plugin ini:\n\n%0",
	removeLabel: "hilangkan cap systemConfig",
	removePrompt: "Hilangkan cap systemConfig",
	deleteLabel: "hapus",
	deletePrompt: "Hapus tiddler-tiddler berikut selamanya",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Ukuran", type: 'Size'},
			{name: 'Forced', field: 'forced', title: "Dipaksakan", tag: 'systemConfigForce', type: 'TagCheckbox'},
			{name: 'Disabled', field: 'disabled', title: "Dilumpuhkan", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Dimuat", type: 'Boolean', trueText: "Yes", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Waktu Permulaan (Startup)", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Kesalahan", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
			],
		rowClasses: [
			{className: 'error', field: 'error'},
			{className: 'warning', field: 'warning'}
			]}
	});

merge(config.macros.toolbar,{
	moreLabel: "lagi",
	morePrompt: "Perlihatkan perintah-perintah lainnya"
	});

merge(config.macros.refreshDisplay,{
	label: "penyegaran (refresh)",
	prompt: "Gambar ulang seluruh tampilan TiddlyWiki"
	});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "Anda tidak bisa mengimpor ke suatu file TiddlyWiki yang hanya bisa dibaca (read-only). Coba ulangi membukanya dari URL file://",
	wizardTitle: "Impor tiddler-tiddler dari file atau server lain",
	step1Title: "Langkah 1: Tentukan server atau file TiddlyWiki",
	step1Html: "Tentukan tipe server : <select name='selTypes'><option value=''>Pilih...</option></select><br>Masukkan URL atau lokasi file di sini: <input type='text' size=50 name='txtPath'><br>...atau buka file berikut: <input type='file' size=50 name='txtBrowse'><br><hr>...atau pilih asupan pra-definisi (//pre-defined feed//): <select name='selFeeds'><option value=''>Pilih...</option></select>",
	openLabel: "buka",
	openPrompt: "Buka hubungan ke file atau server ini",
	openError: "Ada beberapa masalah ketika mengambil file tiddlywiki",
	statusOpenHost: "Membuka host",
	statusGetWorkspaceList: "Menerima daftar beberapa ruang-kerja (workspace) yang tersedia",
	step2Title: "Langkah 2: Pilih ruang-kerja (workspace)",
	step2Html: "Masukkan nama ruang-kerja (workspace): <input type='text' size=50 name='txtWorkspace'><br>...atau pilih sebuah ruang-kerja (workspace): <select name='selWorkspace'><option value=''>Pilih...</option></select>",
	cancelLabel: "batalkan",
	cancelPrompt: "Batalkan proses impor ini",
	statusOpenWorkspace: "Membuka ruang-kerja (workspace)",
	statusGetTiddlerList: "Menerima daftar beberapa tiddler yang tersedia",
	step3Title: "Langkah 3: Pilih tiddler-tiddler untuk diimpor",
	step3Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='true' name='chkSync'>Simpan tiddler-tiddler yang tertaut ke server ini sehingga Anda bisa mensinkronisasikan perubahan-perubahan selanjutnya</input><br><input type='checkbox' name='chkSave'>Simpan rincian server ini di dalam tiddler 'systemServer' dengan nama:</input> <input type='text' size=25 name='txtSaveTiddler'>",
	importLabel: "impor",
	importPrompt: "Impor tiddler-tiddler ini",
	confirmOverwriteText: "Apakah Anda yakin untuk menimpa tiddler-tiddler ini:\n\n%0",
	step4Title: "Langkah 4: Mengimpor %0 tiddler-tiddler",
	step4Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "selesai",
	donePrompt: "Tutup wizard ini",
	statusDoingImport: "Mengimpor (beberapa) tiddler",
	statusDoneImport: "Semua tiddler telah berhasil diimpor",
	systemServerNamePattern: "%2 pada %1",
	systemServerNamePatternNoWorkspace: "%1",
	confirmOverwriteSaveTiddler: "Tiddler dengan nama '%0' telah ada. Klik 'OK' untuk menimpanya dengan rincian dari server ini, atau 'Cancel' untuk meninggalkannya tidak berubah",
	serverSaveTemplate: "|''Tipe:''|%0|\n|''URL:''|%1|\n|''Ruang-kerja (workspace):''|%2|\n\nTiddler ini dibuat secara otomatis untuk merekam rincian server ini",
	serverSaveModifier: "(System)",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Ukuran", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Cap", type: 'Tags'}
			],
		rowClasses: [
			]}
	});

merge(config.macros.sync,{
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Server Type', field: 'serverType', title: "Tipe Server", type: 'String'},
			{name: 'Server Host', field: 'serverHost', title: "Host Server", type: 'String'},
			{name: 'Server Workspace', field: 'serverWorkspace', title: "Ruang-kerja (workspace) Server", type: 'String'},
			{name: 'Status', field: 'status', title: "Status Sinkronisasi", type: 'String'},
			{name: 'Server URL', field: 'serverUrl', title: "URL Server", text: "Tampilkan", type: 'Link'}
			],
		rowClasses: [
			],
		buttons: [
			{caption: "Sinkronisasi tiddler-tiddler ini", name: 'sync'}
			]},
	wizardTitle: "Sinkronisasi dengan server-server dan file-file eksternal",
	step1Title: "Pilih beberapa tiddler yang ingin disinkronisasikan",
	step1Html: "<input type='hidden' name='markList'></input>", // DO NOT TRANSLATE
	syncLabel: "sinkronisasi",
	syncPrompt: "Sinkronisasikan tiddler-tiddler ini",
	hasChanged: "Berubah pada saat tidak terhubung",
	hasNotChanged: "Tidak berubah pada saat tidak terhubung",
	syncStatusList: {
		none: {text: "...", color: "tidak ada"},
		changedServer: {text: "Berubah di server", color: '#80ff80'},
		changedLocally: {text: "Berubah pada saat tidak terhubung", color: '#80ff80'},
		changedBoth: {text: "Berubah pada saat tidak terhubung dan pada server", color: '#ff8080'},
		notFound: {text: "Tidak ditemukan pada server", color: '#ffff80'},
		putToServer: {text: "Simpan perubahan pada server", color: '#ff80ff'},
		gotFromServer: {text: "Ambil perubahan dari server", color: '#80ffff'}
		}
	});

merge(config.commands.closeTiddler,{
	text: "tutup",
	tooltip: "Tutup tiddler ini"});

merge(config.commands.closeOthers,{
	text: "tutup lainnya",
	tooltip: "Tutup semua tiddler lain"});

merge(config.commands.editTiddler,{
	text: "sunting",
	tooltip: "Sunting tiddler ini",
	readOnlyText: "tampilkan",
	readOnlyTooltip: "Tampilkan sumber dari tiddler ini"});

merge(config.commands.saveTiddler,{
	text: "selesai",
	tooltip: "Simpan perubahan-perubahan di tiddler ini"});

merge(config.commands.cancelTiddler,{
	text: "batalkan",
	tooltip: "Batalkan perubahan-perubahan di tiddler ini",
	warning: "Apakah Anda yakin ingin mengabaikan perubahan-perubahan Anda ke '%0'?",
	readOnlyText: "selesai",
	readOnlyTooltip: "Tampilkan tiddler ini secara normal"});

merge(config.commands.deleteTiddler,{
	text: "hapus",
	tooltip: "Hapus tiddler ini",
	warning: "Apakah Anda yakin ingin menghapus '%0'?"});

merge(config.commands.permalink,{
	text: "permalink",
	tooltip: "Link permanen untuk tiddler ini"});

merge(config.commands.references,{
	text: "rujukan-rujukan",
	tooltip: "Tampilkan tiddler-tiddler yang memiliki tautan ke tiddler ini",
	popupNone: "Tidak ada rujukan"});

merge(config.commands.jump,{
	text: "lompat",
	tooltip: "Lompat ke tiddler lainnya"});

merge(config.commands.syncing,{
	text: "sinkronisasi",
	tooltip: "Kendalikan proses sinkronisasi tiddler ini dengan sebuah server atau file eksternal",
	currentlySyncing: "<div>Saat ini sedang melakukan proses sinkronisasi melalui <span class='popupHighlight'>'%0'</span> to:</"+"div><div>host: <span class='popupHighlight'>%1</span></"+"div><div>ruang-kerja (workspace): <span class='popupHighlight'>%2</span></"+"div>", // Note escaping of closing <div> tag
	notCurrentlySyncing: "Saat ini tidak sedang melakukan proses sinkronisasi",
	captionUnSync: "Hentikan proses sinkronisasi tiddler ini",
	chooseServer: "Sinkronisasikan tiddler ini dengan server lainnya:",
	currServerMarker: "\u25cf ",
	notCurrServerMarker: "  "});

merge(config.commands.fields,{
	text: "isian-isian",
	tooltip: "Tampilkan isian-isian lanjutan untuk tiddler ini",
	emptyText: "Tidak ada isian-isian lanjutan untuk tiddler ini",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Isian", type: 'String'},
			{name: 'Value', field: 'value', title: "Nilai", type: 'String'}
			],
		rowClasses: [
			],
		buttons: [
			]}});

merge(config.shadowTiddlers,{
	DefaultTiddlers: "[[BelajarMemulai]]",
	MainMenu: "[[BelajarMemulai]]\n\n\n^^~TiddlyWiki versi <<version>>\n © 2007 [[UnaMesa|http://www.unamesa.org/]]^^",
	BelajarMemulai: "Untuk memulai dengan TiddlyWiki kosong ini, Anda perlu memodifikasi beberapa tiddler berikut:\n* JudulSitus & SubJudulSitus: Judul dan subjudul dari situs ini, sebagaimana ditampilkan di atas (setelah menyimpan, mereka akan juga tampil di palang judul (title bar) milik browser)\n* MenuUtama: Sajian menu (biasanya tampil di sebelah kiri)\n* DefaultTiddlers: Berisi nama-nama beberapa tiddler yang ingin Anda tampilkan ketika TiddlyWiki dibuka\nAnda juga perlu untuk mengetikkan nama Anda untuk menandai perubahan-perubahan yang Anda lakukan: <<option txtUserName>>",
	SiteTitle: "TiddlyWiki Kami",
	SiteSubtitle: "Sebuah notebook web yang tidak-linear dan bisa dipakai ulang",
	SiteUrl: "http://www.tiddlywiki.com/",
	OptionsPanel: "Pilihan-pilihan Antarmuka untuk menyesuaikan TiddlyWiki telah disimpan di browser Anda. \n\nTulislah username untuk menandai perubahan-perubahan Anda sebagai KataWiki (WikiWord) (contoh: AbdShomad, bukan Abd Shomad)\n<<option txtUserName>>\n\n<<option chkSaveBackups>> Simpan cadangan-cadangan (//backup//)\n<<option chkAutoSave>> Simpan secara otomatis\n<<option chkRegExpSearch>> Pencarian dengan menggunakan Regexp\n<<option chkCaseSensitiveSearch>> Pencarian Peka-Huruf-Besar (Case sensitive) \n<<option chkAnimate>> Perbolehkan animasi\n\n----\nLihat juga [[Pilihan Pilihan Lanjutan|AdvancedOptions]]",
	SideBarOptions: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "Pilihan Selera »" "Ubah pilihan selera tampilan lanjutan TiddlyWiki">>',
	SideBarTabs: '<<tabs txtMainTab "Garis-waktu" "Garis-waktu" TabTimeline "Semua" "Semua tiddler" TabAll "Cap" "Semua Cap" TabTags "Lagi" "Daftar lainnya" TabMore>>',
	TabMore: '<<tabs txtMoreTab "Yang Hilang" "Tiddler-tiddler yang hilang" TabMoreMissing "Yatim Piatu" "Tiddler-tiddler yang yatim piatu" TabMoreOrphans "Bayangan" "Tiddler-tiddler bayangan" TabMoreShadowed>>'});

merge(config.annotations,{
	AdvancedOptions: "Tiddler bayangan ini menyediakan akses ke pilihan-pilihan lanjutan",
	ColorPalette: "Nilai-nilai di tiddler bayangan ini menentukan skema warna antar muka ~TiddlyWiki",
	DefaultTiddlers: "Tiddler-tiddler yang terdaftar di tiddler bayangan ini akan ditampilkan secara otomatis pada saat ~TiddlyWiki dibuka pertama kali",
	EditTemplate: "Template HTML template di tiddler bayangan ini menentukan bagaimana tiddler-tiddler ditampilkan ketika tiddler tersebut disunting",
	GettingStarted: "Tiddler bayangan ini menyediakan instruksi penggunaan dasar",
	ImportTiddlers: "Tiddler bayangan ini menyediakan akses ke pengimporan tiddler-tiddler",
	MainMenu: "Tiddler bayangan ini digunakan sebagai isi menu utama di kolom sebelah kiri layar",
	MarkupPreHead: "Tiddler ini disisipkan di atas bagian <head> dari file HTML ~TiddlyWiki",
	MarkupPostHead: "Tiddler ini disisipkan di bawah bagian <head> dari file HTML ~TiddlyWiki",
	MarkupPreBody: "Tiddler ini disisipkan di atas bagian <body> dari file HTML ~TiddlyWiki",
	MarkupPostBody: "Tiddler ini disisipkan di bawah bagian <body>, sebelum bagian <script> dari file HTML ~TiddlyWiki (diantara <body> dan <script>)",
	OptionsPanel: "Tiddler bayangan ini digunakan sebagai isi dari panel geser pilihan-pilihan di bagian kanan",
	PageTemplate: "Template HTML di tiddler bayangan ini menentukan tata letak keseluruhan halaman ~TiddlyWiki",
	PluginManager: "Tiddler bayangan ini menyediakan akses ke pengelolaan plugin",
	SideBarOptions: "Tiddler bayangan ini digunakan sebagai isi dari panel pilihan di kolom sebelah kanan",
	SideBarTabs: "Tiddler bayangan ini digunakan sebagai isi dari panel tabulasi di kolom sebelah kanan",
	SiteSubtitle: "Tiddler bayangan ini digunakan sebagai bagian kedua dari judul halaman",
	SiteTitle: "Tiddler bayangan ini digunakan sebagai bagian pertama dari judul halaman",
	SiteUrl: "Tiddler bayangan ini harus diset dengan URL lengkap untuk publikasi",
	StyleSheetColours: "Tiddler bayangan ini berisi definisi CSS yang berhubungan dengan warna dari elemen-elemen halaman",
	StyleSheet: "Tiddler ini bisa berisi definisi CSS buatan sendiri",
	StyleSheetLayout: "Tiddler bayangan ini berisi definisi CSS yang berhubungan dengan tata letak elemen-elemen halaman",
	StyleSheetLocale: "Tiddler bayangan ini berisi definisi CSS yang berhubungan dengan penerjemahan ke bahasa lain",
	StyleSheetPrint: "Tiddler bayangan ini berisi definisi CSS untuk pencetakan (print)",
	TabAll: "Tiddler bayangan ini adalah isi dari tab 'Semua' di kolom bagian kanan",
	TabMore: "Tiddler bayangan ini adalah isi dari tab 'Lagi' di kolom bagian kanan",
	TabMoreMissing: "Tiddler bayangan ini adalah isi dari tab 'Hilang' di kolom bagian kanan",
	TabMoreOrphans: "Tiddler bayangan ini adalah isi dari tab 'Yatim Piatu' di kolom bagian kanan",
	TabMoreShadowed: "Tiddler bayangan ini adalah isi dari tab 'Bayangan' di kolom bagian kanan",
	TabTags: "Tiddler bayangan ini adalah isi dari tab 'Cap' di kolom bagian kanan",
	TabTimeline: "Tiddler bayangan ini adalah isi dari tab 'GarisWaktu' di kolom bagian kanan",
	ViewTemplate: "Template HTML di tiddler bayangan ini menentukan bagaimana rupa tiddler-tiddler saat ditampilkan"
	});

//}}}
