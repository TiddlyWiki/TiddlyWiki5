#!/bin/bash

# Validate TiddlyWiki Change Notes
# This script validates .tid files in the releasenotes directory
# to ensure they conform to the required format specification.

# Define valid values according to "Release Notes and Changes.tid"
VALID_TYPES=("bugfix" "feature" "enhancement" "deprecation" "security" "pluginisation")
VALID_CATEGORIES=("internal" "translation" "plugin" "widget" "filters" "usability" "palette" "hackability" "nodejs" "performance" "developer")
VALID_TAGS=('$:/tags/ChangeNote' '$:/tags/ChangeNote/Deprecation' '$:/tags/ChangeNote/Breaking')

# Initialize error flag and error messages array
has_errors=false
error_details=""

# Get list of files to validate
# If files are passed as arguments, use them; otherwise check git diff
if [ $# -eq 0 ]; then
    # No arguments provided, use git to find changed files
    files=$(git diff --name-only --diff-filter=d origin/master...HEAD | grep -E "editions/.*/tiddlers/releasenotes/.*\.tid$")
else
    # Files provided as arguments
    files="$@"
fi

# Check if there are any files to validate
if [ -z "$files" ]; then
    echo "No change note files to validate."
    exit 0
fi

# Process each changed file
for file in $files; do
    echo "Validating: $file"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo "::error file=$file::File not found"
        has_errors=true
        continue
    fi
    
    # Check if it's a changenote file (should be in releasenotes directory)
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
        echo "::error file=$file::Invalid title format. Expected format: \$:/changenotes/<version>/<#issue or commit-hash>"
        echo "  Found: $title"
        file_errors+="- Title format: Expected \`\$:/changenotes/<version>/<#issue or commit-hash>\`, found: \`$title\`\n"
        has_errors=true
        file_has_errors=true
    fi
    
    # Validate tags field exists and contains required tag
    if [[ -z "$tags" ]]; then
        echo "::error file=$file::Missing 'tags' field"
        file_errors+="- Missing field: \`tags\` field is required\n"
        has_errors=true
        file_has_errors=true
    elif [[ ! "$tags" =~ \$:/tags/ChangeNote ]]; then
        echo "::error file=$file::Tags must include '\$:/tags/ChangeNote'"
        echo "  Found: $tags"
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
            if [[ "$change_type" == "$type" ]]; then
                valid=true
                break
            fi
        done
        if [[ "$valid" == "false" ]]; then
            echo "::error file=$file::Invalid change-type '$change_type'. Valid types: ${VALID_TYPES[*]}"
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
            if [[ "$change_category" == "$category" ]]; then
                valid=true
                break
            fi
        done
        if [[ "$valid" == "false" ]]; then
            echo "::error file=$file::Invalid change-category '$change_category'. Valid categories: ${VALID_CATEGORIES[*]}"
            file_errors+="- Invalid change-category: \`$change_category\` is not valid. Must be one of: \`${VALID_CATEGORIES[*]}\`\n"
            has_errors=true
            file_has_errors=true
        fi
    fi
    
    # Validate description exists
    if [[ -z "$description" ]]; then
        echo "::error file=$file::Missing 'description' field"
        file_errors+="- Missing field: \`description\` is required\n"
        has_errors=true
        file_has_errors=true
    fi
    
    # Collect errors for this file
    if [[ "$file_has_errors" == "true" ]]; then
        error_details+="### 📄 \`$file\`\n\n$file_errors\n"
    else
        echo "✓ $file is valid"
    fi
done

# Output error details to a file for GitHub Actions to read
if [[ "$has_errors" == "true" ]]; then
    echo -e "$error_details" > /tmp/validation_errors.md
fi

# Exit with error if any validation failed
if [[ "$has_errors" == "true" ]]; then
    echo ""
    echo "================================"
    echo "Change note validation failed!"
    echo "================================"
    echo ""
    echo "Please ensure your change notes follow the format specified in:"
    echo "https://tiddlywiki.com/prerelease/#Release%20Notes%20and%20Changes"
    echo ""
    echo "Required fields:"
    echo "  - title: \$:/changenotes/<version>/<#issue or commit-hash>"
    echo "  - tags: must include \$:/tags/ChangeNote"
    echo "  - change-type: one of ${VALID_TYPES[*]}"
    echo "  - change-category: one of ${VALID_CATEGORIES[*]}"
    echo "  - description: brief description of the change"
    exit 1
else
    echo ""
    echo "✓ All change notes are valid!"
    exit 0
fi
