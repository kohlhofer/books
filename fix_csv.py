#!/usr/bin/env python3
"""
Fix CSV files by properly quoting titles that contain commas
"""

import csv
import os
import re

def fix_csv_file(filepath):
    """Fix a CSV file by properly quoting titles with commas"""
    print(f"Fixing {filepath}...")
    
    # Read the file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into lines
    lines = content.split('\n')
    if not lines:
        return
    
    # Get headers
    headers = lines[0].split(',')
    
    # Find the title column index
    title_index = None
    for i, header in enumerate(headers):
        if header.strip() in ['Title']:
            title_index = i
            break
    
    if title_index is None:
        print(f"  No Title column found in {filepath}")
        return
    
    # Process each line
    fixed_lines = [lines[0]]  # Keep headers as-is
    fixed_count = 0
    
    for line_num, line in enumerate(lines[1:], 1):
        if not line.strip():
            continue
            
        # Split the line
        parts = line.split(',')
        
        if len(parts) <= title_index:
            fixed_lines.append(line)
            continue
        
        # Check if title contains commas
        title = parts[title_index]
        if ',' in title:
            # For library/image files, we know the structure: FirstName,LastName,Title,Category,Language,Location,Type
            # So we can identify where the title ends by looking for the last 4 fields
            if len(parts) >= 7:
                # The last 4 fields should be Category,Language,Location,Type
                # Everything from title_index to -4 should be the title
                title_text = ','.join(parts[title_index:-4])
                after_title = ','.join(parts[-4:])
                fixed_line = f'{",".join(parts[:title_index])},"{title_text}",{after_title}'
                fixed_count += 1
                print(f"  Line {line_num}: Fixed title with commas")
            else:
                fixed_line = line
        else:
            fixed_line = line
        
        fixed_lines.append(fixed_line)
    
    # Write the fixed file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"  Fixed {filepath} - {fixed_count} titles quoted")

def main():
    """Fix all CSV files in the books directory"""
    books_dir = 'books'
    
    if not os.path.exists(books_dir):
        print(f"Books directory {books_dir} not found!")
        return
    
    csv_files = [f for f in os.listdir(books_dir) if f.endswith('.csv')]
    
    if not csv_files:
        print("No CSV files found in books directory!")
        return
    
    print(f"Found {len(csv_files)} CSV files to fix:")
    for f in csv_files:
        print(f"  - {f}")
    
    print("\nStarting fixes...")
    
    for csv_file in csv_files:
        filepath = os.path.join(books_dir, csv_file)
        try:
            fix_csv_file(filepath)
        except Exception as e:
            print(f"  Error fixing {csv_file}: {e}")
    
    print("\nAll CSV files have been fixed!")
    print("Now you can rebuild the website with: npm run build")

if __name__ == '__main__':
    main() 