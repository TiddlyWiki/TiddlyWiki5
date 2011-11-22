//--
//-- Popup menu
//--

var Popup = {
	stack: [] // Array of objects with members root: and popup:
	};

Popup.create = function(root,elem,className)
{
	var stackPosition = this.find(root,"popup");
	Popup.remove(stackPosition+1);
	var popup = createTiddlyElement(document.body,elem || "ol","popup",className || "popup");
	popup.stackPosition = stackPosition;
	Popup.stack.push({root: root, popup: popup});
	return popup;
};

Popup.onDocumentClick = function(ev)
{
	var e = ev || window.event;
	if(e.eventPhase == undefined)
		Popup.remove();
	else if(e.eventPhase == Event.BUBBLING_PHASE || e.eventPhase == Event.AT_TARGET)
		Popup.remove();
	return true;
};

//# valign : "top" or "bottom" (optional)
//#   defaults to "bottom" for regular popups, "top" for nested popups
//# halign : "left" or "right" (optional)
//#   defaults to "left" for regular popups, "right" for nested popups
//# offset : {x: number, y: number} (optional)
//#   defaults to {x:0,y:0}
Popup.show = function(valign,halign,offset)
{
	var curr = Popup.stack[Popup.stack.length-1];
	this.place(curr.root,curr.popup,valign,halign,offset);
	jQuery(curr.root).addClass("highlight");
	if(config.options.chkAnimate && anim && typeof Scroller == "function")
		anim.startAnimating(new Scroller(curr.popup));
	else
		window.scrollTo(0,ensureVisible(curr.popup));
};

Popup.place = function(root,popup,valign,halign,offset)
{
	if(!offset)
		offset = {x:0,y:0};
	if(popup.stackPosition >= 0 && !valign && !halign) {
		offset.x = offset.x + root.offsetWidth;
	} else {
		offset.x = (halign == "right") ? offset.x + root.offsetWidth : offset.x;
		offset.y = (valign == "top") ? offset.y : offset.y + root.offsetHeight;
	}
	var rootLeft = findPosX(root);
	var rootTop = findPosY(root);
	var popupLeft = rootLeft + offset.x;
	var popupTop = rootTop + offset.y;
	var winWidth = findWindowWidth();
	if(popup.offsetWidth > winWidth*0.75)
		popup.style.width = winWidth*0.75 + "px";
	var popupWidth = popup.offsetWidth;
	var scrollWidth = winWidth - document.body.offsetWidth;
	if(popupLeft + popupWidth > winWidth - scrollWidth - 1) {
		if(halign == "right")
			popupLeft = popupLeft - root.offsetWidth - popupWidth;
		else
			popupLeft = winWidth - popupWidth - scrollWidth - 1;
	}
	popup.style.left = popupLeft + "px";
	popup.style.top = popupTop + "px";
	popup.style.display = "block";
};

Popup.find = function(e)
{
	var t,pos = -1;
	for(t=this.stack.length-1; t>=0; t--) {
		if(isDescendant(e,this.stack[t].popup))
			pos = t;
	}
	return pos;
};

Popup.remove = function(pos)
{
	if(!pos) pos = 0;
	if(Popup.stack.length > pos) {
		Popup.removeFrom(pos);
	}
};

Popup.removeFrom = function(from)
{
	var t;
	for(t=Popup.stack.length-1; t>=from; t--) {
		var p = Popup.stack[t];
		jQuery(p.root).removeClass("highlight");
		jQuery(p.popup).remove();
	}
	Popup.stack = Popup.stack.slice(0,from);
};

