#!/usr/bin/env python3
"""
Script to fix duplicate path issues like ../../hooks/hooks/use-mobile -> ../../hooks/use-mobile
"""

import os
import re
from pathlib import Path

def fix_duplicate_paths_in_file(file_path):
    """Fix duplicate path issues in a single file"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix duplicate paths
    # Fix ../../hooks/hooks/ -> ../../hooks/
    content = re.sub(r'\.\./\.\./hooks/hooks/', '../../hooks/', content)
    content = re.sub(r'\.\./hooks/hooks/', '../hooks/', content)
    
    # Fix ../../lib/lib/ -> ../../lib/
    content = re.sub(r'\.\./\.\./lib/lib/', '../../lib/', content)
    content = re.sub(r'\.\./lib/lib/', '../lib/', content)
    
    # Fix ../../components/components/ -> ../../components/
    content = re.sub(r'\.\./\.\./components/components/', '../../components/', content)
    content = re.sub(r'\.\./components/components/', '../components/', content)
    
    # Fix ../components/components/ -> ../components/
    content = re.sub(r'\.\./components/components/', '../components/', content)
    
    # Fix ../lib/lib/ -> ../lib/
    content = re.sub(r'\.\./lib/lib/', '../lib/', content)
    
    # Fix ../hooks/hooks/ -> ../hooks/
    content = re.sub(r'\.\./hooks/hooks/', '../hooks/', content)
    
    # Write the file if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  - Fixed duplicate paths")
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
        if fix_duplicate_paths_in_file(file_path):
            fixed_count += 1
    
    print(f"\nFixed duplicate paths in {fixed_count} files")
    print("Duplicate path fixing completed!")

if __name__ == "__main__":
    main()
