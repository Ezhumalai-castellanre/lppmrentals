#!/usr/bin/env python3
"""
Script to fix incorrect "./ui/" imports in UI component files
"""

import os
import re
from pathlib import Path

def fix_ui_imports_in_file(file_path):
    """Fix incorrect ./ui/ imports in a single file"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix ./ui/ imports to ./
    content = re.sub(r'from "\./ui/([^"]+)"', r'from "./\1"', content)
    content = re.sub(r"from '\./ui/([^']+)'", r"from './\1'", content)
    
    # Write the file if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  - Fixed ./ui/ imports")
        return True
    
    return False

def main():
    """Main function to process all UI component files"""
    ui_dir = Path("src/components/ui")
    
    if not ui_dir.exists():
        print("Error: UI components directory not found")
        return
    
    # Find all TypeScript and TSX files in the UI directory
    ui_files = list(ui_dir.rglob("*.ts")) + list(ui_dir.rglob("*.tsx"))
    
    print(f"Found {len(ui_files)} UI component files")
    
    fixed_count = 0
    
    for file_path in ui_files:
        if fix_ui_imports_in_file(file_path):
            fixed_count += 1
    
    print(f"\nFixed ./ui/ imports in {fixed_count} files")
    print("UI import fixing completed!")

if __name__ == "__main__":
    main()
