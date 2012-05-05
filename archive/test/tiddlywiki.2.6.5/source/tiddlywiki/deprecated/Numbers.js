//--
//-- Deprecated Number functions
//--

// @Deprecated: no direct replacement, since not used in core code
// Clamp a number to a range
Number.prototype.clamp = function(min,max)
{
	var c = this;
	if(c < min)
		c = min;
	if(c > max)
		c = max;
	return Number(c);
};

