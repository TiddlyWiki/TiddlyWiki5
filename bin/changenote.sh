#!/bin/bash

# TiddlyWiki Change Note Management Script
# Usage:
#   changenote.sh check-needs <files...>  - Check if files require change notes
#   changenote.sh validate <files...>     - Validate change note format
#   changenote.sh parse <files...>        - Parse and generate summary

# Define valid values according to "Release Notes and Changes.tid" and "ReleasesInfo.multids"
VALID_TYPES=("bugfix" "feature" "enhancement" "deprecation" "security" "performance")
VALID_CATEGORIES=("internal" "translation" "plugin" "widget" "filters" "usability" "palette" "hackability" "nodejs" "performance" "developer")
VALID_IMPACT_TYPES=("deprecation" "compatibility-break" "pluginisation")

# Type emoji mapping
declare -A TYPE_EMOJI=(
    ["bugfix"]="🐛"
    ["feature"]="✨"
    ["enhancement"]="🧱"
    ["deprecation"]="⚠️"
    ["security"]="🔒"
    ["performance"]="⚡"
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

# Impact type emoji mapping
declare -A IMPACT_EMOJI=(
    ["deprecation"]="⚠️"
    ["compatibility-break"]="🔥"
    ["pluginisation"]="🔌"
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
        
        # Check if it's a releasenote file
        if [[ ! "$file" =~ editions/.*/tiddlers/releasenotes/.* ]]; then
            continue
        fi
        
        # Extract metadata from the .tid file
        title=$(grep -m 1 "^title: " "$file" | sed 's/^title: //')
        tags=$(grep -m 1 "^tags: " "$file" | sed 's/^tags: //')
        
        # Track errors for this file
        file_has_errors=false
        file_errors=""
        
        # Determine if it's a change note or impact note
        if [[ "$tags" =~ \$:/tags/ChangeNote ]]; then
            # Validate as Change Note
            change_type=$(grep -m 1 "^change-type: " "$file" | sed 's/^change-type: //')
            change_category=$(grep -m 1 "^change-category: " "$file" | sed 's/^change-category: //')
            description=$(grep -m 1 "^description: " "$file" | sed 's/^description: //')
            release=$(grep -m 1 "^release: " "$file" | sed 's/^release: //')
            github_links=$(grep -m 1 "^github-links: " "$file" | sed 's/^github-links: //')
            github_contributors=$(grep -m 1 "^github-contributors: " "$file" | sed 's/^github-contributors: //')
            
            # Validate title format
            if [[ ! "$title" =~ ^\$:/changenotes/[0-9]+\.[0-9]+\.[0-9]+/(#[0-9]+|[a-f0-9]{40})$ ]]; then
                echo "::error file=$file::Invalid title format"
                file_errors+="- Title format: Expected \`\$:/changenotes/<version>/<#issue or commit-hash>\`, found: \`$title\`\n"
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
            
            # Validate release
            if [[ -z "$release" ]]; then
                echo "::error file=$file::Missing 'release' field"
                file_errors+="- Missing field: \`release\` is required (e.g., \`5.4.0\`)\n"
                has_errors=true
                file_has_errors=true
            elif [[ ! "$release" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                echo "::error file=$file::Invalid release format '$release'"
                file_errors+="- Invalid release format: Expected \`X.Y.Z\` format, found: \`$release\`\n"
                has_errors=true
                file_has_errors=true
            fi
            
            # Validate github-links
            if [[ -z "$github_links" ]]; then
                echo "::error file=$file::Missing 'github-links' field"
                file_errors+="- Missing field: \`github-links\` is required\n"
                has_errors=true
                file_has_errors=true
            fi
            
            # Validate github-contributors
            if [[ -z "$github_contributors" ]]; then
                echo "::error file=$file::Missing 'github-contributors' field"
                file_errors+="- Missing field: \`github-contributors\` is required\n"
                has_errors=true
                file_has_errors=true
            fi
            
        elif [[ "$tags" =~ \$:/tags/ImpactNote ]]; then
            # Validate as Impact Note
            impact_type=$(grep -m 1 "^impact-type: " "$file" | sed 's/^impact-type: //')
            changenote=$(grep -m 1 "^changenote: " "$file" | sed 's/^changenote: //')
            description=$(grep -m 1 "^description: " "$file" | sed 's/^description: //')
            
            # Validate title format (should be like $:/changenotes/5.4.0/#8702/deprecations/darkmode-info-tiddler)
            if [[ ! "$title" =~ ^\$:/changenotes/[0-9]+\.[0-9]+\.[0-9]+/.*/[a-z-]+/[a-z0-9-]+$ ]]; then
                echo "::error file=$file::Invalid impact note title format"
                file_errors+="- Title format: Expected \`\$:/changenotes/<version>/<change-id>/<impact-type>/<identifier>\`, found: \`$title\`\n"
                has_errors=true
                file_has_errors=true
            fi
            
            # Validate impact-type
            if [[ -z "$impact_type" ]]; then
                echo "::error file=$file::Missing 'impact-type' field"
                file_errors+="- Missing field: \`impact-type\` is required. Valid values: \`${VALID_IMPACT_TYPES[*]}\`\n"
                has_errors=true
                file_has_errors=true
            else
                valid=false
                for type in "${VALID_IMPACT_TYPES[@]}"; do
                    [[ "$impact_type" == "$type" ]] && valid=true && break
                done
                if [[ "$valid" == "false" ]]; then
                    echo "::error file=$file::Invalid impact-type '$impact_type'"
                    file_errors+="- Invalid impact-type: \`$impact_type\` is not valid. Must be one of: \`${VALID_IMPACT_TYPES[*]}\`\n"
                    has_errors=true
                    file_has_errors=true
                fi
            fi
            
            # Validate changenote
            if [[ -z "$changenote" ]]; then
                echo "::error file=$file::Missing 'changenote' field"
                file_errors+="- Missing field: \`changenote\` is required (the title of the associated change note)\n"
                has_errors=true
                file_has_errors=true
            fi
            
            # Validate description
            if [[ -z "$description" ]]; then
                echo "::error file=$file::Missing 'description' field"
                file_errors+="- Missing field: \`description\` is required\n"
                has_errors=true
                file_has_errors=true
            fi
            
        else
            # Not a change note or impact note, skip validation
            echo "Skipping non-note file: $file"
            continue
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
        echo "Validation failed!"
        echo "================================"
        echo ""
        echo "Please ensure your notes follow the format specified in:"
        echo "https://tiddlywiki.com/prerelease/#Release%20Notes%20and%20Changes"
        return 1
    else
        echo ""
        echo "✓ All notes are valid!"
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
        tags=""
        change_type=""
        change_category=""
        impact_type=""
        changenote=""
        github_links=""
        github_contributors=""
        release=""
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
                [[ "$line" =~ ^tags:\ (.*)$ ]] && tags="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^description:\ (.*)$ ]] && description="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^change-type:\ (.*)$ ]] && change_type="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^change-category:\ (.*)$ ]] && change_category="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^impact-type:\ (.*)$ ]] && impact_type="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^changenote:\ (.*)$ ]] && changenote="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^release:\ (.*)$ ]] && release="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^github-links:\ (.*)$ ]] && github_links="${BASH_REMATCH[1]}"
                [[ "$line" =~ ^github-contributors:\ (.*)$ ]] && github_contributors="${BASH_REMATCH[1]}"
            elif [ -z "$description" ] && [ -n "$line" ] && [ -z "$body_first_line" ]; then
                # Use first non-empty body line if no description in metadata
                body_first_line="$line"
            fi
        done < "$file"
        
        # Use body first line as description if needed
        [ -z "$description" ] && [ -n "$body_first_line" ] && description="$body_first_line"
        
        # Determine if it's a change note or impact note
        if [[ "$tags" =~ \$:/tags/ChangeNote ]]; then
            # Output Change Note
            type_icon="${TYPE_EMOJI[$change_type]:-📝}"
            cat_icon="${CATEGORY_EMOJI[$change_category]:-📋}"
            
            echo "### ${type_icon} ${title:-$file}"
            echo ""
            echo "**Type:** ${change_type} | **Category:** ${change_category} ${cat_icon}"
            [ -n "$release" ] && echo "**Release:** ${release}"
            echo ""
            
            [ -n "$description" ] && echo "> ${description}" && echo ""
            [ -n "$github_links" ] && echo "🔗 ${github_links}" && echo ""
            [ -n "$github_contributors" ] && echo "👥 Contributors: ${github_contributors}" && echo ""
            
        elif [[ "$tags" =~ \$:/tags/ImpactNote ]]; then
            # Output Impact Note
            impact_icon="${IMPACT_EMOJI[$impact_type]:-📋}"
            
            echo "### ${impact_icon} Impact: ${title:-$file}"
            echo ""
            echo "**Impact Type:** ${impact_type}"
            [ -n "$changenote" ] && echo "**Related Change:** ${changenote}"
            echo ""
            
            [ -n "$description" ] && echo "> ${description}" && echo ""
            
        else
            # Unknown type, output basic info
            echo "### 📝 ${title:-$file}"
            echo ""
            [ -n "$description" ] && echo "> ${description}" && echo ""
        fi
        
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
