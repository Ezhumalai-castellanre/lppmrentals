#!/usr/bin/env python3
"""
Script to convert all @/ path alias imports to relative imports
"""

import os
import re
from pathlib import Path

def get_relative_path(from_file, to_file):
    """Calculate relative path from one file to another"""
    from_path = Path(from_file).parent
    to_path = Path(to_file).parent
    
    # If both files are in the same directory
    if from_path == to_path:
        return "./"
    
    # Calculate relative path
    try:
        rel_path = os.path.relpath(to_path, from_path)
        if rel_path == ".":
            return "./"
        return f"{rel_path}/"
    except ValueError:
        # Fallback for edge cases
        return "../"

def fix_imports_in_file(file_path):
    """Fix imports in a single file"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Find all @/ imports
    import_pattern = r'@/([^"\s]+)'
    matches = re.findall(import_pattern, content)
    
    if not matches:
        return False
    
    # Get the directory of the current file
    current_dir = Path(file_path).parent
    
    # Process each import
    for match in matches:
        # Determine the target file path
        if match.startswith('components/'):
            target_path = f"src/{match}"
        elif match.startswith('pages/'):
            target_path = f"src/{match}"
        elif match.startswith('hooks/'):
            target_path = f"src/{match}"
        elif match.startswith('lib/'):
            target_path = f"src/{match}"
        elif match.startswith('config/'):
            target_path = f"src/{match}"
        elif match.startswith('types/'):
            target_path = f"src/{match}"
        elif match.startswith('contexts/'):
            target_path = f"src/{match}"
        else:
            # Handle other cases
            target_path = f"src/{match}"
        
        # Calculate relative path
        relative_path = get_relative_path(file_path, target_path)
        
        # Replace the import
        old_import = f"@/{match}"
        new_import = f"{relative_path}{match}"
        
        # Handle special cases for UI components
        if match.startswith('components/ui/'):
            # If we're already in a components directory, use relative path
            if 'components/' in str(current_dir):
                new_import = f"./ui/{match.split('/')[-1]}"
            else:
                new_import = f"../components/ui/{match.split('/')[-1]}"
        
        content = content.replace(old_import, new_import)
        print(f"  - {old_import} -> {new_import}")
    
    # Write the file if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Main function to process all files"""
    src_dir = Path("src")
    
    if not src_dir.exists():
        print("Error: src directory not found")
        return
    
    # Find all TypeScript and TSX files
    ts_files = list(src_dir.rglob("*.ts")) + list(src_dir.rglob("*.tsx"))
    
    print(f"Found {len(ts_files)} TypeScript/TSX files")
    
    fixed_count = 0
    
    for file_path in ts_files:
        if fix_imports_in_file(file_path):
            fixed_count += 1
    
    print(f"\nFixed imports in {fixed_count} files")
    print("Import conversion completed!")

if __name__ == "__main__":
    main()
