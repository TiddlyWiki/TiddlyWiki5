//--
//-- Deprecated utility functions
//-- Use the jQuery functions directly instead
//--

// Remove all children of a node
function removeChildren(e)
{
	jQuery(e).empty();
}

// Remove a node and all it's children
function removeNode(e)
{
	jQuery(e).remove();
}

// Return the content of an element as plain text with no formatting
function getPlainText(e)
{
	return jQuery(e).text();
}

function addClass(e,className)
{
	jQuery(e).addClass(className);
}

function removeClass(e,className)
{
	jQuery(e).removeClass(className);
}

function hasClass(e,className)
{
	return jQuery(e).hasClass(className);
}

