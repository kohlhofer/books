# How This Book Shelf Website Works

## Overview
This is a personal book collection website that displays books organized by category, author, and other criteria. It's built as a **static website** - meaning all the pages are pre-generated and don't require a database or server to run.

## How It's Built

### 1. Data Storage
- **CSV Files**: All book information is stored in simple spreadsheet files (`.csv`) in the `books/` folder
- **Book Details**: Each book has information like title, author, category, type (book/audiobook), and location
- **Automatic Discovery**: The build script automatically finds and processes any CSV files in the `books/` folder
- **Current Files**:
  - `library.csv` - Main book collection
  - `kindle.csv` - Kindle books
  - `audible.csv` - Audiobooks
  - `river.csv` - Additional books (merged from multiple smaller files)

### 2. Building Process
The website uses a **build script** (`build-handlebars.js`) that:
1. **Reads** all the CSV files
2. **Processes** the data (creates links, generates categories, assigns colors)
3. **Generates** HTML pages using templates
4. **Outputs** everything to a `dist/` folder

### 3. Templates
The site uses **Handlebars.js** templates (`.hbs` files) that act like reusable blueprints:
- **Layout Template** (`main.hbs`) - The overall page structure
- **Book Card Template** (`book-card.hbs`) - How each individual book is displayed
- **Page Templates** - Specific layouts for different page types (categories, authors, etc.)

### 4. Styling
- **Tailwind CSS**: A utility-first CSS framework that makes styling quick and consistent
- **Dynamic Category Colors**: Colors are automatically assigned to categories at build time based on book count (most books get first color, etc.)
- **Color Palette**: 18 predefined color schemes that loop if there are more categories than colors
- **Responsive Design**: The site works on both desktop and mobile devices

## How It Works for Users

### 1. Main Page (All Books)
- Shows all books in a grid layout
- **Search Bar**: Type to find books by title, author, or category
- **Filter Dropdown**: Choose to see only certain types of books
- **Sort Options**: Arrange books by title, author, or count

### 2. Category Pages
- **Categories Listing** (`/categories.html`): Shows all available categories with book counts
- **Individual Category Pages** (`/categories/fantasy.html`): Shows all books in a specific category
- Each category page has its own color theme and search/sort functionality

### 3. Author Pages
- **Authors Listing** (`/authors.html`): Shows all authors with book counts
- **Individual Author Pages** (`/authors/jk-rowling.html`): Shows all books by a specific author
- Authors are sorted by last name, then first name

### 4. Book Cards
Each book is displayed as a card showing:
- **Top Strip**: Category name and book type (with icons)
- **Main Area**: Book title and author name
- **Bottom Badge**: Location (like "LIBRARY" or "KINDLE")
- **Interactive Elements**: Clickable category and author links

## Technical Details

### File Structure
```
book-shelf/
├── books/           # CSV data files
├── templates/       # Handlebars templates
├── build-handlebars.js  # Build script
├── dist/           # Generated website (output)
└── package.json    # Project configuration
```

### Key Technologies
- **Node.js**: Runs the build script
- **Handlebars.js**: Template engine for generating HTML
- **Tailwind CSS**: Styling framework
- **Vanilla JavaScript**: Handles search, filtering, and sorting on the client side

### Build Commands
- `npm run build` - Builds the entire site
- `npm run dev` - Starts a local development server
- `npm run build:prod` - Builds for production deployment

## Deployment
The site is automatically deployed to GitHub Pages whenever changes are pushed to the main branch. The build process creates optimized files that work in any web browser without requiring special software.

## Why This Approach?
- **Simple**: No complex databases or server setup
- **Fast**: All pages are pre-generated and load instantly
- **Reliable**: Fewer moving parts means fewer things that can break
- **Portable**: Can be hosted anywhere that serves static files
- **Maintainable**: Easy to update by editing CSV files and rebuilding

## Making Changes
To add or modify books:
1. Edit the appropriate CSV file
2. Run `npm run build` to regenerate the site
3. Commit and push changes to deploy automatically

The website automatically updates categories, author lists, and all related pages when the data changes.
