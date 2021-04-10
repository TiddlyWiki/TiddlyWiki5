/*\
title: $:/core/modules/sitemap.js
type: application/javascript
module-type: global

Sitemaps are used for static publishing and web serving

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Sitemap(options) {
    options = options || {};
    this.wiki = options.wiki;
    this.routes = [];
    this.variables = $tw.utils.extend({},options.variables);
}

Sitemap.prototype.load = function(sitemapTitle) {
    var self = this;
    // Get the sitemap
    var sitemapTiddler = this.wiki.getTiddler(sitemapTitle);
    if(sitemapTiddler) {
        // Get the sitemap variables
        $tw.utils.extend(this.variables,sitemapTiddler.getFieldStrings({prefix: "var-"}));
        console.log("sitemap variables",this.variables)
        // Collect each route
        $tw.utils.each(sitemapTiddler.fields.list,function(routeTitle) {
            var routeTiddler = self.wiki.getTiddler(routeTitle);
            if(routeTiddler) {
                // Convert the path into a regexp and an array of {field:,function:} for each capture group
                var regexpurgatedParameterisedPath = self.regexpurgateParameterisedPath(routeTiddler.fields["route-path"]);
                self.routes.push({
                    params: routeTiddler.getFieldStrings({prefix: "route-"}),
                    variables: routeTiddler.getFieldStrings({prefix: "var-"}),
                    regexp: regexpurgatedParameterisedPath.regexp,
                    captureGroups: regexpurgatedParameterisedPath.captureGroups
                });
            }
        });
    }
    console.log("routes",self.routes)
};

Sitemap.prototype.renderRoute = function(title,route) {
    var tiddler = this.wiki.getTiddler(title);
    switch(route.params.type) {
        case "raw":
            return {
                path: this.resolveParameterisedPath(route.params.path,title),
                text: tiddler.fields.text || "",
                type: tiddler.fields.type || "",
                isBase64: ($tw.config.contentTypeInfo[tiddler.fields.type] || {}).encoding  === "base64"
            };
            break;
        case "render":
            var text = this.wiki.renderTiddler("text/plain",route.params.template,{
                    variables: $tw.utils.extend({},this.variables,route.variables,{currentTiddler: title})
                });
            return {
                path: this.resolveParameterisedPath(route.params.path,title),
                text: text,
                type: route.params["output-type"] || "text/html"
            };
            break;
    }
};

/*
Returns an array of functions that return {path:,text:,type:,isBase64:} for each path
*/
Sitemap.prototype.getAllFileDetails = function(exportTiddlers) {
    var self = this,
        output  = [];
    $tw.utils.each(this.routes,function(route) {
        var routeFilter = route.params["tiddler-filter"] || "DUMMY_RESULT", // If no filter is provided, use a dummy  filter that returns a single result
            routeTiddlers = self.wiki.filterTiddlers(routeFilter,null,self.wiki.makeTiddlerIterator(exportTiddlers));
        $tw.utils.each(routeTiddlers,function(title) {
            output.push(self.renderRoute.bind(self,title,route));
        });
    });
    return output;
};


/*
Returns an array of server routes {method:, path:, handler:}
*/
Sitemap.prototype.getServerRoutes = function() {
    var self = this,
        output = [];
    $tw.utils.each(this.routes,function(route) {
        output.push({
            method: "GET",
            path: route.regexp,
            handler: function(request,response,state) {
                // Locate the tiddler identified by the capture groups, if any
                var title = null,
                    nextParam = 0;
                $tw.utils.each(route.captureGroups,function(captureGroup) {
                    var param = state.params[nextParam++];
                    if(captureGroup.field === "title") {
                        switch(captureGroup.function) {
                            case "slugify":
                                var titles = self.wiki.unslugify(param);
                                if(titles && titles.length > 0) {
                                    title = titles[0];
                                }
                                break;
                        }
                    }
                })
                // Return the rendering or raw tiddler
                switch(route.params.type) {
                    case "render":
                        response.writeHead(200,{"Content-Type": route.params["output-type"] || "text/html"});
                        response.end(self.wiki.renderTiddler("text/plain",route.params.template,{
                            variables: $tw.utils.extend({},self.variables,route.variables,{currentTiddler: title})
                        }));
                        break;
                    case "raw":
                        var tiddler = title && self.wiki.getTiddler(title);
                        if(tiddler) {
                            response.writeHead(200, {"Content-Type": tiddler.fields.type || "text/vnd.tiddlywiki"});
                            response.end(self.wiki.getTiddlerText(title),($tw.config.contentTypeInfo[tiddler.fields.type] || {encoding: "utf8"}).encoding);
                        } else {
                            response.writeHead(404);
                            response.end();
                        }
                        break;
                }
            }
        });
    });
    return output;
};

/*
Apply a tiddler to a parameterised path to create a usable path
*/
Sitemap.prototype.resolveParameterisedPath = function(parameterisedPath,title) {
    var self = this;
    // Split the path on $*_*$ markers
    var tiddler = this.wiki.getTiddler(title),
        output = [];
    $tw.utils.each(parameterisedPath.split(/(\$[a-z_]+\$)/),function(part) {
        var match = part.match(/\$([a-z]+)_([a-z]+)\$/);
        if(match) {
            var value;
            // Get the base value
            switch(match[1]) {
                case "uri":
                case "title":
                    value = title;
                    break;
                case "type":
                    value = tiddler.fields.type || "text/vnd.tiddlywiki";
                    break;
            }
            // Apply the encoding function
            switch(match[2]) {
                case "encoded":
                    value = encodeURIComponent(value);
                    break;
                case "doubleencoded":
                    value = encodeURIComponent(encodeURIComponent(value));
                    break;
                case "slugify":
                    value = self.wiki.slugify(value);
                    break;
                case "extension":
                    value = ($tw.config.contentTypeInfo[value] || {extension: "."}).extension.slice(1);
                    break;
            }
            output.push(value);
        } else {
            output.push(part);
        }
    });
    return output.join("");
};

/*
// Convert the path into a regexp and an array of {field:,function:} for each capture group
*/
Sitemap.prototype.regexpurgateParameterisedPath = function(parameterisedPath) {
    var regexpParts = ["\\/"],
        captureGroups = [];
    $tw.utils.each(parameterisedPath.split(/(\$[a-z_]+\$)/),function(part) {
        var match = part.match(/\$([a-z]+)_([a-z]+)\$/);
        if(match) {
            regexpParts.push("(.+)");
            captureGroups.push({
                field: match[1],
                function: match[2]
            });
        } else {
            regexpParts.push($tw.utils.escapeRegExp(part));
        }
    });
    return {
        regexp: new RegExp("^" + regexpParts.join("") + "$"),
        captureGroups: captureGroups
    };
};

exports.Sitemap = Sitemap;
    
})();
    