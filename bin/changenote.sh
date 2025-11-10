#!/bin/bash

# TiddlyWiki Change Note Management Script
# Usage:
#   changenote.sh check-needs <files...>  - Check if files require change notes
#   changenote.sh validate <files...>     - Validate change note format
#   changenote.sh parse <files...>        - Parse and generate summary

# Define valid values according to "Release Notes and Changes.tid"
VALID_TYPES=("bugfix" "feature" "enhancement" "deprecation" "security" "pluginisation")
VALID_CATEGORIES=("internal" "translation" "plugin" "widget" "filters" "usability" "palette" "hackability" "nodejs" "performance" "developer")

# Type emoji mapping
declare -A TYPE_EMOJI=(
    ["bugfix"]="🐛"
    ["feature"]="✨"
    ["enhancement"]="⚡"
    ["deprecation"]="⚠️"
    ["security"]="🔒"
    ["pluginisation"]="🔌"
)

# Category emoji mapping
declare -A CATEGORY_EMOJI=(
    ["internal"]="🔧"
    ["translation"]="🌐"
    ["plugin"]="🔌"
    ["widget"]="📦"
    ["filters"]="🔍"
    ["usability"]="👥"
    ["palette"]="🎨"
    ["hackability"]="🛠️"
    ["nodejs"]="💻"
    ["performance"]="⚡"
    ["developer"]="👨‍💻"
)

# Function: Check if files need change notes
# Returns 0 if needs change note, 1 if not needed
check_needs_changenote() {
    local all_files="$@"
    
    if [ -z "$all_files" ]; then
        echo "No files provided"
        return 1
    fi
    
    for file in $all_files; do
        # Skip GitHub workflows/configs
        [[ "$file" =~ ^\.github/ ]] && continue
        [[ "$file" =~ ^\.vscode/ ]] && continue
        
        # Skip config files
        [[ "$file" =~ ^\.editorconfig$ ]] && continue
        [[ "$file" =~ ^\.gitignore$ ]] && continue
        [[ "$file" =~ ^LICENSE$ ]] && continue
        
        # Skip markdown files (except readme.md)
        [[ "$file" =~ \.md$ ]] && [[ ! "$file" =~ /readme\.md$ ]] && continue
        
        # Skip documentation in bin folder
        [[ "$file" =~ ^bin/.*\.md$ ]] && continue
        
        # Skip test results and reports
        [[ "$file" =~ ^playwright-report/ ]] && continue
        [[ "$file" =~ ^test-results/ ]] && continue
        
        # Skip documentation editions
        [[ "$file" =~ ^editions/.*-docs?/ ]] && continue
        
        # Check if it's a tiddler file
        if [[ "$file" =~ ^editions/.*/tiddlers/.*\.tid$ ]]; then
            # Core modules, plugins should require change notes
            [[ "$file" =~ /(core|plugin\.info|modules)/ ]] && echo "✓ Code file: $file" && return 0
            
            # Release notes themselves don't require additional notes
            [[ "$file" =~ /releasenotes/ ]] && continue
            
            # Other tiddlers are documentation
            continue
        fi
        
        # If we reach here, it's a code file that needs a change note
        echo "✓ Code file requires change note: $file"
        return 0
    done
    
    # All files are documentation/config
    echo "✓ Only documentation/configuration changes"
    return 1
}

# Function: Validate change note format
validate_changenotes() {
    local files="$@"
    local has_errors=false
    local error_details=""
    
    if [ -z "$files" ]; then
        echo "No change note files to validate."
        return 0
    fi
    
    for file in $files; do
        echo "Validating: $file"
        
        # Check if file exists
        if [ ! -f "$file" ]; then
            echo "::error file=$file::File not found"
            has_errors=true
            continue
        fi
        
        # Check if it's a changenote file
        if [[ ! "$file" =~ editions/.*/tiddlers/releasenotes/.* ]]; then
            continue
        fi
        
        # Extract metadata from the .tid file
        title=$(grep -m 1 "^title: " "$file" | sed 's/^title: //')
        tags=$(grep -m 1 "^tags: " "$file" | sed 's/^tags: //')
        change_type=$(grep -m 1 "^change-type: " "$file" | sed 's/^change-type: //')
        change_category=$(grep -m 1 "^change-category: " "$file" | sed 's/^change-category: //')
        description=$(grep -m 1 "^description: " "$file" | sed 's/^description: //')
        
        # Track errors for this file
        file_has_errors=false
        file_errors=""
        
        # Validate title format
        if [[ ! "$title" =~ ^\$:/changenotes/[0-9]+\.[0-9]+\.[0-9]+/(#[0-9]+|[a-f0-9]{40})$ ]]; then
            echo "::error file=$file::Invalid title format"
            file_errors+="- Title format: Expected \`\$:/changenotes/<version>/<#issue or commit-hash>\`, found: \`$title\`\n"
            has_errors=true
            file_has_errors=true
        fi
        
        # Validate tags
        if [[ -z "$tags" ]]; then
            echo "::error file=$file::Missing 'tags' field"
            file_errors+="- Missing field: \`tags\` field is required\n"
            has_errors=true
            file_has_errors=true
        elif [[ ! "$tags" =~ \$:/tags/ChangeNote ]]; then
            echo "::error file=$file::Tags must include '\$:/tags/ChangeNote'"
            file_errors+="- Tags: Must include \`\$:/tags/ChangeNote\`, found: \`$tags\`\n"
            has_errors=true
            file_has_errors=true
        fi
        
        # Validate change-type
        if [[ -z "$change_type" ]]; then
            echo "::error file=$file::Missing 'change-type' field"
            file_errors+="- Missing field: \`change-type\` is required. Valid values: \`${VALID_TYPES[*]}\`\n"
            has_errors=true
            file_has_errors=true
        else
            valid=false
            for type in "${VALID_TYPES[@]}"; do
                [[ "$change_type" == "$type" ]] && valid=true && break
            done
            if [[ "$valid" == "false" ]]; then
                echo "::error file=$file::Invalid change-type '$change_type'"
                file_errors+="- Invalid change-type: \`$change_type\` is not valid. Must be one of: \`${VALID_TYPES[*]}\`\n"
                has_errors=true
                file_has_errors=true
            fi
        fi
        
        # Validate change-category
        if [[ -z "$change_category" ]]; then
            echo "::error file=$file::Missing 'change-category' field"
            file_errors+="- Missing field: \`change-category\` is required. Valid values: \`${VALID_CATEGORIES[*]}\`\n"
            has_errors=true
            file_has_errors=true
        else
            valid=false
            for category in "${VALID_CATEGORIES[@]}"; do
                [[ "$change_category" == "$category" ]] && valid=true && break
            done
            if [[ "$valid" == "false" ]]; then
                echo "::error file=$file::Invalid change-category '$change_category'"
                file_errors+="- Invalid change-category: \`$change_category\` is not valid. Must be one of: \`${VALID_CATEGORIES[*]}\`\n"
                has_errors=true
                file_has_errors=true
            fi
        fi
        
        # Validate description
        if [[ -z "$description" ]]; then
            echo "::error file=$file::Missing 'description' field"
            file_errors+="- Missing field: \`description\` is required\n"
            has_errors=true
            file_has_errors=true
        fi
        
        # Collect errors
        if [[ "$file_has_errors" == "true" ]]; then
            error_details+="### 📄 \`$file\`\n\n$file_errors\n"
        else
            echo "✓ $file is valid"
        fi
    done
    
    # Output error details to file for GitHub Actions
    if [[ "$has_errors" == "true" ]]; then
        echo -e "$error_details" > /tmp/validation_errors.md
        echo ""
        echo "================================"
        echo "Change note validation failed!"
        echo "================================"
        echo ""
        echo "Please ensure your change notes follow the format specified in:"
        echo "https://tiddlywiki.com/prerelease/#Release%20Notes%20and%20Changes"
        return 1
    else
        echo ""
        echo "✓ All change notes are valid!"
        return 0
    fi
}

# Function: Parse change notes and generate summary
parse_changenotes() {
    local files="$@"
    
    if [ -z "$files" ]; then
        return 0
    fi
    
    for file in $files; do
        [ ! -f "$file" ] && continue
        
        # Parse metadata
        title=""
        description=""
        change_type=""
        change_category=""
        links=""
        in_body=false
        body_first_line=""
        
        while IFS= read -r line; do
            # Empty line marks start of body
            if [ -z "$line" ] && [ "$in_body" = false ]; then
                in_body=true
                continue
            fi
            
            if [ "$in_body" = false ]; then
                # Parse metadata
                [[ "$line" =~ ^title:\ (.*)$ ]] && title="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^description:\ (.*)$ ]] && description="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^change-type:\ (.*)$ ]] && change_type="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^change-category:\ (.*)$ ]] && change_category="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^links:\ (.*)$ ]] && links="${BASH_REMATCH[1]}"
            elif [ -z "$description" ] && [ -n "$line" ] && [ -z "$body_first_line" ]; then
                # Use first non-empty body line if no description in metadata
                body_first_line="$line"
            fi
        done < "$file"
        
        # Use body first line as description if needed
        [ -z "$description" ] && [ -n "$body_first_line" ] && description="$body_first_line"
        
        # Get emojis
        type_icon="${TYPE_EMOJI[$change_type]:-📝}"
        cat_icon="${CATEGORY_EMOJI[$change_category]:-📋}"
        
        # Output markdown
        echo "### ${type_icon} ${title:-$file}"
        echo ""
        echo "**Type:** ${change_type} | **Category:** ${change_category} ${cat_icon}"
        echo ""
        
        [ -n "$description" ] && echo "> ${description}" && echo ""
        [ -n "$links" ] && echo "🔗 [${links}](${links})" && echo ""
        
        echo "---"
        echo ""
    done
}

# Main command dispatcher
case "${1:-}" in
    check-needs)
        shift
        check_needs_changenote "$@"
        ;;
    validate)
        shift
        validate_changenotes "$@"
        ;;
    parse)
        shift
        parse_changenotes "$@"
        ;;
    *)
        echo "Usage: $0 {check-needs|validate|parse} <files...>"
        echo ""
        echo "Commands:"
        echo "  check-needs  Check if files require change notes"
        echo "  validate     Validate change note format"
        echo "  parse        Parse and generate summary"
        exit 1
        ;;
esac
