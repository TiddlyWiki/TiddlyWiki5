//--
//-- Sparklines
//--

config.macros.sparkline = {};

config.shadowTiddlers.StyleSheetSparklines = "/*{{{*/\n" +
	".sparkline {\n" +
	"\tline-height: 1em;\n" +
	"\tborder: 0;\n" +
	"\tbackground: [[ColorPalette::PrimaryPale]];\n" +
	"}\n\n" +
	".sparktick {\n" +
	"\toutline: 0;\n" +
	"\tbackground: [[ColorPalette::PrimaryDark]];\n" +
	"}\n" +
	"/*}}}*/";
store.addNotification("StyleSheetSparklines", refreshStyles);

config.macros.sparkline.handler = function(place,macroName,params)
{
	var data = [];
	var min = 0;
	var max = 0;
	var v;
	for(var t=0; t<params.length; t++) {
		v = parseInt(params[t],10);
		if(v < min)
			min = v;
		if(v > max)
			max = v;
		data.push(v);
	}
	if(data.length < 1)
		return;
	var box = createTiddlyElement(place,"span",null,"sparkline",String.fromCharCode(160));
	box.title = data.join(",");
	var w = box.offsetWidth;
	var h = box.offsetHeight;
	box.style.paddingRight = (data.length * 2 - w) + "px";
	box.style.position = "relative";
	for(var d=0; d<data.length; d++) {
		var tick = document.createElement("img");
		tick.border = 0;
		tick.className = "sparktick";
		tick.style.position = "absolute";
		tick.src = "data:image/gif,GIF89a%01%00%01%00%91%FF%00%FF%FF%FF%00%00%00%C0%C0%C0%00%00%00!%F9%04%01%00%00%02%00%2C%00%00%00%00%01%00%01%00%40%02%02T%01%00%3B";
		tick.style.left = d*2 + "px";
		tick.style.width = "2px";
		v = Math.floor(((data[d] - min)/(max-min)) * h);
		tick.style.top = (h-v) + "px";
		tick.style.height = v + "px";
		box.appendChild(tick);
	}
};

