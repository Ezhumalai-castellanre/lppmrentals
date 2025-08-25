#!/bin/bash

echo "=== Converting all @/ path alias imports to relative imports ==="

# Find all TypeScript and TSX files
find src -name "*.ts" -o -name "*.tsx" | while read -r file; do
    echo "Processing: $file"
    
    # Convert @/ imports to relative imports
    # This is a simplified approach - for production use, you might want more sophisticated path resolution
    
    # Get the directory depth of the file
    dir_depth=$(echo "$file" | tr -cd '/' | wc -c)
    
    # Create the relative path prefix
    if [ "$dir_depth" -eq 1 ]; then
        # File is directly in src/
        prefix="./"
    else
        # File is in a subdirectory, need to go up
        up_count=$((dir_depth - 1))
        prefix=$(printf "../%.0s" $(seq 1 $up_count))
    fi
    
    # Replace @/ imports with relative imports
    sed -i "s|@/components/|${prefix}components/|g" "$file"
    sed -i "s|@/pages/|${prefix}pages/|g" "$file"
    sed -i "s|@/hooks/|${prefix}hooks/|g" "$file"
    sed -i "s|@/lib/|${prefix}lib/|g" "$file"
    sed -i "s|@/config/|${prefix}config/|g" "$file"
    sed -i "s|@/types/|${prefix}types/|g" "$file"
    sed -i "s|@/contexts/|${prefix}contexts/|g" "$file"
    
    echo "  - Converted imports in $file"
done

echo "=== Import conversion completed ==="
echo "Note: You may need to manually adjust some relative paths for accuracy"
