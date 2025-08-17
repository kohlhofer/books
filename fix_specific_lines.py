#!/usr/bin/env python3
"""
Fix specific problematic lines in CSV files by correcting malformed quotes and commas.
"""
import os

def fix_specific_lines():
    print("Fixing specific problematic lines in CSV files...")
    
    # Fix library.csv specific lines
    library_file = 'books/library.csv'
    if os.path.exists(library_file):
        print(f"Fixing {library_file}...")
        
        with open(library_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Fix specific problematic lines
        fixes = [
            (6, 'Susan,Sully,"The allure of Charleston : houses, rooms, and gardens",Unknown,Unknown,library,book\n'),
            (7, 'Gil,Schafer,"A place to call home : tradition, style, and memory in the new American house",Unknown,Unknown,library,book\n'),
            (13, 'Chris,Mitchell,"Patina modern : a guide to designing warm, timeless interiors",Unknown,Unknown,library,book\n'),
            (34, 'June,Reese,"Iconic home : interiors, advice, and stories from 50 amazing Black designers",Unknown,Unknown,library,book\n'),
            (39, 'Fabien,Toulmé,"Hakim\'s odyssey. Book 1, From Syria to Turkey",Unknown,Unknown,library,book\n'),
            (40, 'Fabien,Toulmé,"Hakim\'s Odyssey. Book 2, From Turkey to Greece",Unknown,Unknown,library,book\n'),
            (45, 'Kelli,Lamb,"Home with Rue : a well-done home, for everyone",Unknown,Unknown,library,book\n'),
            (51, 'Pam,Penick,"Lawn gone! : low-maintenance, sustainable, attractive alternatives for your yard",Unknown,Unknown,library,book\n'),
            (57, 'Anita,Yokota,"Home therapy : interior design for increasing happiness, boosting confidence, and creating calm",Unknown,Unknown,library,book\n'),
            (72, 'Mark,Wolfe,"Ultimate guide to walks, patios & walls : plan, design, build",Unknown,Unknown,library,book\n'),
            (74, 'Luke,Caldwell,"Americana soul : homes designed with love, comfort, and intention",Unknown,Unknown,library,book\n'),
            (88, 'Andrew,Cogar,"Visions of home : timeless design, modern sensibility",Unknown,Unknown,library,book\n'),
            (96, 'Carley,Summers,"Sacred spaces : everyday people and the beautiful homes created out of their trials, healing, and victories",Unknown,Unknown,library,book\n'),
            (103, 'Unknown,"The complete guide to landscape projects : natural landscape design, eco-friendly water features, hardscaping, landscape painting",Unknown,Unknown,library,book\n'),
            (113, 'Ariel,Magidson,"Your space, made simple : recipes for approachable, affordable, and sustainable interior design",Unknown,Unknown,library,book\n'),
            (140, 'Dana,Simpson,"Phoebe and her unicorn. another Phoebe and her unicorn adventure / 13, Unicorn famous",Unknown,Unknown,library,book\n'),
            (141, 'Dana,Simpson,"Phoebe and her unicorn. another Phoebe and her unicorn adventure / 15, Unicorn selfies",Unknown,Unknown,library,book\n'),
            (142, 'Emily,Henderson,"Styled : secrets for arranging rooms, from tabletops to bookshelves",Unknown,Unknown,library,book\n'),
            (143, 'Emily,Henderson,"The new design rules : how to decorate and renovate, from start to finish",Unknown,Unknown,library,book\n'),
            (147, 'Shira,Gill,"Minimalista : your step-by-step guide to a better home, better wardrobe, and better life",Unknown,Unknown,library,book\n'),
            (154, 'Keith,Thomson,"Born to be hanged : the epic story of the gentlemen pirates who raided the south seas, rescued a princess, and stole a fortune",Unknown,Unknown,library,book\n'),
            (155, 'Sam,Turnbull,"Fuss-free vegan : 101 everyday comfort food favorites, veganized",Unknown,Unknown,library,book\n'),
            (174, 'Henry,Horenstein,"Make better pictures : truth, opinions, and practical advice",Unknown,Unknown,library,book\n'),
            (179, 'Sandra,Markle,"The long, long journey : the godwit\'s amazing migration",Unknown,Unknown,library,book\n'),
            (230, 'Neal,Stephenson,"Fall, or, Dodge in hell : a novel",Unknown,Unknown,library,book\n'),
        ]
        
        for line_num, fixed_line in fixes:
            if line_num < len(lines):
                lines[line_num] = fixed_line
                print(f"  Fixed line {line_num}")
        
        with open(library_file, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print(f"  Fixed {len(fixes)} lines in {library_file}")
    
    print("\nAll specific fixes have been applied!")
    print("Now you can rebuild the website with: npm run build")

if __name__ == '__main__':
    fix_specific_lines() 