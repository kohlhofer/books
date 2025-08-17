#!/usr/bin/env python3
"""
Final comprehensive fix for all remaining CSV parsing issues.
This script directly corrects the malformed titles and field mappings.
"""
import os
import re

def fix_csv_file_final(filepath):
    print(f"Final fix for {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    if not lines:
        return
    
    headers = lines[0].split(',')
    fixed_lines = [lines[0]]
    fixed_count = 0
    
    for line_num, line in enumerate(lines[1:], 1):
        if not line.strip():
            continue
        
        # Check if this line has malformed parsing (more fields than expected)
        parts = line.split(',')
        
        if len(parts) > len(headers):
            # This line has broken parsing, fix it
            if filepath.endswith('library.csv') or 'image' in filepath:
                # For library/image files: FirstName,LastName,Title,Category,Language,Location,Type
                if len(parts) >= 7:
                    firstName = parts[0]
                    lastName = parts[1]
                    
                    # Find where the title ends by looking for the expected pattern at the end
                    # The last 4 fields should be: Category,Language,Location,Type
                    title_end_index = len(parts) - 4
                    title_text = ','.join(parts[2:title_end_index])
                    
                    # Clean up the title - remove any malformed quotes or trailing text
                    title_text = re.sub(r'",Unknown,Unknown,library,book$', '', title_text)
                    title_text = re.sub(r'^"', '', title_text)
                    title_text = re.sub(r'"$', '', title_text)
                    
                    # Get the last 4 fields
                    category = parts[-4]
                    language = parts[-3]
                    location = parts[-2]
                    book_type = parts[-1]
                    
                    # Ensure correct values
                    if 'Kindle' in filepath:
                        location = 'Kindle'
                    elif 'audible' in filepath:
                        location = 'Audible'
                    elif 'library' in filepath or 'image' in filepath:
                        location = 'library'
                    
                    if 'audible' in filepath:
                        book_type = 'Audiobook'
                    else:
                        book_type = 'book'
                    
                    # Reconstruct the line properly
                    fixed_line = f'{firstName},{lastName},"{title_text}",{category},{language},{location},{book_type}'
                    fixed_count += 1
                    print(f"  Line {line_num}: Fixed broken parsing - Title: {title_text[:50]}...")
                else:
                    fixed_line = line
            else:
                # For other files, just quote the title
                title_index = len(headers) - 1 # Assuming the title is the last field
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
    
    # Focus on the files that had issues
    target_files = ['library.csv', 'image1.csv', 'image2.csv', 'image3.csv', 'image4.csv', 
                   'image5.csv', 'image6.csv', 'image7.csv', 'image8.csv', 'image9.csv', 
                   'image10.csv', 'image11.csv', 'image12.csv']
    
    print("Applying final comprehensive CSV fixes...")
    for csv_file in target_files:
        filepath = os.path.join(books_dir, csv_file)
        if os.path.exists(filepath):
            try:
                fix_csv_file_final(filepath)
            except Exception as e:
                print(f"  Error fixing {csv_file}: {e}")
    
    print("\nAll final CSV fixes have been applied!")
    print("Now you can rebuild the website with: npm run build")

if __name__ == '__main__':
    main() 