/*\
title: $:/core/modules/commands/inspect/editor-history.js
type: application/javascript
module-type: library

Multi-line editor history for the REPL .editor and .edit commands.
Keeps editor blocks out of single-line history and stores them
separately with a date comment header.

\*/

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const EDITOR_HISTORY_PATH = path.join(os.homedir(), ".tiddlywiki_repl_editor_history");
const EDITOR_BLOCK_SEPARATOR = "\n---\n";
const MAX_EDITOR_BLOCKS = 100;
const DATE_COMMENT_RE = /^\/\/\s*\d{4}-\d{2}-\d{2}.*\n/;

function formatDateComment() {
	return "// " + new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "") + "\n";
}

// Strip the date comment header from a block to get the code
function getCodeFromBlock(block) {
	return block.replace(DATE_COMMENT_RE, "");
}

// Get the date line from a block (for display)
function getDateFromBlock(block) {
	var match = block.match(DATE_COMMENT_RE);
	return match ? match[0].trim() : "";
}

// Load existing editor history from disk
function loadEditorHistory() {
	try {
		var data = fs.readFileSync(EDITOR_HISTORY_PATH, "utf8");
		if(!data.trim()) {
			return [];
		}
		return data.split(EDITOR_BLOCK_SEPARATOR).filter(function(block) {
			return block.trim().length > 0;
		});
	} catch(e) {
		return [];
	}
}

// Save a full block (with date header) to the editor history file
// If the block already has a date header, preserve it; otherwise add one
function saveEditorBlock(content) {
	var blocks = loadEditorHistory();
	var trimmed = content.trim();
	var block;
	if(DATE_COMMENT_RE.test(trimmed + "\n")) {
		// Content already has a date header -- keep it as-is
		block = trimmed;
	} else {
		// Add a new date header
		block = formatDateComment() + trimmed;
	}
	var blockCode = getCodeFromBlock(block).trim();
	// Remove existing duplicate (comparing code without date headers)
	var existingIndex = blocks.findIndex(function(b) {
		return getCodeFromBlock(b).trim() === blockCode;
	});
	if(existingIndex !== -1) {
		blocks.splice(existingIndex, 1);
	}
	blocks.push(block);
	// Keep only the most recent blocks
	while(blocks.length > MAX_EDITOR_BLOCKS) {
		blocks.shift();
	}
	try {
		fs.writeFileSync(EDITOR_HISTORY_PATH, blocks.join(EDITOR_BLOCK_SEPARATOR), "utf8");
	} catch(e) {
		// Silently ignore write errors
	}
}

// Resolve the user's preferred editor
function getEditor() {
	return process.env.VISUAL || process.env.EDITOR || (process.platform === "win32" ? "notepad" : "nano");
}

/**
 * Set up editor history on a REPL runtime.
 * Overrides .editor to open $EDITOR. Adds .edit and .editorhistory commands.
 */
exports.setupEditorHistory = function(runtime) {

	// Show the editor history listing
	function showHistory(self) {
		var blocks = loadEditorHistory();
		if(blocks.length === 0) {
			self.output.write("No editor history available.\n");
		} else {
			for(var i = 0; i < blocks.length; i++) {
				var dateLine = getDateFromBlock(blocks[i]);
				var code = getCodeFromBlock(blocks[i]);
				var firstCodeLine = code.split("\n")[0];
				var lineCount = code.trim().split("\n").length;
				self.output.write("[" + (i + 1) + "] " + dateLine + " (" + lineCount + " lines) " + firstCodeLine + "\n");
			}
		}
		self.displayPrompt();
	}

	// Open $EDITOR with a temp file, evaluate on close
	function openEditor(self, initialContent, label) {
		var editor = getEditor();
		self.output.write(label + " with " + editor + "\n");

		var tmpFile = path.join(os.tmpdir(), "tiddlywiki_repl_edit_" + Date.now() + ".js");

		try {
			fs.writeFileSync(tmpFile, initialContent, "utf8");
		} catch(e) {
			self.output.write("Error creating temp file: " + e.message + "\n");
			self.displayPrompt();
			return;
		}

		try {
			execFileSync(editor, [tmpFile], { stdio: "inherit" });

			var fileContent = fs.readFileSync(tmpFile, "utf8").trim();

			try { fs.unlinkSync(tmpFile); } catch(e) { /* ignore */ }

			var code = getCodeFromBlock(fileContent).trim();

			if(code.length === 0) {
				self.output.write("Empty file, nothing to evaluate.\n");
				self.displayPrompt();
				return;
			}

			saveEditorBlock(fileContent);

			self.output.write("\n");
			runtime.eval(code + "\n", runtime.context, "editor", function(err, result) {
				if(err) {
					if(err.stack) {
						self.output.write(err.stack + "\n");
					} else {
						self.output.write(String(err) + "\n");
					}
				} else if(result !== undefined) {
					self.output.write(runtime.writer(result) + "\n");
				}
				self.displayPrompt();
			});
		} catch(e) {
			try { fs.unlinkSync(tmpFile); } catch(unlinkErr) { /* ignore */ }

			if(e.status !== null && e.status !== undefined) {
				self.output.write("Editor exited with code " + e.status + "\n");
			} else {
				self.output.write("Error launching editor '" + editor + "': " + e.message + "\n");
			}
			self.displayPrompt();
		}
	}

	// Unified .edit action: dispatches subcommands
	function editAction(input) {
		var self = this;
		var trimmed = input.trim();
		var trimmedLower = trimmed.toLowerCase();

		// .edit or .edit history -- show history listing
		if(trimmed.length === 0 || trimmedLower === "history") {
			showHistory(self);
			return;
		}

		// .edit info -- show history file path
		if(trimmedLower === "info") {
			self.output.write("Editor history file: " + EDITOR_HISTORY_PATH + "\n");
			self.displayPrompt();
			return;
		}

		// .edit new -- open a fresh editor
		if(trimmedLower === "new") {
			openEditor(self, formatDateComment(), "Opening new editor");
			return;
		}

		// .edit N -- open history block N, or show it if prefixed with "show"
		var showMatch = trimmedLower.match(/^show\s+(\d+)$/);
		if(showMatch) {
			var showIndex = parseInt(showMatch[1], 10);
			var showBlocks = loadEditorHistory();
			if(showIndex >= 1 && showIndex <= showBlocks.length) {
				self.output.write("\n" + showBlocks[showIndex - 1] + "\n\n");
			} else {
				self.output.write("Invalid block number. Use .edit history to list blocks.\n");
			}
			self.displayPrompt();
			return;
		}

		var index = parseInt(trimmed, 10);
		if(!isNaN(index)) {
			var blocks = loadEditorHistory();
			if(index >= 1 && index <= blocks.length) {
				openEditor(self, blocks[index - 1].trim() + "\n", "Opening block " + index);
			} else {
				self.output.write("Invalid block number. Use .edit history to list blocks.\n");
				self.displayPrompt();
			}
			return;
		}

		self.output.write("Usage: .edit [new|history|info|show N|N]\n");
		self.displayPrompt();
	}

	// Execute a block's code in the REPL context
	function executeBlock(self, block) {
		var code = getCodeFromBlock(block).trim();
		runtime.eval(code + "\n", runtime.context, "run", function(err, result) {
			if(err) {
				if(err.stack) {
					self.output.write(err.stack + "\n");
				} else {
					self.output.write(String(err) + "\n");
				}
			} else if(result !== undefined) {
				self.output.write(runtime.writer(result) + "\n");
			}
			self.displayPrompt();
		});
	}

	// Find a block by word-based search in the comment line
	// Returns { matches: [...], indices: [...] }
	function findBlocksByWord(searchTerm) {
		var blocks = loadEditorHistory();
		var re = new RegExp("\\b" + searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
		var matches = [];
		var indices = [];
		for(var i = 0; i < blocks.length; i++) {
			var commentLine = blocks[i].split("\n")[0];
			if(re.test(commentLine)) {
				matches.push(blocks[i]);
				indices.push(i + 1);
			}
		}
		return { matches: matches, indices: indices };
	}

	// .run action: find a block by number or word search, confirm, then execute
	function runAction(input) {
		var self = this;
		var trimmed = input.trim();

		if(trimmed.length === 0) {
			showHistory(self);
			return;
		}

		var block = null;
		var blockLabel = "";

		var index = parseInt(trimmed, 10);
		if(!isNaN(index) && String(index) === trimmed) {
			// Numeric lookup
			var blocks = loadEditorHistory();
			if(index >= 1 && index <= blocks.length) {
				block = blocks[index - 1];
				blockLabel = "block " + index;
			} else {
				self.output.write("Invalid block number. Use .edit to list blocks.\n");
				self.displayPrompt();
				return;
			}
		} else {
			// Word-based search
			var result = findBlocksByWord(trimmed);
			if(result.matches.length === 0) {
				self.output.write("No blocks matching '" + trimmed + "' found.\n");
				self.displayPrompt();
				return;
			}
			if(result.matches.length > 1) {
				self.output.write("Multiple blocks match '" + trimmed + "':\n");
				for(var i = 0; i < result.matches.length; i++) {
					var dateLine = getDateFromBlock(result.matches[i]);
					var code = getCodeFromBlock(result.matches[i]);
					var firstCodeLine = code.split("\n")[0];
					self.output.write("[" + result.indices[i] + "] " + dateLine + " " + firstCodeLine + "\n");
				}
				self.output.write("Please be more specific or use .run <number>.\n");
				self.displayPrompt();
				return;
			}
			block = result.matches[0];
			blockLabel = "block " + result.indices[0];
		}

		// Show the block and ask for confirmation
		self.output.write("\n" + block + "\n\n");
		runtime.question("Run " + blockLabel + "? (Y/n) ", function(answer) {
			var a = answer.trim().toLowerCase();
			if(a === "" || a === "y") {
				self.output.write("\n");
				executeBlock(self, block);
			} else {
				self.output.write("Cancelled.\n");
				self.displayPrompt();
			}
		});
	}

	// Remove built-in .load, .save and .editor commands (replaced by .edit)
	delete runtime.commands.load;
	delete runtime.commands.save;
	delete runtime.commands.editor;

	// Define .h as a shortcut for .help
	runtime.defineCommand("h", {
		help: "Show help (same as .help)",
		action: runtime.commands.help.action
	});

	// Define .edit command
	runtime.defineCommand("edit", {
		help: "Multi-line editor. Usage: .edit [new|history|info|show N|N]",
		action: editAction
	});

	// Define .run command
	runtime.defineCommand("run", {
		help: "List or run editor blocks. Usage: .run [N|<search term>]",
		action: runAction
	});

	// Define .ls command (list blocks, optionally filtered by search term)
	runtime.defineCommand("ls", {
		help: "List editor blocks. Usage: .ls [<search term>]",
		action: function(input) {
			var self = this;
			var trimmed = input.trim();
			if(trimmed.length === 0) {
				showHistory(self);
				return;
			}
			var result = findBlocksByWord(trimmed);
			if(result.matches.length === 0) {
				self.output.write("No blocks matching '" + trimmed + "' found.\n");
			} else {
				for(var i = 0; i < result.matches.length; i++) {
					var dateLine = getDateFromBlock(result.matches[i]);
					var code = getCodeFromBlock(result.matches[i]);
					var firstCodeLine = code.split("\n")[0];
					var lineCount = code.trim().split("\n").length;
					self.output.write("[" + result.indices[i] + "] " + dateLine + " (" + lineCount + " lines) " + firstCodeLine + "\n");
				}
			}
			self.displayPrompt();
		}
	});

	// Define .cat command (show a block without opening the editor)
	runtime.defineCommand("cat", {
		help: "Display an editor block. Usage: .cat <N>",
		action: function(input) {
			var self = this;
			var index = parseInt(input.trim(), 10);
			if(isNaN(index)) {
				self.output.write("Usage: .cat <N>\n");
				self.displayPrompt();
				return;
			}
			var blocks = loadEditorHistory();
			if(index >= 1 && index <= blocks.length) {
				self.output.write("\n" + blocks[index - 1] + "\n\n");
			} else {
				self.output.write("Invalid block number. Use .ls to list blocks.\n");
			}
			self.displayPrompt();
		}
	});
};
