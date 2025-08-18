const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register partials
const partialsDir = path.join(__dirname, 'templates', 'partials');
const partialFiles = fs.readdirSync(partialsDir);
partialFiles.forEach(file => {
    if (file.endsWith('.hbs')) {
        const partialName = path.basename(file, '.hbs');
        const partialContent = fs.readFileSync(path.join(partialsDir, file), 'utf8');
        Handlebars.registerPartial(partialName, partialContent);
    }
});

// Register helpers
Handlebars.registerHelper('slugify', function(text) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
});

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

// Better slug generation function
function generateSlug(text) {
    if (!text || text.trim() === '') return 'unknown';
    
    let slug = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
    
    // If slug is empty or too short, use a fallback
    if (!slug || slug.length < 2) {
        slug = text.toLowerCase().replace(/[^\w]/g, '').substring(0, 10);
        if (!slug) slug = 'unknown';
    }
    
    return slug;
}

// Load templates
const loadTemplate = (templatePath) => {
    const content = fs.readFileSync(templatePath, 'utf8');
    return Handlebars.compile(content);
};

const mainLayout = loadTemplate(path.join(__dirname, 'templates', 'layouts', 'main.hbs'));
const indexTemplate = loadTemplate(path.join(__dirname, 'templates', 'pages', 'index.hbs'));
const categoriesTemplate = loadTemplate(path.join(__dirname, 'templates', 'pages', 'categories.hbs'));
const authorsTemplate = loadTemplate(path.join(__dirname, 'templates', 'pages', 'authors.hbs'));
const categoryTemplate = loadTemplate(path.join(__dirname, 'templates', 'pages', 'category.hbs'));
const authorTemplate = loadTemplate(path.join(__dirname, 'templates', 'pages', 'author.hbs'));

// Load CSS files
const loadCSS = () => {
    return fs.readFileSync(path.join(__dirname, 'templates', 'styles', 'tailwind.css'), 'utf8');
};

// Generate JavaScript
const generateJavaScript = () => {
    return `// Book filtering and search functionality
function displayBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    const bookCards = Array.from(document.querySelectorAll('[data-category]')); // Using data attributes
    let visibleCount = 0;
    
    bookCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase(); // Title is in h3
        const author = card.querySelector('p').textContent.toLowerCase(); // Author is in first p
        const category = card.dataset.category;
        const location = card.dataset.location;
        const type = card.dataset.type;
        
        const matchesSearch = title.includes(searchTerm) || author.includes(searchTerm) || category.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || category === categoryFilter;
        const matchesLocation = !locationFilter || location === locationFilter;
        const matchesType = !typeFilter || type === typeFilter;
        
        const shouldShow = matchesSearch && matchesCategory && matchesLocation && matchesType;
        card.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) visibleCount++;
    });
    
    updateStats(visibleCount);
    
    // Show/hide no results message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function updateStats(count) {
    const filteredCountElement = document.getElementById('filteredCount');
    if (filteredCountElement) {
        filteredCountElement.textContent = count;
    }
}

function sortBooks() {
    const sortBy = document.getElementById('sortBy').value;
    const bookCards = Array.from(document.querySelectorAll('[data-category]'));
    const booksGrid = document.querySelector('.grid');
    
    bookCards.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'title':
                aValue = a.querySelector('h3').textContent.toLowerCase();
                bValue = b.querySelector('h3').textContent.toLowerCase();
                break;
            case 'author':
                // Extract author names from "by Author Name" format
                const aAuthor = a.querySelector('p').textContent.replace('by ', '').trim();
                const bAuthor = b.querySelector('p').textContent.replace('by ', '').trim();
                // Split into first and last name
                const [aFirst, ...aLast] = aAuthor.split(' ');
                const [bFirst, ...bLast] = bAuthor.split(' ');
                // Compare last names first, then first names
                const aLastName = aLast.join(' ').toLowerCase();
                const bLastName = bLast.join(' ').toLowerCase();
                if (aLastName !== bLastName) {
                    return aLastName.localeCompare(bLastName);
                }
                return aFirst.toLowerCase().localeCompare(bFirst.toLowerCase());
                break;

            default:
                return 0;
        }
        
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    });
    
    // Reorder DOM elements
    bookCards.forEach(card => booksGrid.appendChild(card));
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (searchInput) searchInput.addEventListener('input', displayBooks);
    if (categoryFilter) categoryFilter.addEventListener('change', displayBooks);
    if (locationFilter) locationFilter.addEventListener('change', displayBooks);
    if (typeFilter) typeFilter.addEventListener('change', displayBooks);
    if (sortBy) sortBy.addEventListener('change', sortBooks);
    
    // Initial display
    displayBooks();
});`;
};

// Main build function
async function build() {
    console.log('Starting build with Handlebars...');
    
    // Create dist directory
    if (!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }
    
    // Load and process book data
    const books = [];
    const bookFiles = [
        'books/library.csv',
        'books/kindle.csv', 
        'books/audible.csv',
        'books/river.csv'
    ];
    
    for (const file of bookFiles) {
        if (fs.existsSync(file)) {
            console.log(`Processing ${file}...`);
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) continue;
            
            const headers = parseCSVLine(lines[0]);
            let fileBooks = 0;
            
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                
                const values = parseCSVLine(line);
                
                // Ensure we have enough fields
                if (values.length < headers.length) {
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
                        book = {
                            firstName: 'Unknown',
                            lastName: 'Unknown',
                            title: row.LastName || '',
                            category: row.Title || '',
                            language: row.Category || '',
                            location: row.Language || '',
                            type: row.Location || ''
                        };
                    } else {
                        // Standard FirstName/LastName parsing
                        book = {
                            firstName: row.FirstName || '',
                            lastName: row.LastName || '',
                            title: row.Title || '',
                            category: row.Category || '',
                            language: row.Language || '',
                            location: row.Location || '',
                            type: row.Type || ''
                        };
                    }
                } else if (row.Author && row.Title) {
                    // Old format: Author,Title,Category,Language,Location,Type
                    const authorParts = (row.Author || '').split(' ');
                    book = {
                        firstName: authorParts[0] || '',
                        lastName: authorParts.slice(1).join(' ') || '',
                        title: row.Title || '',
                        category: row.Category || '',
                        language: row.Language || '',
                        location: row.Location || '',
                        type: row.Type || ''
                    };
                } else {
                    // Handle cases where the CSV structure might be different due to commas in titles
                    if (values.length >= 7) {
                        const firstName = values[0];
                        const lastName = values[1];
                        
                        // For lines with "Unknown" as FirstName and titles with colons as "LastName"
                        if (firstName === 'Unknown' && lastName.includes(':')) {
                            const title = lastName;
                            const category = values[2] || '';
                            const language = values[3] || '';
                            const location = values[4] || '';
                            const type = values[5] || '';
                            
                            book = {
                                firstName: 'Unknown',
                                lastName: 'Unknown',
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
                                firstName: firstName || '',
                                lastName: lastName || '',
                                title: title || '',
                                category: category || '',
                                language: language || '',
                                location: location || '',
                                type: type || ''
                            };
                        }
                    } else if (values.length === 6) {
                        // Handle 6-field format
                        const firstName = values[0];
                        const lastName = values[1];
                        const title = values[2];
                        const category = values[3];
                        const language = values[4];
                        const location = values[5];
                        
                        book = {
                            firstName: firstName || '',
                            lastName: lastName || '',
                            title: title || '',
                            category: category || '',
                            language: language || '',
                            location: location || '',
                            type: 'book' // Default type for library books
                        };
                    }
                }
                
                // Only add books with essential data
                if (book.title && book.title.trim() && book.category && book.category.trim()) {
                    // Clean up any extra whitespace, newlines, and quotes
                    book.firstName = (book.firstName || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.lastName = (book.lastName || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.title = (book.title || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.category = (book.category || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.language = (book.language || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.location = (book.location || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    book.type = (book.type || '').trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '');
                    
                    books.push(book);
                    fileBooks++;
                }
            }
            console.log(`  Found ${fileBooks} books`);
        }
    }
    
    console.log(`Total books: ${books.length}`);
    
    // Generate unique categories, types, and locations
    const categories = [...new Set(books.map(book => book.category))].sort();
    const types = [...new Set(books.map(book => book.type).filter(Boolean))].sort();
    const locations = [...new Set(books.map(book => book.location).filter(Boolean))].sort();
    
    // Add author field for display and processing
    books.forEach(book => {
        book.author = `${book.firstName} ${book.lastName}`;
        // Add slugs for linking
        book.authorSlug = generateSlug(book.author);
        book.categorySlug = generateSlug(book.category);
        // Add basePath for linking
        book.basePath = './';
    });
    
    // Generate index page
    const indexData = {
        title: 'All Books',
        books: books,
        totalBooks: books.length,
        categories: categories,
        types: types,
        locations: locations,
        isIndex: true,
        basePath: './'
    };
    
    const indexContent = mainLayout({
        ...indexData,
        body: indexTemplate(indexData),
        includeScripts: true
    });
    
    fs.writeFileSync('./dist/index.html', indexContent);
    
    // Generate categories page
    const categoryCounts = {};
    books.forEach(book => {
        categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    });
    
    const categoriesData = {
        title: 'By Category',
        categories: Object.entries(categoryCounts).map(([name, count]) => ({
            name,
            count,
            slug: generateSlug(name)
        })).sort((a, b) => b.count - a.count),
        isCategories: true,
        basePath: './'
    };
    
    const categoriesContent = mainLayout({
        ...categoriesData,
        body: categoriesTemplate(categoriesData)
    });
    
    fs.writeFileSync('./dist/categories.html', categoriesContent);
    
    // Generate authors page
    const authorCounts = {};
    books.forEach(book => {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    });
    
    const authorsData = {
        title: 'By Author',
        authors: Object.entries(authorCounts).map(([name, count]) => ({
            name,
            count,
            slug: generateSlug(name)
        })).sort((a, b) => b.count - a.count),
        isAuthors: true,
        basePath: './'
    };
    
    const authorsContent = mainLayout({
        ...authorsData,
        body: authorsTemplate(authorsData)
    });
    
    fs.writeFileSync('./dist/authors.html', authorsContent);
    
    // Generate individual category pages
    if (!fs.existsSync('./dist/categories')) {
        fs.mkdirSync('./dist/categories');
    }
    
    for (const category of categories) {
        const categoryBooks = books.filter(book => book.category === category).map(book => ({
            ...book,
            basePath: '../'
        }));
        const categoryData = {
            title: category,
            categoryName: category,
            books: categoryBooks,
            isCategories: true,
            basePath: '../'
        };
        
        const categoryContent = mainLayout({
            ...categoryData,
            body: categoryTemplate(categoryData),
            includeScripts: true
        });
        
        const categorySlug = generateSlug(category);
        fs.writeFileSync(`./dist/categories/${categorySlug}.html`, categoryContent);
    }
    
    // Generate individual author pages
    if (!fs.existsSync('./dist/authors')) {
        fs.mkdirSync('./dist/authors');
    }
    
    for (const author of Object.keys(authorCounts)) {
        const authorBooks = books.filter(book => book.author === author).map(book => ({
            ...book,
            basePath: '../'
        }));
        const authorData = {
            title: author,
            authorName: author,
            books: authorBooks,
            isAuthors: true,
            basePath: '../'
        };
        
        const authorContent = mainLayout({
            ...authorData,
            body: authorTemplate(authorData),
            includeScripts: true
        });
        
        const authorSlug = generateSlug(author);
        fs.writeFileSync(`./dist/authors/${authorSlug}.html`, authorContent);
    }
    
    // Generate CSS
    const cssContent = loadCSS();
    fs.writeFileSync('./dist/style.css', cssContent);
    
    // Generate JavaScript
    const jsContent = generateJavaScript();
    fs.writeFileSync('./dist/script.js', jsContent);
    
    console.log('Build completed successfully!');
    console.log('Generated files in ./dist/');
}

// Run build
build().catch(console.error);
