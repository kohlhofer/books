const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = './dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Helper function to generate book card HTML
function generateBookCard(book, basePath = '') {
    const authorSlug = (book.author || 'Unknown Author').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
    const categorySlug = (book.category || 'Unknown').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
    
    return `
        <div class="book-card">
            <div class="book-header">
                <span class="book-type">${escapeHtml(book.type)}</span>
                <span class="book-location">${escapeHtml(book.location)}</span>
            </div>
            <div class="book-info">
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author"><a href="${basePath}authors/${authorSlug}.html" class="author-link">${escapeHtml(book.author)}</a></p>
                <div class="book-meta">
                    <a href="${basePath}categories/${categorySlug}.html" class="meta-item category clickable">${escapeHtml(book.category)}</a>
                    <span class="meta-item language">${escapeHtml(book.language)}</span>
                </div>
            </div>
        </div>
    `;
}

// Custom CSV parser that handles quoted fields with colons properly
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
}

function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            
            const lines = data.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
                resolve([]);
                return;
            }
            
            const headers = parseCSVLine(lines[0]);
            const books = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                
                const values = parseCSVLine(line);
                
                // Ensure we have enough fields
                if (values.length < headers.length) {
                    // Pad with empty strings if we're short
                    while (values.length < headers.length) {
                        values.push('');
                    }
                }
                
                // Map values to headers
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] || '';
                });
                
                // Handle different CSV formats
                let book = {};
                
                if (row.FirstName && row.LastName) {
                    // New format: FirstName,LastName,Title,Category,Language,Location,Type
                    
                    // Check for special case where LastName contains a colon (indicating it's actually a title)
                    if (row.FirstName === 'Unknown' && (row.LastName.includes(':') || 
                        row.LastName.toLowerCase().includes('magazine') || 
                        row.LastName.toLowerCase().includes('guide') || 
                        row.LastName.toLowerCase().includes('interiors') || 
                        row.LastName.toLowerCase().includes('design') ||
                        row.LastName.toLowerCase().includes('style') ||
                        row.LastName.toLowerCase().includes('home') ||
                        row.LastName.toLowerCase().includes('interior'))) {
                        // This is a special case where the title is in the LastName field
                        // and the actual fields are shifted
                        book = {
                            author: 'Unknown',
                            title: row.LastName || '',
                            category: row.Title || '',
                            language: row.Category || '',
                            location: row.Language || '',
                            type: row.Location || ''
                        };
                    } else {
                        // Standard FirstName/LastName parsing
                        book = {
                            author: `${row.FirstName} ${row.LastName}`.trim(),
                            title: row.Title || '',
                            category: row.Category || '',
                            language: row.Language || '',
                            location: row.Location || '',
                            type: row.Type || ''
                        };
                    }
                } else if (row.Author && row.Title) {
                    // Old format: Author,Title,Category,Language,Location,Type
                    book = {
                        author: row.Author || '',
                        title: row.Title || '',
                        category: row.Category || '',
                        language: row.Language || '',
                        location: row.Location || '',
                        type: row.Type || ''
                    };
                } else {
                    // Handle cases where the CSV structure might be different due to commas in titles
                    // For library.csv and image files: FirstName,LastName,Title,Category,Language,Location,Type
                    // But titles may contain commas, so we need to be smarter about parsing
                    if (values.length >= 7) {
                        // We know the structure: FirstName,LastName,Title,Category,Language,Location,Type
                        // The title field may contain commas, so we need to reconstruct it
                        const firstName = values[0];
                        const lastName = values[1];
                        
                        // For lines with "Unknown" as FirstName and titles with colons as "LastName",
                        // we need to handle the field mapping differently
                        if (firstName === 'Unknown' && lastName.includes(':')) {
                            // This is a special case where the title is in the LastName field
                            // and the actual fields are shifted
                            const title = lastName;
                            const category = values[2] || '';
                            const language = values[3] || '';
                            const location = values[4] || '';
                            const type = values[5] || '';
                            
                            book = {
                                author: 'Unknown',
                                title: title || '',
                                category: category || '',
                                language: language || '',
                                location: location || '',
                                type: type || ''
                            };
                        } else {
                            // Standard 7-field parsing
                            const title = values.slice(2, -4).join(','); // Everything between lastName and the last 4 fields
                            const category = values[values.length - 4];
                            const language = values[values.length - 3];
                            const location = values[values.length - 2];
                            const type = values[values.length - 1];
                            
                            book = {
                                author: `${firstName} ${lastName}`.trim(),
                                title: title || '',
                                category: category || '',
                                language: language || '',
                                location: location || '',
                                type: type || ''
                            };
                        }
                    } else if (values.length === 6) {
                        // Handle 6-field format: FirstName,LastName,Title,Category,Language,Location,Type
                        // But where Title might contain commas
                        const firstName = values[0];
                        const lastName = values[1];
                        const title = values[2];
                        const category = values[3];
                        const language = values[4];
                        const location = values[5];
                        
                        book = {
                            author: `${firstName} ${lastName}`.trim(),
                            title: title || '',
                            category: category || '',
                            language: language || '',
                            location: location || '',
                            type: 'book' // Default type for library books
                        };
                    }
                }
                
                // Include ALL books, even those with incomplete data
                // Handle missing authors by giving them a default name
                if (!book.author || !book.author.trim()) {
                    book.author = 'Unknown Author';
                }
                
                // Handle missing titles by giving them a default name
                if (!book.title || !book.title.trim()) {
                    book.title = 'Untitled Book';
                }
                
                // Clean up any extra whitespace, newlines, and quotes
                book.author = (book.author || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                book.title = (book.title || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                book.category = (book.category || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                book.language = (book.language || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                book.location = (book.location || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                book.type = (book.type || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                
                books.push(book);
            }
            
            resolve(books);
        });
    });
}

// Main build function
async function build() {
    try {
        console.log('Starting build...');
        
        // Read all CSV files
        const csvFiles = [
            'books/library.csv',
            'books/kindle.csv',
            'books/audible.csv',
            'books/image1.csv',
            'books/image2.csv',
            'books/image3.csv',
            'books/image4.csv',
            'books/image5.csv',
            'books/image6.csv',
            'books/image7.csv',
            'books/image8.csv',
            'books/image9.csv',
            'books/image10.csv',
            'books/image11.csv',
            'books/image12.csv'
        ];
        
        let allBooks = [];
        
        for (const file of csvFiles) {
            if (fs.existsSync(file)) {
                console.log(`Processing ${file}...`);
                const books = await readCSVFile(file);
                allBooks = allBooks.concat(books);
                console.log(`  Found ${books.length} books`);
            } else {
                console.log(`Warning: ${file} not found`);
            }
        }
        
        console.log(`Total books: ${allBooks.length}`);
        
        // Sort books by last name, first name, then title
        allBooks.sort((a, b) => {
            const authorA = a.author || 'Unknown Author';
            const authorB = b.author || 'Unknown Author';
            
            // Split author names
            const partsA = authorA.split(' ');
            const partsB = authorB.split(' ');
            
            const lastNameA = partsA[partsA.length - 1] || '';
            const lastNameB = partsB[partsB.length - 1] || '';
            const firstNameA = partsA[0] || '';
            const firstNameB = partsB[0] || '';
            
            // Compare last names first
            if (lastNameA !== lastNameB) {
                return lastNameA.localeCompare(lastNameB);
            }
            
            // If last names are the same, compare first names
            if (firstNameA !== firstNameB) {
                return firstNameA.localeCompare(firstNameB);
            }
            
            // If authors are the same, compare titles
            return (a.title || '').localeCompare(b.title || '');
        });
        
        // Generate unique categories, languages, locations, and types
        const categories = [...new Set(allBooks.map(b => b.category).filter(c => c && c !== ''))].sort();
        const languages = [...new Set(allBooks.map(b => b.language).filter(l => l && l !== ''))].sort();
        const locations = [...new Set(allBooks.map(b => b.location).filter(l => l && l !== ''))].sort();
        const types = [...new Set(allBooks.map(b => b.type).filter(t => t && t !== ''))].sort();
        
        // Create the main HTML file
        const html = generateHTML(allBooks, categories, languages, locations, types);
        fs.writeFileSync(path.join(distDir, 'index.html'), html);
        
        // Create the author index page
        const authorsHtml = generateAuthorsHTML(allBooks);
        fs.writeFileSync(path.join(distDir, 'authors.html'), authorsHtml);
        
        // Create individual author pages
        const authorGroups = {};
        allBooks.forEach(book => {
            const author = book.author || 'Unknown Author';
            if (!authorGroups[author]) {
                authorGroups[author] = [];
            }
            authorGroups[author].push(book);
        });
        
        // Create authors directory
        const authorsDir = path.join(distDir, 'authors');
        if (!fs.existsSync(authorsDir)) {
            fs.mkdirSync(authorsDir);
        }
        
        // Generate individual author pages
        Object.keys(authorGroups).forEach(author => {
            const authorSlug = author.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            const authorHtml = generateAuthorPage(author, authorGroups[author], allBooks);
            fs.writeFileSync(path.join(authorsDir, `${authorSlug}.html`), authorHtml);
        });
        
        // Create the category index page
        const categoriesHtml = generateCategoriesHTML(allBooks);
        fs.writeFileSync(path.join(distDir, 'categories.html'), categoriesHtml);
        
        // Create individual category pages
        const categoryGroups = {};
        allBooks.forEach(book => {
            const category = book.category || 'Unknown';
            if (!categoryGroups[category]) {
                categoryGroups[category] = [];
            }
            categoryGroups[category].push(book);
        });
        
        // Create categories directory
        const categoriesDir = path.join(distDir, 'categories');
        if (!fs.existsSync(categoriesDir)) {
            fs.mkdirSync(categoriesDir);
        }
        
        // Generate individual category pages
        Object.keys(categoryGroups).forEach(category => {
            const categorySlug = category.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            const categoryHtml = generateCategoryPage(category, categoryGroups[category], allBooks);
            fs.writeFileSync(path.join(categoriesDir, `${categorySlug}.html`), categoryHtml);
        });
        
        // Create the JavaScript file
        const js = generateJavaScript(allBooks);
        fs.writeFileSync(path.join(distDir, 'script.js'), js);
        
        // Create the CSS file
        const css = generateCSS();
        fs.writeFileSync(path.join(distDir, 'style.css'), css);
        
        // Create a data file for the books
        fs.writeFileSync(path.join(distDir, 'books-data.json'), JSON.stringify(allBooks, null, 2));
        
        console.log('Build completed successfully!');
        console.log(`Generated files in ${distDir}/`);
        
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Generate the main HTML
function generateHTML(books, categories, languages, locations, types) {
    // Pre-build all book cards
    const bookCards = books.map(book => generateBookCard(book, '')).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Shelf - Your Personal Library</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Book Shelf</h1>
            <p>Your Personal Library Collection</p>
            <nav class="main-nav">
                <a href="index.html" class="nav-link active">All Books</a>
                <a href="authors.html" class="nav-link">Authors</a>
                <a href="categories.html" class="nav-link">Categories</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <div class="search-section">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search books by title, author, or category...">
                <button id="searchBtn">Search</button>
            </div>
            
            <div class="filters">
                <div class="filter-group">
                    <label for="categoryFilter">Category:</label>
                    <select id="categoryFilter">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="languageFilter">Language:</label>
                    <select id="languageFilter">
                        <option value="">All Languages</option>
                        ${languages.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="locationFilter">Location:</label>
                    <select id="locationFilter">
                        <option value="">All Locations</option>
                        ${locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="typeFilter">Type:</label>
                    <select id="typeFilter">
                        <option value="">All Types</option>
                        ${types.map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                </div>
                
                <button id="clearFilters" class="clear-btn">Clear Filters</button>
            </div>
        </div>
        
        <div class="stats">
            <span id="bookCount">Total: ${books.length} books</span>
            <span id="filteredCount"></span>
        </div>
        
        <div class="books-grid" id="booksGrid">
            ${bookCards}
        </div>
        
        <div id="noResults" class="no-results" style="display: none;">
            <p>No books found matching your criteria.</p>
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Book Shelf. Built with ❤️ for book lovers.</p>
        </div>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
}

// Generate the authors index HTML
function generateAuthorsHTML(books) {
    // Group books by author
    const authorGroups = {};
    books.forEach(book => {
        const author = book.author || 'Unknown Author';
        if (!authorGroups[author]) {
            authorGroups[author] = [];
        }
        authorGroups[author].push(book);
    });
    
    // Sort authors alphabetically
    const sortedAuthors = Object.keys(authorGroups).sort();
    
    const authorsList = sortedAuthors.map(author => {
        const count = authorGroups[author].length;
        const authorSlug = author.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
        return `<div class="index-item" data-author="${escapeHtml(author)}" data-count="${count}">
            <a href="authors/${authorSlug}.html" class="index-link">
                <h3>${escapeHtml(author)}</h3>
                <div class="count">${count} book${count !== 1 ? 's' : ''}</div>
            </a>
        </div>`;
    }).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authors - Book Shelf</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Book Shelf</h1>
            <p>Browse Books by Author</p>
            <nav class="main-nav">
                <a href="index.html" class="nav-link">All Books</a>
                <a href="authors.html" class="nav-link active">Authors</a>
                <a href="categories.html" class="nav-link">Categories</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <div class="index-section">
            <div class="index-controls">
                <div class="search-box">
                    <input type="text" id="authorSearch" placeholder="Search authors...">
                </div>
                <div class="sort-controls">
                    <label for="sortSelect">Sort by:</label>
                    <select id="sortSelect">
                        <option value="name">Author Name</option>
                        <option value="count">Number of Books</option>
                    </select>
                </div>
            </div>
            
            <h2>Authors (${sortedAuthors.length})</h2>
            <div class="index-grid" id="authorsGrid">
                ${authorsList}
            </div>
            
            <div id="noResults" class="no-results" style="display: none;">
                <p>No authors found matching your search.</p>
            </div>
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Book Shelf. Built with ❤️ for book lovers.</p>
        </div>
    </footer>
    
    <script>
        // Authors page functionality
        const authorSearch = document.getElementById('authorSearch');
        const sortSelect = document.getElementById('sortSelect');
        const authorsGrid = document.getElementById('authorsGrid');
        const noResults = document.getElementById('noResults');
        
        // Store original order for sorting
        const originalItems = Array.from(authorsGrid.children);
        
        function filterAndSortAuthors() {
            const searchTerm = authorSearch.value.toLowerCase();
            const sortBy = sortSelect.value;
            
            // Filter authors
            const filteredItems = originalItems.filter(item => {
                const authorName = item.dataset.author.toLowerCase();
                return authorName.includes(searchTerm);
            });
            
            // Sort filtered items
            if (sortBy === 'count') {
                filteredItems.sort((a, b) => {
                    const countA = parseInt(a.dataset.count);
                    const countB = parseInt(b.dataset.count);
                    return countB - countA; // Descending order (most books first)
                });
            } else {
                // Sort by name (alphabetical)
                filteredItems.sort((a, b) => {
                    const nameA = a.dataset.author.toLowerCase();
                    const nameB = b.dataset.author.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            }
            
            // Update display
            if (filteredItems.length === 0) {
                authorsGrid.innerHTML = '';
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
                authorsGrid.innerHTML = '';
                filteredItems.forEach(item => {
                    authorsGrid.appendChild(item.cloneNode(true));
                });
            }
        }
        
        // Event listeners
        authorSearch.addEventListener('input', filterAndSortAuthors);
        sortSelect.addEventListener('change', filterAndSortAuthors);
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            filterAndSortAuthors();
        });
    </script>
</body>
</html>`;
}

// Generate the categories index HTML
function generateCategoriesHTML(books) {
    // Group books by category
    const categoryGroups = {};
    books.forEach(book => {
        const category = book.category || 'Unknown';
        if (!categoryGroups[category]) {
            categoryGroups[category] = [];
        }
        categoryGroups[category].push(book);
    });
    
    // Sort categories alphabetically
    const sortedCategories = Object.keys(categoryGroups).sort();
    
    const categoriesList = sortedCategories.map(category => {
        const count = categoryGroups[category].length;
        const categorySlug = category.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
        return `<div class="index-item" data-category="${escapeHtml(category)}" data-count="${count}">
            <a href="categories/${categorySlug}.html" class="index-link">
                <h3>${escapeHtml(category)}</h3>
                <div class="count">${count} book${count !== 1 ? 's' : ''}</div>
            </a>
        </div>`;
    }).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories - Book Shelf</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Book Shelf</h1>
            <p>Browse Books by Category</p>
            <nav class="main-nav">
                <a href="index.html" class="nav-link">All Books</a>
                <a href="authors.html" class="nav-link">Authors</a>
                <a href="categories.html" class="nav-link active">Categories</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <div class="index-section">
            <div class="index-controls">
                <div class="search-box">
                    <input type="text" id="categorySearch" placeholder="Search categories...">
                </div>
                <div class="sort-controls">
                    <label for="sortSelect">Sort by:</label>
                    <select id="sortSelect">
                        <option value="name">Category Name</option>
                        <option value="count">Number of Books</option>
                    </select>
                </div>
            </div>
            
            <h2>Categories (${sortedCategories.length})</h2>
            <div class="index-grid" id="categoriesGrid">
                ${categoriesList}
            </div>
            
            <div id="noResults" class="no-results" style="display: none;">
                <p>No categories found matching your search.</p>
            </div>
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Book Shelf. Built with ❤️ for book lovers.</p>
        </div>
    </footer>
    
    <script>
        // Categories page functionality
        const categorySearch = document.getElementById('categorySearch');
        const sortSelect = document.getElementById('sortSelect');
        const categoriesGrid = document.getElementById('categoriesGrid');
        const noResults = document.getElementById('noResults');
        
        // Store original order for sorting
        const originalItems = Array.from(categoriesGrid.children);
        
        function filterAndSortCategories() {
            const searchTerm = categorySearch.value.toLowerCase();
            const sortBy = sortSelect.value;
            
            // Filter categories
            const filteredItems = originalItems.filter(item => {
                const categoryName = item.dataset.category.toLowerCase();
                return categoryName.includes(searchTerm);
            });
            
            // Sort filtered items
            if (sortBy === 'count') {
                filteredItems.sort((a, b) => {
                    const countA = parseInt(a.dataset.count);
                    const countB = parseInt(b.dataset.count);
                    return countB - countA; // Descending order (most books first)
                });
            } else {
                // Sort by name (alphabetical)
                filteredItems.sort((a, b) => {
                    const nameA = a.dataset.category.toLowerCase();
                    const nameB = b.dataset.category.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            }
            
            // Update display
            if (filteredItems.length === 0) {
                categoriesGrid.innerHTML = '';
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
                categoriesGrid.innerHTML = '';
                filteredItems.forEach(item => {
                    categoriesGrid.appendChild(item.cloneNode(true));
                });
            }
        }
        
        // Event listeners
        categorySearch.addEventListener('input', filterAndSortCategories);
        sortSelect.addEventListener('change', filterAndSortCategories);
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            filterAndSortCategories();
        });
    </script>
</body>
</html>`;
}

// Generate individual author page
function generateAuthorPage(author, authorBooks, allBooks) {
    const booksHTML = authorBooks.map(book => generateBookCard(book, '../')).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(author)} - Book Shelf</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Book Shelf</h1>
            <p>Books by ${escapeHtml(author)}</p>
            <nav class="main-nav">
                <a href="../index.html" class="nav-link">All Books</a>
                <a href="../authors.html" class="nav-link active">Authors</a>
                <a href="../categories.html" class="nav-link">Categories</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <div class="author-header">
            <h2>${escapeHtml(author)}</h2>
            <p class="book-count">${authorBooks.length} book${authorBooks.length !== 1 ? 's' : ''}</p>
            <a href="../authors.html" class="back-link">← Back to Authors</a>
        </div>
        
        <div class="books-grid">
            ${booksHTML}
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Book Shelf. Built with ❤️ for book lovers.</p>
        </div>
    </footer>
</body>
</html>`;
}

// Generate individual category page
function generateCategoryPage(category, categoryBooks, allBooks) {
    const booksHTML = categoryBooks.map(book => generateBookCard(book, '../')).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(category)} - Book Shelf</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Book Shelf</h1>
            <p>Books in ${escapeHtml(category)}</p>
            <nav class="main-nav">
                <a href="../index.html" class="nav-link">All Books</a>
                <a href="../authors.html" class="nav-link">Authors</a>
                <a href="../categories.html" class="nav-link active">Categories</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <div class="category-header">
            <h2>${escapeHtml(category)}</h2>
            <p class="book-count">${categoryBooks.length} book${categoryBooks.length !== 1 ? 's' : ''}</p>
            <a href="../categories.html" class="back-link">← Back to Categories</a>
        </div>
        
        <div class="books-grid">
            ${booksHTML}
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Book Shelf. Built with ❤️ for book lovers.</p>
        </div>
    </footer>
</body>
</html>`;
}

// Generate the JavaScript
function generateJavaScript(books) {
    return `// Book data
const allBooks = ${JSON.stringify(books)};

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const languageFilter = document.getElementById('languageFilter');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const booksGrid = document.getElementById('booksGrid');
const bookCount = document.getElementById('bookCount');
const filteredCount = document.getElementById('filteredCount');
const noResults = document.getElementById('noResults');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authorParam = urlParams.get('author');
    
    if (authorParam) {
        // Auto-filter by author from URL parameter
        filterByAuthor(decodeURIComponent(authorParam));
    }
    setupEventListeners();
});

function setupEventListeners() {
    searchInput.addEventListener('input', filterBooks);
    searchBtn.addEventListener('click', filterBooks);
    categoryFilter.addEventListener('change', filterBooks);
    languageFilter.addEventListener('change', filterBooks);
    locationFilter.addEventListener('change', filterBooks);
    typeFilter.addEventListener('change', filterBooks);
    clearFiltersBtn.addEventListener('click', clearFilters);
}

function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const language = languageFilter.value;
    const location = locationFilter.value;
    const type = typeFilter.value;
    
    const filtered = allBooks.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.category.toLowerCase().includes(searchTerm);
            
        const matchesCategory = !category || book.category === category;
        const matchesLanguage = !language || book.language === language;
        const matchesLocation = !location || book.location === location;
        const matchesType = !type || book.type === type;
        
        return matchesSearch && matchesCategory && matchesLanguage && matchesLocation && matchesType;
    });
    
    displayBooks(filtered);
    updateStats(filtered.length);
}

function clearFilters() {
    searchInput.value = '';
    categoryFilter.value = '';
    languageFilter.value = '';
    locationFilter.value = '';
    typeFilter.value = '';
    filterBooks();
}

function displayBooks(books) {
    if (books.length === 0) {
        booksGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    // Get all book cards
    const allCards = booksGrid.querySelectorAll('.book-card');
    
    // Show/hide cards based on filtered results
    allCards.forEach(card => {
        const title = card.querySelector('.book-title').textContent;
        const author = card.querySelector('.book-author a').textContent;
        const category = card.querySelector('.meta-item.category').textContent;
        
        // Check if this card matches the current filter
        const matchesSearch = !searchInput.value.toLowerCase() || 
            title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            author.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            category.toLowerCase().includes(searchInput.value.toLowerCase());
            
        const matchesCategory = !categoryFilter.value || category === categoryFilter.value;
        const matchesLanguage = !languageFilter.value || card.querySelector('.meta-item.language').textContent === languageFilter.value;
        const matchesLocation = !locationFilter.value || card.querySelector('.book-location').textContent === locationFilter.value;
        const matchesType = !typeFilter.value || card.querySelector('.book-type').textContent === typeFilter.value;
        
        const shouldShow = matchesSearch && matchesCategory && matchesLanguage && matchesLocation && matchesType;
        card.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Update visible count
    const visibleCards = booksGrid.querySelectorAll('.book-card[style*="display: block"], .book-card:not([style*="display: none"])');
    updateStats(visibleCards.length);
}

function updateStats(filteredCount) {
    const total = allBooks.length;
    if (filteredCount === total) {
        filteredCount.textContent = '';
    } else {
        filteredCount.textContent = \` | Showing: \${filteredCount} books\`;
    }
}

function filterByAuthor(authorName) {
    // This function can be used for URL-based filtering
    // For now, just clear other filters and search for the author
    clearFilters();
    searchInput.value = authorName;
    filterBooks();
}`;
}

// Generate the CSS
function generateCSS() {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem 0;
    text-align: center;
    margin-bottom: 2rem;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Navigation */
.main-nav {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.nav-link {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.nav-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.nav-link.active {
    background: rgba(255, 255, 255, 0.3);
    font-weight: 600;
}

/* Search Section */
.search-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.search-box {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.search-box input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

.search-box input:focus {
    outline: none;
    border-color: #667eea;
}

.search-box button {
    padding: 12px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.search-box button:hover {
    background: #5a6fd8;
}

/* Filters */
.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    font-weight: 600;
    font-size: 14px;
    color: #555;
}

.filter-group select {
    padding: 8px 12px;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    font-size: 14px;
    background: white;
}

.clear-btn {
    padding: 8px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-left: auto;
}

.clear-btn:hover {
    background: #5a6268;
}

/* Stats */
.stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    font-size: 14px;
    color: #666;
}

/* Books Grid */
.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.book-card {
    background: white;
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    overflow: hidden;
    border: 1px solid #f0f0f0;
}

.book-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    border-color: #e0e0e0;
}

.book-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.book-type {
    color: #6c757d;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.book-location {
    color: #6c757d;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.book-info {
    padding: 1.5rem;
}

.book-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: #1a1a1a;
    line-height: 1.3;
}

.book-author {
    font-size: 1rem;
    color: #667eea;
    margin-bottom: 1rem;
    font-weight: 500;
}

.book-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.meta-item {
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.meta-item.category {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    padding: 8px 16px;
    font-size: 13px;
}

.meta-item.language {
    background: #f8f9fa;
    color: #6c757d;
    border: 1px solid #e9ecef;
    padding: 6px 12px;
    font-size: 12px;
}

/* Clickable links */
.author-link {
    color: #667eea;
    text-decoration: none;
    transition: color 0.3s ease;
}

.author-link:hover {
    color: #5a6fd8;
    text-decoration: underline;
}

.meta-item.clickable {
    cursor: pointer;
    transition: all 0.3s ease;
}

.meta-item.clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}



/* No Results */
.no-results {
    text-align: center;
    padding: 3rem;
    color: #666;
}

.no-results p {
    font-size: 1.2rem;
}

/* Footer */
footer {
    background: #2c3e50;
    color: white;
    text-align: center;
    padding: 2rem 0;
    margin-top: 3rem;
}

/* Index Pages */
.index-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.index-section h2 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    border-bottom: 2px solid #667eea;
    padding-bottom: 0.5rem;
}

.index-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.index-controls .search-box {
    flex: 1;
    min-width: 250px;
}

.index-controls .search-box input {
    width: 100%;
    padding: 10px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

.index-controls .search-box input:focus {
    outline: none;
    border-color: #667eea;
}

.sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sort-controls label {
    font-weight: 600;
    font-size: 14px;
    color: #555;
    white-space: nowrap;
}

.sort-controls select {
    padding: 8px 12px;
    border: 2px solid #e1e5e9;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: border-color 0.3s ease;
}

.sort-controls select:focus {
    outline: none;
    border-color: #667eea;
}

.index-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.index-item {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
    cursor: pointer;
}

.index-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.index-item h3 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.index-item .count {
    color: #6c757d;
    font-size: 0.9rem;
    font-weight: 500;
}

.index-link {
    text-decoration: none;
    color: inherit;
    display: block;
    width: 100%;
    height: 100%;
}

.author-header, .category-header {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    text-align: center;
}

.author-header h2, .category-header h2 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 2rem;
}

.book-count {
    color: #6c757d;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
}

.back-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    transition: background-color 0.3s ease;
}

.back-link:hover {
    background: #5a6fd8;
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 0 15px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .search-box {
        flex-direction: column;
    }
    
    .filters {
        flex-direction: column;
        align-items: stretch;
    }
    
    .clear-btn {
        margin-left: 0;
    }
    
    .books-grid {
        grid-template-columns: 1fr;
    }
    
    .stats {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .index-grid {
        grid-template-columns: 1fr;
    }
    
    .main-nav {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .index-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .index-controls .search-box {
        min-width: auto;
    }
    
    .sort-controls {
        justify-content: center;
    }
}
`;
}

// Run the build
build(); 