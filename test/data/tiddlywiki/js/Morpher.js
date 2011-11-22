//--
//-- Morpher animation
//--

// Animate a set of properties of an element
//#   element - the element to be moved (optional
//#   duration - duration of animation
//#   properties - an array of objects describing each property that is to be modified:
//#       format - one of:
//#         "style" for numeric styles (default)
//#         "color" for #RRGGBB format colour styles
//#       style - name of the style being animated. Includes pseudo-styles:
//#         "-tw-scrollVert" - controls vertical scrolling
//#         "-tw-scrollHoriz" - controls horizontal scrolling
//#       start - starting value to animate from
//#       end - ending value to animation from
//#       atEnd - final value (taking priority over the end value) (eg, for switching style.display)
//#       template - template for formatString() for setting the property (eg "%0em", or "#%0")
//#       callback - function to call when the animation has completed as callback(element,properties);
function Morpher(element,duration,properties,callback)
{
	this.element = element;
	this.duration = duration;
	this.properties = properties;
	this.startTime = new Date();
	this.endTime = Number(this.startTime) + duration;
	this.callback = callback;
	this.tick();
	return this;
}

Morpher.prototype.assignStyle = function(element,style,value)
{
	switch(style) {
	case "-tw-vertScroll":
		window.scrollTo(findScrollX(),value);
		break;
	case "-tw-horizScroll":
		window.scrollTo(value,findScrollY());
		break;
	default:
		element.style[style] = value;
		break;
	}
};

Morpher.prototype.stop = function()
{
	var t;
	for(t=0; t<this.properties.length; t++) {
		var p = this.properties[t];
		if(p.atEnd !== undefined) {
			this.assignStyle(this.element,p.style,p.atEnd);
		}
	}
	if(this.callback)
		this.callback(this.element,this.properties);
};

Morpher.prototype.tick = function()
{
	var currTime = Number(new Date());
	var t,progress = Animator.slowInSlowOut(Math.min(1,(currTime-this.startTime)/this.duration));
	for(t=0; t<this.properties.length; t++) {
		var p = this.properties[t];
		if(p.start !== undefined && p.end !== undefined) {
			var template = p.template || "%0";
			switch(p.format) {
			case undefined:
			case "style":
				var v = p.start + (p.end-p.start) * progress;
				this.assignStyle(this.element,p.style,template.format([v]));
				break;
			case "color":
				break;
			}
		}
	}
	if(currTime >= this.endTime) {
		this.stop();
		return false;
	}
	return true;
};

