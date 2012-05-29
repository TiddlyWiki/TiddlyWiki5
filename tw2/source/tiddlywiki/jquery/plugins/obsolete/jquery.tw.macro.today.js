/*
jquery.tw.macro.today.js
jQuery TiddlyWiki <<today>> macro
*/
(function($) {
	$.fn.tw_today = function(args) {
		args.format = args.format || args[1];
		var opts = $.extend({},$.fn.tw_today.defaults,args);
		var now = new Date();
		var text = now.formatString(opts.format.trim());
		this.append("<span>"+text+"</span>");
		return this;
	};
	$.fn.tw_today.defaults = {format:"ddd mmm 0DD 0hh:0mm:0ss YYYY"};
})(jQuery);
