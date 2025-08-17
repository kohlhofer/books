#!/usr/bin/env python3
"""
Fix remaining CSV parsing issues by properly quoting titles with commas
and ensuring correct field mapping for all CSV files.
"""
import csv
import os
import re

def fix_csv_file_comprehensive(filepath):
    print(f"Fixing {filepath}...")
    
    # Read the file content
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    if not lines:
        return
    
    headers = lines[0].split(',')
    print(f"  Headers: {headers}")
    
    # Find the title column index
    title_index = None
    for i, header in enumerate(headers):
        if header.strip() == 'Title':
            title_index = i
            break
    
    if title_index is None:
        print(f"  No Title column found in {filepath}")
        return
    
    fixed_lines = [lines[0]]  # Keep the header
    fixed_count = 0
    
    for line_num, line in enumerate(lines[1:], 1):
        if not line.strip():
            continue
        
        parts = line.split(',')
        
        # If we have more fields than expected, the title likely contains commas
        if len(parts) > len(headers):
            # Reconstruct the line properly
            if filepath.endswith('library.csv') or 'image' in filepath:
                # For library/image files: FirstName,LastName,Title,Category,Language,Location,Type
                if len(parts) >= 7:
                    firstName = parts[0]
                    lastName = parts[1]
                    
                    # Find where the title ends by looking for the expected pattern at the end
                    # The last 4 fields should be: Category,Language,Location,Type
                    title_end_index = len(parts) - 4
                    title_text = ','.join(parts[2:title_end_index])
                    
                    # Get the last 4 fields
                    category = parts[-4]
                    language = parts[-3]
                    location = parts[-2]
                    book_type = parts[-1]
                    
                    # Fix the location if it's wrong
                    if 'Kindle' in filepath:
                        location = 'Kindle'
                    elif 'audible' in filepath:
                        location = 'Audible'
                    elif 'library' in filepath or 'image' in filepath:
                        location = 'library'
                    
                    # Fix the type if it's wrong
                    if 'audible' in filepath:
                        book_type = 'Audiobook'
                    else:
                        book_type = 'book'
                    
                    fixed_line = f'{firstName},{lastName},"{title_text}",{category},{language},{location},{book_type}'
                    fixed_count += 1
                    print(f"  Line {line_num}: Fixed broken parsing - Title: {title_text[:50]}...")
                else:
                    fixed_line = line
            else:
                # For other files, just quote the title
                title_text = ','.join(parts[title_index:len(headers)-1])
                after_title = parts[len(headers)-1] if len(parts) > len(headers)-1 else ''
                fixed_line = f'{",".join(parts[:title_index])},"{title_text}",{after_title}'
                fixed_count += 1
                print(f"  Line {line_num}: Fixed title with commas")
        else:
            fixed_line = line
        
        fixed_lines.append(fixed_line)
    
    # Write the fixed content back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"  Fixed {filepath} - {fixed_count} lines corrected")

def main():
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
    
    print("\nStarting comprehensive fixes...")
    for csv_file in csv_files:
        filepath = os.path.join(books_dir, csv_file)
        try:
            fix_csv_file_comprehensive(filepath)
        except Exception as e:
            print(f"  Error fixing {csv_file}: {e}")
    
    print("\nAll CSV files have been fixed!")
    print("Now you can rebuild the website with: npm run build")

if __name__ == '__main__':
    main() 