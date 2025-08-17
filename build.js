const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = './dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
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
        
        // Generate unique categories, languages, locations, and types
        const categories = [...new Set(allBooks.map(b => b.category).filter(c => c && c !== ''))].sort();
        const languages = [...new Set(allBooks.map(b => b.language).filter(l => l && l !== ''))].sort();
        const locations = [...new Set(allBooks.map(b => b.location).filter(l => l && l !== ''))].sort();
        const types = [...new Set(allBooks.map(b => b.type).filter(t => t && t !== ''))].sort();
        
        // Create the main HTML file
        const html = generateHTML(allBooks, categories, languages, locations, types);
        fs.writeFileSync(path.join(distDir, 'index.html'), html);
        
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
            <!-- Books will be populated here -->
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
    displayBooks(allBooks);
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
    
    const booksHTML = books.map(book => \`
        <div class="book-card">
            <div class="book-header">
                <span class="book-type">\${escapeHtml(book.type)}</span>
                <span class="book-location">\${escapeHtml(book.location)}</span>
            </div>
            <div class="book-info">
                <h3 class="book-title">\${escapeHtml(book.title)}</h3>
                <p class="book-author">\${escapeHtml(book.author)}</p>
                <div class="book-meta">
                    <span class="meta-item category">\${escapeHtml(book.category)}</span>
                    <span class="meta-item language">\${escapeHtml(book.language)}</span>
                </div>
            </div>
        </div>
    \`).join('');
    
    booksGrid.innerHTML = booksHTML;
}

function updateStats(filteredCount) {
    const total = allBooks.length;
    if (filteredCount === total) {
        this.filteredCount.textContent = '';
    } else {
        this.filteredCount.textContent = \` | Showing: \${filteredCount} books\`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.book-type {
    color: #6c757d;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.book-location {
    color: #6c757d;
    font-size: 12px;
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
}`;
}

// Run the build
build(); 