/*\
title: $:/plugins/tiddlywiki/plugin-combiner/modules/widgets/plugin-combiner.js
type: application/javascript
module-type: widget

Plugin Combiner Widget - Combines multiple plugins into one

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var PluginCombinerWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

PluginCombinerWidget.prototype = new Widget();

PluginCombinerWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    var self = this;
    var pluginTitles = this.pluginTitles;

    // Container
    var container = this.document.createElement("div");
    container.className = "tc-plugin-combiner";

    // Plugin list
    var listContainer = this.document.createElement("div");
    listContainer.className = "tc-plugin-combiner-list";

    this.checkboxes = {};

    if(pluginTitles.length === 0) {
        var empty = this.document.createElement("p");
        empty.textContent = "No plugins match the filter.";
        empty.style.color = "#999";
        listContainer.appendChild(empty);
    }

    pluginTitles.forEach(function(title) {
        var tiddler = self.wiki.getTiddler(title);
        if(!tiddler) return;

        var item = self.document.createElement("div");
        item.className = "tc-plugin-combiner-item";

        var label = self.document.createElement("label");

        var checkbox = self.document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = title;
        self.checkboxes[title] = checkbox;

        var info = self.document.createElement("div");
        info.className = "tc-plugin-combiner-info";

        var name = self.document.createElement("strong");
        name.textContent = tiddler.fields.name || title;
        info.appendChild(name);

        var version = tiddler.fields.version;
        if(version) {
            var versionSpan = self.document.createElement("span");
            versionSpan.className = "tc-plugin-combiner-version";
            versionSpan.textContent = " v" + version;
            info.appendChild(versionSpan);
        }

        var titleSpan = self.document.createElement("div");
        titleSpan.className = "tc-plugin-combiner-title";
        titleSpan.textContent = title;
        info.appendChild(titleSpan);

        // Show dependents if any
        var dependents = tiddler.fields.dependents;
        if(dependents) {
            var depSpan = self.document.createElement("div");
            depSpan.className = "tc-plugin-combiner-dependents";
            depSpan.textContent = "Requires: " + dependents;
            info.appendChild(depSpan);
        }

        var description = tiddler.fields.description;
        if(description) {
            var descSpan = self.document.createElement("div");
            descSpan.className = "tc-plugin-combiner-description";
            descSpan.textContent = description;
            info.appendChild(descSpan);
        }

        label.appendChild(checkbox);
        label.appendChild(info);
        item.appendChild(label);
        listContainer.appendChild(item);
    });

    container.appendChild(listContainer);

    // Controls
    var controls = this.document.createElement("div");
    controls.className = "tc-plugin-combiner-controls";

    var selectAll = this.document.createElement("button");
    selectAll.className = "tc-btn-invisible";
    selectAll.textContent = "Select all";
    selectAll.addEventListener("click", function() {
        self.setAllCheckboxes(true);
    });
    controls.appendChild(selectAll);

    var selectNone = this.document.createElement("button");
    selectNone.className = "tc-btn-invisible";
    selectNone.textContent = "Select none";
    selectNone.addEventListener("click", function() {
        self.setAllCheckboxes(false);
    });
    controls.appendChild(selectNone);

    container.appendChild(controls);

    // Options section
    var optionsSection = this.document.createElement("div");
    optionsSection.className = "tc-plugin-combiner-options";

    // Include dependencies checkbox
    var depLabel = this.document.createElement("label");
    depLabel.className = "tc-plugin-combiner-option";

    this.includeDepsCheckbox = this.document.createElement("input");
    this.includeDepsCheckbox.type = "checkbox";
    this.includeDepsCheckbox.checked = this.includeDependencies;

    depLabel.appendChild(this.includeDepsCheckbox);
    depLabel.appendChild(this.document.createTextNode(" Include dependencies (parent plugins) automatically"));

    optionsSection.appendChild(depLabel);
    container.appendChild(optionsSection);

    // Action buttons
    var actions = this.document.createElement("div");
    actions.className = "tc-plugin-combiner-actions";

    var downloadBtn = this.document.createElement("button");
    downloadBtn.className = "tc-btn-big-green";
    downloadBtn.textContent = "Download Combined Plugin";
    downloadBtn.addEventListener("click", function() {
        self.handleDownload();
    });
    actions.appendChild(downloadBtn);

    container.appendChild(actions);

    // Status
    this.statusDiv = this.document.createElement("div");
    this.statusDiv.className = "tc-plugin-combiner-status";
    container.appendChild(this.statusDiv);

    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
};

PluginCombinerWidget.prototype.setAllCheckboxes = function(checked) {
    var self = this;
    Object.keys(this.checkboxes).forEach(function(title) {
        self.checkboxes[title].checked = checked;
    });
};

PluginCombinerWidget.prototype.getSelectedPlugins = function() {
    var selected = [];
    var self = this;
    Object.keys(this.checkboxes).forEach(function(title) {
        if(self.checkboxes[title].checked) {
            selected.push(title);
        }
    });
    return selected;
};

/**
 * Get tiddlers from a plugin using multiple methods
 */
PluginCombinerWidget.prototype.getPluginTiddlers = function(pluginTitle) {
    var self = this;
    var tiddlers = {};

    // Method 1: getPluginInfo (for registered plugins)
    var pluginInfo = this.wiki.getPluginInfo(pluginTitle);
    if(pluginInfo && pluginInfo.tiddlers) {
        return pluginInfo.tiddlers;
    }

    // Method 2: getTiddlerData (for JSON plugin tiddlers)
    var pluginData = this.wiki.getTiddlerData(pluginTitle);
    if(pluginData && pluginData.tiddlers) {
        return pluginData.tiddlers;
    }

    // Method 3: Parse the text field directly
    var pluginTiddler = this.wiki.getTiddler(pluginTitle);
    if(pluginTiddler && pluginTiddler.fields.text) {
        try {
            var parsed = JSON.parse(pluginTiddler.fields.text);
            if(parsed && parsed.tiddlers) {
                return parsed.tiddlers;
            }
        } catch (e) {
            // Not valid JSON
        }
    }

    // Method 4: Collect shadow tiddlers
    this.wiki.eachShadow(function(shadowTiddler, shadowTitle) {
        if(self.wiki.getShadowSource(shadowTitle) === pluginTitle) {
            var fields = {};
            $tw.utils.each(shadowTiddler.fields, function(value, field) {
                if(field !== "title") {
                    fields[field] = value;
                }
            });
            tiddlers[shadowTitle] = fields;
        }
    });

    if(Object.keys(tiddlers).length > 0) {
        return tiddlers;
    }

    return tiddlers;
};

/**
 * Resolve all dependencies recursively
 * Returns array of plugin titles in dependency order (dependencies first)
 */
PluginCombinerWidget.prototype.resolveDependencies = function(selectedPlugins) {
    var self = this;
    var resolved = [];
    var seen = {};
    var missingDeps = [];

    function resolve(pluginTitle) {
        if(seen[pluginTitle]) return;
        seen[pluginTitle] = true;

        var pluginTiddler = self.wiki.getTiddler(pluginTitle);
        if(!pluginTiddler) {
            // Dependency doesn't exist in this wiki
            missingDeps.push(pluginTitle);
            return;
        }

        // Get dependents field - can be string or array
        var dependents = pluginTiddler.fields.dependents;
        if(dependents) {
            var depList = self.parseDependents(dependents);

            // Resolve each dependency first
            depList.forEach(function(dep) {
                if(dep && !seen[dep]) {
                    resolve(dep);
                }
            });
        }

        resolved.push(pluginTitle);
    }

    // Resolve each selected plugin
    selectedPlugins.forEach(function(pluginTitle) {
        resolve(pluginTitle);
    });

    return {
        plugins: resolved,
        missing: missingDeps
    };
};

/**
 * Parse dependents field into array
 */
PluginCombinerWidget.prototype.parseDependents = function(dependents) {
    if(!dependents) return [];

    if(Array.isArray(dependents)) {
        return dependents;
    }

    if(typeof dependents === "string") {
        // Try JSON array first
        try {
            var parsed = JSON.parse(dependents);
            if(Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // Not JSON
        }

        // Space or comma separated
        return dependents.split(/[\s,]+/).filter(function(d) {
            return d && d.trim();
        });
    }

    return [];
};

/**
 * Build the combined plugin
 */
PluginCombinerWidget.prototype.buildCombinedPlugin = function() {
    var self = this;
    var selectedPlugins = this.getSelectedPlugins();

    if(selectedPlugins.length === 0) {
        throw new Error("Please select at least one plugin");
    }

    // Check if we should include dependencies
    var includeDeps = this.includeDepsCheckbox.checked;
    var allPlugins;
    var missingDeps = [];
    var addedDeps = 0;

    if(includeDeps) {
        // Resolve dependencies
        var resolved = this.resolveDependencies(selectedPlugins);
        allPlugins = resolved.plugins;
        missingDeps = resolved.missing;
        addedDeps = allPlugins.length - selectedPlugins.length;
    } else {
        // Just use selected plugins without resolving dependencies
        allPlugins = selectedPlugins;
    }

    var combinedTiddlers = {};
    var sourcePlugins = [];

    allPlugins.forEach(function(pluginTitle) {
        var pluginTiddler = self.wiki.getTiddler(pluginTitle);
        if(!pluginTiddler) {
            return;
        }

        var tiddlers = self.getPluginTiddlers(pluginTitle);

        // Merge tiddlers, ensuring title is included and arrays are serialized
        $tw.utils.each(tiddlers, function(fields, title) {
            var tiddlerData = {
                title: title
            };
            $tw.utils.each(fields, function(value, field) {
                if(field !== "title") {
                    // Serialize arrays to TiddlyWiki list format
                    if(Array.isArray(value)) {
                        tiddlerData[field] = $tw.utils.stringifyList(value);
                    } else {
                        tiddlerData[field] = value;
                    }
                }
            });
            combinedTiddlers[title] = tiddlerData;
        });

        sourcePlugins.push(pluginTiddler.fields.name || pluginTitle);
    });

    // Build output plugin
    var outputTitle = this.outputTitle;
    if(!outputTitle) {
        throw new Error("Plugin title is required");
    }

    var tiddlerCount = Object.keys(combinedTiddlers).length;

    if(tiddlerCount === 0) {
        throw new Error("No tiddlers found in selected plugins. Check browser console for details.");
    }

    // Build the plugin tiddler with all standard fields
    var combinedPlugin = {
        title: outputTitle,
        name: this.outputName || "Combined Plugin",
        description: this.outputDescription || ("Combined from: " + sourcePlugins.join(", ")),
        author: this.outputAuthor || "",
        version: this.outputVersion || "1.0.0",
        "plugin-type": "plugin",
        type: "application/json",
        text: JSON.stringify({
            tiddlers: combinedTiddlers
        })
    };

    return {
        plugin: combinedPlugin,
        tiddlerCount: tiddlerCount,
        sourceCount: allPlugins.length,
        addedDependencies: addedDeps,
        missingDependencies: missingDeps,
        includedDependencies: includeDeps
    };
};

PluginCombinerWidget.prototype.handleDownload = function() {
    try {
        var result = this.buildCombinedPlugin();
        var plugin = result.plugin;

        // Plugin tiddler with text field containing the tiddlers
        var exportData = {
            title: plugin.title,
            name: plugin.name,
            description: plugin.description,
            author: plugin.author,
            version: plugin.version,
            "plugin-type": "plugin",
            type: "application/json",
            text: plugin.text
        };

        // Wrap in array for drag-drop import
        var json = JSON.stringify([exportData], null, 2);
        var blob = new Blob([json], {
            type: "application/json"
        });
        var url = URL.createObjectURL(blob);

        var a = this.document.createElement("a");
        a.href = url;
        a.download = plugin.title.split("/").pop() + ".json";
        this.document.body.appendChild(a);
        a.click();
        this.document.body.removeChild(a);
        URL.revokeObjectURL(url);

        var message = "Downloaded plugin with " + result.tiddlerCount +
            " tiddlers from " + result.sourceCount + " plugins";
        if(result.addedDependencies > 0) {
            message += " (" + result.addedDependencies + " dependencies auto-included)";
        }
        if(result.missingDependencies.length > 0) {
            message += ". Warning: " + result.missingDependencies.length + " dependencies not found";
        }
        this.showStatus("success", message);
    } catch (e) {
        this.showStatus("error", e.message);
    }
};

PluginCombinerWidget.prototype.showStatus = function(type, message) {
    this.statusDiv.className = "tc-plugin-combiner-status tc-plugin-combiner-status-" + type;
    this.statusDiv.textContent = message;
};

PluginCombinerWidget.prototype.execute = function() {
    // Filter for plugins to show
    this.filter = this.getAttribute("filter", "[plugin-type[plugin]]");
    this.prefix = this.getAttribute("prefix", "");

    // Get plugins matching filter
    this.pluginTitles = this.wiki.filterTiddlers(this.filter, this);

    // Apply prefix filter if specified
    if(this.prefix) {
        var prefix = this.prefix;
        this.pluginTitles = this.pluginTitles.filter(function(title) {
            return title.indexOf(prefix) === 0;
        });
    }

    // Output plugin configuration from attributes
    this.outputTitle = this.getAttribute("outputTitle", "$:/plugins/custom/combined");
    this.outputName = this.getAttribute("outputName", "Combined Plugin");
    this.outputVersion = this.getAttribute("outputVersion", "1.0.0");
    this.outputAuthor = this.getAttribute("outputAuthor", "");
    this.outputDescription = this.getAttribute("outputDescription", "A combined plugin bundle");

    // Include dependencies option
    this.includeDependencies = this.getAttribute("includeDependencies", "yes") === "yes";
};

PluginCombinerWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.filter || changedAttributes.prefix || changedAttributes.outputTitle || changedAttributes.outputName ||
       changedAttributes.outputVersion || changedAttributes.outputAuthor || changedAttributes.outputDescription ||
       changedAttributes.includeDependencies) {
        this.refreshSelf();
        return true;
    }

    // Re-evaluate filter and check if results changed
    var newPluginTitles = this.wiki.filterTiddlers(this.filter, this);
    if(!$tw.utils.isArrayEqual(this.pluginTitles, newPluginTitles)) {
        this.refreshSelf();
        return true;
    }

    return false;
};

exports["plugin-combiner"] = PluginCombinerWidget;
