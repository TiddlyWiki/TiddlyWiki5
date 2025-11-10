#!/usr/bin/env node

/**
 * TiddlyWiki Change Note Management Script
 * 
 * Usage:
 *   node changenote.js check-needs <files...>  - Check if files require change notes
 *   node changenote.js validate <files...>     - Validate change note format
 *   node changenote.js parse <files...>        - Parse and generate summary
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// Configuration - Edit these messages and patterns as needed
// ============================================================================

const CONFIG = {
	// File patterns to skip when checking if change notes are needed
	skipPatterns: [
		/^\.github\//,
		/^\.vscode\//,
		/^\.editorconfig$/,
		/^\.gitignore$/,
		/^LICENSE$/,
		/\.md$/,  // Skip markdown files
		/^bin\/.*\.md$/,
		/^playwright-report\//,
		/^test-results\//,
		/^editions\/.*-docs?\//,
	],
	
	// Files that require change notes
	requiresChangeNote: [
		/\/(core|plugin\.info|modules)\//,
	],
	
	// Skip release notes themselves
	skipReleaseNotes: /\/releasenotes\//,
	
	// Validation patterns
	validation: {
		titlePattern: /^\$:\/changenotes\/[0-9]+\.[0-9]+\.[0-9]+\/(#[0-9]+|[a-f0-9]{40})$/,
		releasePattern: /^[0-9]+\.[0-9]+\.[0-9]+$/,
		impactTitlePattern: /^\$:\/changenotes\/[0-9]+\.[0-9]+\.[0-9]+\/.*\/[a-z-]+\/[a-z0-9-]+$/,
	},
	
	// Field validation rules for Change Notes
	changeNoteFields: {
		title: {
			required: true,
			pattern: "titlePattern",
			errorMessage: "Title format: Expected `$:/changenotes/<version>/<#issue or commit-hash>`, found: `{value}`",
		},
		tags: {
			required: true,
			contains: "$:/tags/ChangeNote",
			errorMessage: "Tags: Must include `$:/tags/ChangeNote`, found: `{value}`",
		},
		"change-type": {
			required: true,
			validValues: "changeTypes",
			errorMessage: "Invalid change-type: `{value}` is not valid. Must be one of: `{validValues}`",
			missingMessage: "Missing field: `change-type` is required. Valid values: `{validValues}`",
		},
		"change-category": {
			required: true,
			validValues: "changeCategories",
			errorMessage: "Invalid change-category: `{value}` is not valid. Must be one of: `{validValues}`",
			missingMessage: "Missing field: `change-category` is required. Valid values: `{validValues}`",
		},
		description: {
			required: true,
			errorMessage: "Missing field: `description` is required",
		},
		release: {
			required: true,
			pattern: "releasePattern",
			errorMessage: "Invalid release format: Expected `X.Y.Z` format, found: `{value}`",
			missingMessage: "Missing field: `release` is required (e.g., `5.4.0`)",
		},
		"github-links": {
			required: true,
			errorMessage: "Missing field: `github-links` is required",
		},
		"github-contributors": {
			required: true,
			errorMessage: "Missing field: `github-contributors` is required",
		},
	},
	
	// Field validation rules for Impact Notes
	impactNoteFields: {
		title: {
			required: true,
			pattern: "impactTitlePattern",
			errorMessage: "Title format: Expected `$:/changenotes/<version>/<change-id>/<impact-type>/<identifier>`, found: `{value}`",
		},
		tags: {
			required: true,
			contains: "$:/tags/ImpactNote",
			errorMessage: "Tags: Must include `$:/tags/ImpactNote`, found: `{value}`",
		},
		"impact-type": {
			required: true,
			validValues: "impactTypes",
			errorMessage: "Invalid impact-type: `{value}` is not valid. Must be one of: `{validValues}`",
			missingMessage: "Missing field: `impact-type` is required. Valid values: `{validValues}`",
		},
		changenote: {
			required: true,
			errorMessage: "Missing field: `changenote` is required (the title of the associated change note)",
		},
		description: {
			required: true,
			errorMessage: "Missing field: `description` is required",
		},
	},
	
	// Messages
	messages: {
		validation: {
			header: "## ❌ Change Note Status\n\nChange note validation failed. Please fix the following issues:\n",
			footer: "\n---\n\n📚 **Documentation**: [Release Notes and Changes](https://tiddlywiki.com/prerelease/#Release%20Notes%20and%20Changes)",
			success: "## ✅ Change Note Status\n\nAll change notes are properly formatted and validated!\n",
		},
		missing: {
			header: "## ⚠️ Change Note Status\n\nThis PR appears to contain code changes but doesn't include a change note.\n",
			body: "Please add a change note by creating a `.tid` file in `editions/tw5.com/tiddlers/releasenotes/<version>/`\n",
			footer: "\n📚 **Documentation**: [Release Notes and Changes](https://tiddlywiki.com/prerelease/#Release%20Notes%20and%20Changes)\n\n💡 **Note**: If this is a documentation-only change, you can ignore this message.",
		},
		docOnly: "## ✅ Change Note Status\n\nThis PR contains documentation or configuration changes that typically don't require a change note.",
	},
	
	// Patterns for parsing ReleasesInfo.multids
	releasesInfoPatterns: {
		changeType: {
			caption: /^change-types\/([^/]+)\/caption:/,
			colour: /^change-types\/([^/]+)\/colour:\s*(.+)/,
		},
		category: {
			caption: /^categories\/([^/]+)\/caption:/,
			colour: /^categories\/([^/]+)\/colour:\s*(.+)/,
		},
		impactType: {
			caption: /^impact-types\/([^/]+)\/caption:/,
			colourBg: /^impact-types\/([^/]+)\/colour\/background:\s*(.+)/,
			colourFg: /^impact-types\/([^/]+)\/colour\/foreground:\s*(.+)/,
		},
	},
};

// ============================================================================
// Load validation data from ReleasesInfo.multids
// ============================================================================

function loadReleasesInfo() {
	const releasesInfoPath = path.join(__dirname, "..", "editions", "tw5.com", "tiddlers", "releasenotes", "ReleasesInfo.multids");
	
	if(!fs.existsSync(releasesInfoPath)) {
		console.error(`Error: ReleasesInfo.multids not found at ${releasesInfoPath}`);
		process.exit(1);
	}
	
	const content = fs.readFileSync(releasesInfoPath, "utf-8");
	const lines = content.split("\n");
	
	const changeTypes = new Set();
	const changeCategories = new Set();
	const impactTypes = new Set();
	const typeColors = {};
	const categoryColors = {};
	const impactColors = {};
	
	const patterns = CONFIG.releasesInfoPatterns;
	
	for(const line of lines) {
		// Parse change-types
		let match = line.match(patterns.changeType.caption);
		if(match) {
			changeTypes.add(match[1]);
		}
		
		match = line.match(patterns.changeType.colour);
		if(match) {
			typeColors[match[1]] = match[2].trim();
		}
		
		// Parse categories
		match = line.match(patterns.category.caption);
		if(match) {
			changeCategories.add(match[1]);
		}
		
		match = line.match(patterns.category.colour);
		if(match) {
			categoryColors[match[1]] = match[2].trim();
		}
		
		// Parse impact-types
		match = line.match(patterns.impactType.caption);
		if(match) {
			impactTypes.add(match[1]);
		}
		
		match = line.match(patterns.impactType.colourBg);
		if(match) {
			if(!impactColors[match[1]]) impactColors[match[1]] = {};
			impactColors[match[1]].bg = match[2].trim();
		}
		
		match = line.match(patterns.impactType.colourFg);
		if(match) {
			if(!impactColors[match[1]]) impactColors[match[1]] = {};
			impactColors[match[1]].fg = match[2].trim();
		}
	}
	
	return {
		changeTypes: Array.from(changeTypes),
		changeCategories: Array.from(changeCategories),
		impactTypes: Array.from(impactTypes),
		typeColors,
		categoryColors,
		impactColors,
	};
}

const RELEASES_INFO = loadReleasesInfo();

// ============================================================================
// Utility Functions
// ============================================================================

function parseTiddlerFile(filePath) {
	if(!fs.existsSync(filePath)) {
		return null;
	}
	
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	const fields = {};
	let bodyStartIndex = -1;
	
	// Parse metadata fields
	for(let i = 0; i < lines.length; i++) {
		const line = lines[i];
		
		// Empty line marks start of body
		if(line.trim() === "") {
			bodyStartIndex = i + 1;
			break;
		}
		
		// Parse field
		const match = line.match(/^([^:]+):\s*(.*)$/);
		if(match) {
			fields[match[1]] = match[2];
		}
	}
	
	// Get body text
	if(bodyStartIndex !== -1) {
		fields.text = lines.slice(bodyStartIndex).join("\n").trim();
	}
	
	return fields;
}

function colorText(text, color) {
	// For terminal output, we can use ANSI colors if needed
	// For now, just return the text with a badge indicator
	return `\`${text}\``;
}

/**
 * Generic field validator
 * @param {string} fieldName - The name of the field to validate
 * @param {*} fieldValue - The value of the field
 * @param {object} fieldConfig - The validation configuration for this field
 * @param {array} fileErrors - Array to push errors into
 */
function validateField(fieldName, fieldValue, fieldConfig, fileErrors) {
	// Check if field is required
	if(fieldConfig.required && !fieldValue) {
		const message = fieldConfig.missingMessage || fieldConfig.errorMessage;
		fileErrors.push(interpolateMessage(message, { value: fieldValue }));
		return;
	}
	
	if(!fieldValue) {
		return; // Field is optional and not provided
	}
	
	// Check pattern validation
	if(fieldConfig.pattern) {
		const pattern = CONFIG.validation[fieldConfig.pattern];
		if(pattern && !pattern.test(fieldValue)) {
			fileErrors.push(interpolateMessage(fieldConfig.errorMessage, { value: fieldValue }));
			return;
		}
	}
	
	// Check if field contains required substring
	if(fieldConfig.contains && !fieldValue.includes(fieldConfig.contains)) {
		fileErrors.push(interpolateMessage(fieldConfig.errorMessage, { value: fieldValue }));
		return;
	}
	
	// Check if field value is in valid values list
	if(fieldConfig.validValues) {
		const validValues = RELEASES_INFO[fieldConfig.validValues];
		if(validValues && !validValues.includes(fieldValue)) {
			fileErrors.push(interpolateMessage(fieldConfig.errorMessage, { 
				value: fieldValue,
				validValues: validValues.join(", "),
			}));
		}
	}
}

/**
 * Interpolate placeholders in message template
 * @param {string} template - Message template with {placeholder}
 * @param {object} values - Values to interpolate
 * @returns {string} Interpolated message
 */
function interpolateMessage(template, values) {
	return template.replace(/\{(\w+)\}/g, (match, key) => (values[key] !== undefined ? values[key] : match));
}

// ============================================================================
// Command: check-needs
// ============================================================================

function checkNeedsChangeNote(files) {
	if(!files || files.length === 0) {
		console.log("No files provided");
		return false;
	}
	
	for(const file of files) {
		// Skip files matching skip patterns
		if(CONFIG.skipPatterns.some(pattern => pattern.test(file))) {
			continue;
		}
		
		// Check if it's a tiddler file
		if(/^editions\/.*\/tiddlers\/.*\.tid$/.test(file)) {
			// Core modules, plugins require change notes
			if(CONFIG.requiresChangeNote.some(pattern => pattern.test(file))) {
				console.log(`✓ Code file requires change note: ${file}`);
				return true;
			}
			
			// Release notes themselves don't require additional notes
			if(CONFIG.skipReleaseNotes.test(file)) {
				continue;
			}
			
			// Other tiddlers are documentation
			continue;
		}
		
		// If we reach here, it's a code file that needs a change note
		console.log(`✓ Code file requires change note: ${file}`);
		return true;
	}
	
	// All files are documentation/config
	console.log("✓ Only documentation/configuration changes");
	return false;
}

// ============================================================================
// Command: validate
// ============================================================================

function validateChangeNotes(files) {
	if(!files || files.length === 0) {
		console.log("No change note files to validate.");
		return { success: true, errors: [] };
	}
	
	const errors = [];
	
	for(const file of files) {
		// Only validate files in releasenotes directory
		if(!/editions\/.*\/tiddlers\/releasenotes\//.test(file)) {
			continue;
		}
		
		console.log(`Validating: ${file}`);
		
		const fields = parseTiddlerFile(file);
		if(!fields) {
			errors.push({
				file,
				issues: ["File not found or cannot be read"],
			});
			continue;
		}
		
		const fileErrors = [];
		
		// Determine note type
		const tags = fields.tags || "";
		
		if(tags.includes("$:/tags/ChangeNote")) {
			// Validate Change Note
			validateChangeNote(fields, file, fileErrors);
		} else if(tags.includes("$:/tags/ImpactNote")) {
			// Validate Impact Note
			validateImpactNote(fields, file, fileErrors);
		} else {
			console.log(`Skipping non-note file: ${file}`);
			continue;
		}
		
		if(fileErrors.length > 0) {
			errors.push({ file, issues: fileErrors });
		} else {
			console.log(`✓ ${file} is valid`);
		}
	}
	
	if(errors.length > 0) {
		console.error("\n================================");
		console.error("Validation failed!");
		console.error("================================\n");
		return { success: false, errors };
	}
	
	console.log("\n✓ All notes are valid!");
	return { success: true, errors: [] };
}

function validateChangeNote(fields, file, fileErrors) {
	// Dynamically validate all configured fields
	for(const[fieldName, fieldConfig] of Object.entries(CONFIG.changeNoteFields)) {
		validateField(fieldName, fields[fieldName], fieldConfig, fileErrors);
	}
}

function validateImpactNote(fields, file, fileErrors) {
	// Dynamically validate all configured fields
	for(const[fieldName, fieldConfig] of Object.entries(CONFIG.impactNoteFields)) {
		validateField(fieldName, fields[fieldName], fieldConfig, fileErrors);
	}
}

// ============================================================================
// Command: parse
// ============================================================================

function parseChangeNotes(files) {
	if(!files || files.length === 0) {
		return "";
	}
	
	const output = [];
	
	for(const file of files) {
		if(!fs.existsSync(file)) {
			continue;
		}
		
		const fields = parseTiddlerFile(file);
		if(!fields) {
			continue;
		}
		
		const tags = fields.tags || "";
		
		if(tags.includes("$:/tags/ChangeNote")) {
			output.push(formatChangeNote(fields));
		} else if(tags.includes("$:/tags/ImpactNote")) {
			output.push(formatImpactNote(fields));
		} else {
			output.push(formatGenericNote(fields, file));
		}
	}
	
	return output.join("\n");
}

function formatChangeNote(fields) {
	const{ title, "change-type": changeType, "change-category": changeCategory, 
		description, release, "github-links": githubLinks, "github-contributors": githubContributors } = fields;
	
	const typeColor = RELEASES_INFO.typeColors[changeType];
	const categoryColor = RELEASES_INFO.categoryColors[changeCategory];
	
	let output = `### 📝 ${title || "Untitled"}\n\n`;
	
	// Type with color if available
	if(typeColor) {
		output += `<span style="background-color: ${typeColor}; padding: 2px 6px; border-radius: 3px;">**Type:** ${changeType}</span>`;
	} else {
		output += `**Type:** ${changeType}`;
	}
	
	output += " | ";
	
	// Category with color if available
	if(categoryColor) {
		output += `<span style="background-color: ${categoryColor}; padding: 2px 6px; border-radius: 3px;">**Category:** ${changeCategory}</span>\n`;
	} else {
		output += `**Category:** ${changeCategory}\n`;
	}
	
	if(release) {
		output += `**Release:** ${release}\n`;
	}
	
	output += "\n";
	
	if(description) {
		output += `> ${description}\n\n`;
	}
	
	if(githubLinks) {
		output += `🔗 ${githubLinks}\n\n`;
	}
	
	if(githubContributors) {
		output += `👥 **Contributors:** ${githubContributors}\n\n`;
	}
	
	output += "---\n";
	return output;
}

function formatImpactNote(fields) {
	const{ title, "impact-type": impactType, changenote, description } = fields;
	
	const colors = RELEASES_INFO.impactColors[impactType];
	
	let output = `### ⚠️ **Impact:** ${title || "Untitled"}\n\n`;
	
	// Only use color span if colors are defined
	if(colors && colors.bg && colors.fg) {
		output += `<span style="background-color: ${colors.bg}; color: ${colors.fg}; padding: 2px 6px; border-radius: 3px;">**Impact Type:** ${impactType}</span>\n`;
	} else {
		output += `**Impact Type:** ${impactType}\n`;
	}
	
	if(changenote) {
		output += `**Related Change:** ${changenote}\n`;
	}
	
	output += "\n";
	
	if(description) {
		output += `> ${description}\n\n`;
	}
	
	output += "---\n";
	return output;
}

function formatGenericNote(fields, file) {
	const{ title, description } = fields;
	
	let output = `### 📝 ${title || file}\n\n`;
	
	if(description) {
		output += `> ${description}\n\n`;
	}
	
	output += "---\n";
	return output;
}

// ============================================================================
// CLI Interface
// ============================================================================

function formatValidationErrors(errors) {
	let output = "";
	
	for(const{ file, issues } of errors) {
		output += `### 📄 \`${file}\`\n\n`;
		for(const issue of issues) {
			output += `- ${issue}\n`;
		}
		output += "\n";
	}
	
	return output;
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const files = args.slice(1);
	
	switch(command) {
	case "check-needs": {
		const needsNote = checkNeedsChangeNote(files);
		process.exit(needsNote ? 0 : 1);
		break;
	}
	
	case "validate": {
		const result = validateChangeNotes(files);
		
		if(!result.success) {
			// Write errors to temp file for GitHub Actions
			const errorMd = formatValidationErrors(result.errors);
			const tmpFile = "/tmp/validation_errors.md";
			
			try {
				fs.writeFileSync(tmpFile, errorMd);
			} catch(e) {
				// If /tmp doesn't exist (Windows), write to current directory
				fs.writeFileSync("./validation_errors.md", errorMd);
			}
			
			// Also output to stderr for immediate visibility
			console.error("\n" + CONFIG.messages.validation.header);
			console.error(errorMd);
			console.error(CONFIG.messages.validation.footer);
			
			process.exit(1);
		}
		
		process.exit(0);
		break;
	}
	
	case "parse": {
		const summary = parseChangeNotes(files);
		console.log(summary);
		process.exit(0);
		break;
	}
	
	default:
		console.error("Usage: node changenote.js {check-needs|validate|parse} <files...>");
		console.error("");
		console.error("Commands:");
		console.error("  check-needs  Check if files require change notes");
		console.error("  validate     Validate change note format");
		console.error("  parse        Parse and generate summary");
		process.exit(1);
	}
}

if(require.main === module) {
	main();
}

module.exports = {
	checkNeedsChangeNote,
	validateChangeNotes,
	parseChangeNotes,
	loadReleasesInfo,
};
