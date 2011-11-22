//--
//-- Tiddler() object
//--

function Tiddler(title)
{
	this.title = title;
	this.text = "";
	this.creator = null;
	this.modifier = null;
	this.created = new Date();
	this.modified = this.created;
	this.links = [];
	this.linksUpdated = false;
	this.tags = [];
	this.fields = {};
	return this;
}

Tiddler.prototype.getLinks = function()
{
	if(this.linksUpdated==false)
		this.changed();
	return this.links;
};

// Returns the fields that are inherited in string field:"value" field2:"value2" format
Tiddler.prototype.getInheritedFields = function()
{
	var f = {};
	var i;
	for(i in this.fields) {
		if(i=="server.host" || i=="server.workspace" || i=="wikiformat"|| i=="server.type") {
			f[i] = this.fields[i];
		}
	}
	return String.encodeHashMap(f);
};

// Increment the changeCount of a tiddler
Tiddler.prototype.incChangeCount = function()
{
	var c = this.fields['changecount'];
	c = c ? parseInt(c,10) : 0;
	this.fields['changecount'] = String(c+1);
};

// Clear the changeCount of a tiddler
Tiddler.prototype.clearChangeCount = function()
{
	if(this.fields['changecount']) {
		delete this.fields['changecount'];
	}
};

//# returns true when this tiddler has the field 'temporary', meaning it is a temporary tiddler (i.e. must not be saved).
Tiddler.prototype.doNotSave = function()
{
	return this.fields['doNotSave'];
};

// Returns true if the tiddler has been updated since the tiddler was created or downloaded
Tiddler.prototype.isTouched = function()
{
	var changecount = this.fields.changecount || 0;
	return changecount > 0;
};

// Change the text and other attributes of a tiddler
Tiddler.prototype.set = function(title,text,modifier,modified,tags,created,fields,creator)
{
	this.assign(title,text,modifier,modified,tags,created,fields,creator);
	this.changed();
	return this;
};

// Change the text and other attributes of a tiddler without triggered a tiddler.changed() call
Tiddler.prototype.assign = function(title,text,modifier,modified,tags,created,fields,creator)
{
	if(title != undefined)
		this.title = title;
	if(text != undefined)
		this.text = text;
	if(modifier != undefined)
		this.modifier = modifier;
	if(modified != undefined)
		this.modified = modified;
	if(creator != undefined)
		this.creator = creator;
	if(created != undefined)
		this.created = created;
	if(fields != undefined)
		this.fields = fields;
	if(tags != undefined)
		this.tags = (typeof tags == "string") ? tags.readBracketedList() : tags;
	else if(this.tags == undefined)
		this.tags = [];
	return this;
};

// Get the tags for a tiddler as a string (space delimited, using [[brackets]] for tags containing spaces)
Tiddler.prototype.getTags = function()
{
	return String.encodeTiddlyLinkList(this.tags);
};

// Test if a tiddler carries a tag
Tiddler.prototype.isTagged = function(tag)
{
	return this.tags.indexOf(tag) != -1;
};

// Static method to convert "\n" to newlines, "\s" to "\"
Tiddler.unescapeLineBreaks = function(text)
{
	return text ? text.unescapeLineBreaks() : "";
};

// Convert newlines to "\n", "\" to "\s"
Tiddler.prototype.escapeLineBreaks = function()
{
	return this.text.escapeLineBreaks();
};

// Updates the secondary information (like links[] array) after a change to a tiddler
Tiddler.prototype.changed = function()
{
	this.links = [];
	var text = this.text;
	// remove 'quoted' text before scanning tiddler source
	text = text.replace(/\/%((?:.|\n)*?)%\//g,"").
		replace(/\{{3}((?:.|\n)*?)\}{3}/g,"").
		replace(/"""((?:.|\n)*?)"""/g,"").
		replace(/<nowiki\>((?:.|\n)*?)<\/nowiki\>/g,"").
		replace(/<html\>((?:.|\n)*?)<\/html\>/g,"").
		replace(/<script((?:.|\n)*?)<\/script\>/g,"");
	var t = this.autoLinkWikiWords() ? 0 : 1;
	var tiddlerLinkRegExp = t==0 ? config.textPrimitives.tiddlerAnyLinkRegExp : config.textPrimitives.tiddlerForcedLinkRegExp;
	tiddlerLinkRegExp.lastIndex = 0;
	var formatMatch = tiddlerLinkRegExp.exec(text);
	while(formatMatch) {
		var lastIndex = tiddlerLinkRegExp.lastIndex;
		if(t==0 && formatMatch[1] && formatMatch[1] != this.title) {
			// wikiWordLink
			if(formatMatch.index > 0) {
				var preRegExp = new RegExp(config.textPrimitives.unWikiLink+"|"+config.textPrimitives.anyLetter,"mg");
				preRegExp.lastIndex = formatMatch.index-1;
				var preMatch = preRegExp.exec(text);
				if(preMatch.index != formatMatch.index-1)
					this.links.pushUnique(formatMatch[1]);
			} else {
				this.links.pushUnique(formatMatch[1]);
			}
		}
		else if(formatMatch[2-t] && !config.formatterHelpers.isExternalLink(formatMatch[3-t])) // titledBrackettedLink
			this.links.pushUnique(formatMatch[3-t]);
		else if(formatMatch[4-t] && formatMatch[4-t] != this.title) // brackettedLink
			this.links.pushUnique(formatMatch[4-t]);
		//# Do not add link if match urlPattern (formatMatch[5-t])
		tiddlerLinkRegExp.lastIndex = lastIndex;
		formatMatch = tiddlerLinkRegExp.exec(text);
	}
	this.linksUpdated = true;
};

Tiddler.prototype.getSubtitle = function()
{
	var modifier = this.modifier;
	if(!modifier)
		modifier = config.messages.subtitleUnknown || "";
	var modified = this.modified;
	if(modified)
		modified = modified.toLocaleString();
	else
		modified = config.messages.subtitleUnknown || "";
	var f = config.messages.tiddlerLinkTooltip || "%0 - %1, %2";
	return f.format([this.title,modifier,modified]);
};

Tiddler.prototype.isReadOnly = function()
{
	return readOnly;
};

Tiddler.prototype.autoLinkWikiWords = function()
{
	return !(this.isTagged("systemConfig") || this.isTagged("excludeMissing"));
};

Tiddler.prototype.getServerType = function()
{
	var serverType = null;
	if(this.fields['server.type'])
		serverType = this.fields['server.type'];
	if(!serverType)
		serverType = this.fields['wikiformat'];
	if(serverType && !config.adaptors[serverType])
		serverType = null;
	return serverType;
};

Tiddler.prototype.getAdaptor = function()
{
	var serverType = this.getServerType();
	return serverType ? new config.adaptors[serverType]() : null;
};

