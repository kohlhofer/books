#!/usr/bin/env python3
import csv
import re

def parse_kindle_raw(filename):
    """Parse the kindle_raw file and return a list of books"""
    books = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:  # Skip empty lines
            i += 1
            continue
            
        # This line should be the title
        title = line
        
        # Next line should be the author(s)
        if i + 1 < len(lines):
            author_line = lines[i + 1].strip()
            if author_line and not author_line.startswith('The ') and not author_line.startswith('Mockingjay'):
                # This looks like an author line
                authors = author_line.split(';')
                # Take the first author for now
                author = authors[0].strip()
                
                # Split author into first and last name
                author_parts = author.split(',')
                if len(author_parts) >= 2:
                    last_name = author_parts[0].strip()
                    first_name = author_parts[1].strip()
                else:
                    first_name = author
                    last_name = ''
                
                # Create book entry
                book = {
                    'FirstName': first_name,
                    'LastName': last_name,
                    'Title': title,
                    'Category': 'Unknown',  # Will need manual classification
                    'Language': 'English',  # Default assumption
                    'Location': 'Kindle',
                    'Type': 'book'
                }
                books.append(book)
                
                i += 2  # Skip both title and author lines
            else:
                # This might be a continuation of the title or something else
                i += 1
        else:
            i += 1
    
    return books

def write_csv(books, filename):
    """Write books to CSV file"""
    fieldnames = ['FirstName', 'LastName', 'Title', 'Category', 'Language', 'Location', 'Type']
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for book in books:
            writer.writerow(book)

if __name__ == '__main__':
    print("Parsing kindle_raw file...")
    books = parse_kindle_raw('kindle_raw')
    print(f"Found {len(books)} books")
    
    print("Writing to kindle.csv...")
    write_csv(books, 'books/kindle.csv')
    print("Done!")
    
    # Show first few books
    print("\nFirst 5 books:")
    for i, book in enumerate(books[:5]):
        print(f"{i+1}. {book['FirstName']} {book['LastName']} - {book['Title']}") 