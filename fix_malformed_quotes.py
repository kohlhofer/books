#!/usr/bin/env python3
"""
Fix malformed quotes and commas in CSV titles that are still causing parsing issues.
"""
import os
import re

def fix_malformed_quotes(filepath):
    print(f"Fixing malformed quotes in {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to find malformed titles with quotes and trailing commas
    # This matches titles like: "Title text"\",Unknown,Unknown,library,book
    pattern = r'"([^"]+)"\",Unknown,Unknown,library,book'
    
    def replace_malformed_title(match):
        title = match.group(1)
        # Clean up any extra quotes or backslashes
        title = title.replace('\\"', '"').replace('""', '"')
        return f'"{title}",Unknown,Unknown,library,book'
    
    # Apply the fix
    fixed_content = re.sub(pattern, replace_malformed_title, content)
    
    # Also fix any remaining malformed patterns
    # Look for titles that end with ",Unknown,Unknown,library,book" but shouldn't
    pattern2 = r'([^,]+)"",Unknown,Unknown,library,book'
    def replace_malformed_title2(match):
        title = match.group(1)
        return f'"{title}",Unknown,Unknown,library,book'
    
    fixed_content = re.sub(pattern2, replace_malformed_title2, fixed_content)
    
    # Write the fixed content back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"  Fixed malformed quotes in {filepath}")

def main():
    books_dir = 'books'
    if not os.path.exists(books_dir):
        print(f"Books directory {books_dir} not found!")
        return
    
    # Focus on the files that had issues
    target_files = ['library.csv', 'image1.csv', 'image2.csv', 'image3.csv', 'image4.csv', 
                   'image5.csv', 'image6.csv', 'image7.csv', 'image8.csv', 'image9.csv', 
                   'image10.csv', 'image11.csv', 'image12.csv']
    
    print("Fixing malformed quotes in CSV files...")
    for csv_file in target_files:
        filepath = os.path.join(books_dir, csv_file)
        if os.path.exists(filepath):
            try:
                fix_malformed_quotes(filepath)
            except Exception as e:
                print(f"  Error fixing {csv_file}: {e}")
    
    print("\nAll malformed quotes have been fixed!")
    print("Now you can rebuild the website with: npm run build")

if __name__ == '__main__':
    main() 