const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Check if we're building for production (subdirectory deployment)
const isProduction = process.env.NODE_ENV === 'production' || process.env.BUILD_ENV === 'production';
const assetPath = isProduction ? '/books/' : './';

console.log(`Building for ${isProduction ? 'production' : 'development'} with asset path: ${assetPath}`);

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

Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

Handlebars.registerHelper('categoryColor', function(categoryName, colorType) {
    const colors = getCategoryColors(categoryName);
    return colors[colorType] || '';
});

Handlebars.registerHelper('lookup', function(obj, key) {
    return obj[key];
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

// Color palette for categories (will be assigned dynamically)
const colorPalette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: 'bg-blue-100', dark: 'bg-blue-700', darkText: 'text-white' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', accent: 'bg-green-100', dark: 'bg-green-700', darkText: 'text-white' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'bg-purple-100', dark: 'bg-purple-700', darkText: 'text-white' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-100', dark: 'bg-indigo-700', darkText: 'text-white' },
    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', accent: 'bg-red-100', dark: 'bg-red-700', darkText: 'text-white' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', accent: 'bg-pink-100', dark: 'bg-pink-700', darkText: 'text-white' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accent: 'bg-orange-100', dark: 'bg-orange-700', darkText: 'text-white' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-100', dark: 'bg-amber-700', darkText: 'text-white' },
    { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', accent: 'bg-stone-100', dark: 'bg-stone-700', darkText: 'text-white' },
    { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', accent: 'bg-slate-100', dark: 'bg-slate-700', darkText: 'text-white' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-100', dark: 'bg-teal-700', darkText: 'text-white' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-100', dark: 'bg-emerald-700', darkText: 'text-white' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', accent: 'bg-cyan-100', dark: 'bg-cyan-700', darkText: 'text-white' },
    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', accent: 'bg-fuchsia-100', dark: 'bg-fuchsia-700', darkText: 'text-white' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', accent: 'bg-rose-100', dark: 'bg-rose-700', darkText: 'text-white' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', accent: 'bg-violet-100', dark: 'bg-violet-700', darkText: 'text-white' },
    { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', accent: 'bg-lime-100', dark: 'bg-lime-700', darkText: 'text-white' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-100', dark: 'bg-sky-700', darkText: 'text-white' }
];

// Default color for unknown categories
const defaultCategoryColor = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', accent: 'bg-gray-100', dark: 'bg-gray-700', darkText: 'text-white' };

// Dynamic category color assignment
let categoryColorMap = {};

// Helper function to get category colors
function getCategoryColors(categoryName) {
    return categoryColorMap[categoryName] || defaultCategoryColor;
}



// Main build function
async function build() {
    console.log('Starting build with Handlebars...');
    
    // Create dist directory
    if (!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }
    
    // Load and process book data
    const books = [];
    
    // Automatically discover CSV files in the books directory
    const booksDir = path.join(__dirname, 'books');
    const bookFiles = [];
    
    if (fs.existsSync(booksDir)) {
        const files = fs.readdirSync(booksDir);
        files.forEach(file => {
            if (file.endsWith('.csv')) {
                bookFiles.push(path.join('books', file));
            }
        });
    }
    
    console.log(`Found ${bookFiles.length} CSV files: ${bookFiles.join(', ')}`);
    
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
    
    // Count books per category and assign colors BEFORE processing books
    const categoryCounts = {};
    books.forEach(book => {
        categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    });
    
    // Sort categories by book count (descending) and assign colors
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(([name, count]) => ({ name, count }));
    
    // Assign colors to categories based on book count order
    sortedCategories.forEach((category, index) => {
        const colorIndex = index % colorPalette.length; // Loop through colors if more categories than colors
        categoryColorMap[category.name] = colorPalette[colorIndex];
    });
    
    console.log(`Assigned colors to ${sortedCategories.length} categories`);
    
    // Add author field for display and processing
    books.forEach(book => {
        book.author = `${book.firstName} ${book.lastName}`;
        // Add slugs for linking
        book.authorSlug = generateSlug(book.author);
        book.categorySlug = generateSlug(book.category);
        // Add basePath for linking
        book.basePath = './';
        
        // Add category colors (now available from categoryColorMap)
        const categoryColors = getCategoryColors(book.category);
        book.categoryBg = categoryColors.bg;
        book.categoryText = categoryColors.text;
        book.categoryBorder = categoryColors.border;
        book.categoryAccent = categoryColors.accent;
        book.categoryDark = categoryColors.dark;
        book.categoryDarkText = categoryColors.darkText;
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
        basePath: './',
        assetPath: assetPath
    };
    
    const indexContent = mainLayout({
        ...indexData,
        body: indexTemplate(indexData),
        includeScripts: true
    });
    
    fs.writeFileSync('./dist/index.html', indexContent);
    
    // Generate categories page
    const categoriesData = {
        title: 'By Category',
        categories: sortedCategories.map(category => {
            const categoryColors = getCategoryColors(category.name);
            return {
                name: category.name,
                count: category.count,
                slug: generateSlug(category.name),
                // Pass category colors to the template
                categoryBg: categoryColors.bg,
                categoryText: categoryColors.text,
                categoryBorder: categoryColors.border,
                categoryAccent: categoryColors.accent,
                categoryDark: categoryColors.dark,
                categoryDarkText: categoryColors.darkText
            };
        }),
        isCategories: true,
        basePath: './',
        assetPath: assetPath
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
        basePath: './',
        assetPath: assetPath
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
    
    for (const category of sortedCategories) {
        const categoryBooks = books.filter(book => book.category === category.name).map(book => ({
            ...book,
            basePath: '../',
            // Ensure category colors are available
            categoryBg: book.categoryBg,
            categoryText: book.categoryText,
            categoryBorder: book.categoryBorder,
            categoryAccent: book.categoryAccent,
            categoryDark: book.categoryDark,
            categoryDarkText: book.categoryDarkText
        }));
        const categoryColors = getCategoryColors(category.name);
        const categoryData = {
            title: category.name,
            categoryName: category.name,
            books: categoryBooks,
            isCategories: true,
            basePath: '../',
            assetPath: isProduction ? '/books/' : '../',
            // Pass category colors to the template
            categoryBg: categoryColors.bg,
            categoryText: categoryColors.text,
            categoryBorder: categoryColors.border,
            categoryAccent: categoryColors.accent,
            categoryDark: categoryColors.dark,
            categoryDarkText: categoryColors.darkText
        };
        
        const categoryContent = mainLayout({
            ...categoryData,
            body: categoryTemplate(categoryData),
            includeScripts: true
        });
        
        const categorySlug = generateSlug(category.name);
        fs.writeFileSync(`./dist/categories/${categorySlug}.html`, categoryContent);
    }
    
    // Generate individual author pages
    if (!fs.existsSync('./dist/authors')) {
        fs.mkdirSync('./dist/authors');
    }
    
    for (const author of Object.keys(authorCounts)) {
        const authorBooks = books.filter(book => book.author === author).map(book => ({
            ...book,
            basePath: '../',
            // Ensure category colors are available
            categoryBg: book.categoryBg,
            categoryText: book.categoryText,
            categoryBorder: book.categoryBorder,
            categoryAccent: book.categoryAccent,
            categoryDark: book.categoryDark,
            categoryDarkText: book.categoryDarkText
        }));
        const authorData = {
            title: author,
            authorName: author,
            books: authorBooks,
            isAuthors: true,
            basePath: '../',
            assetPath: isProduction ? '/books/' : '../'
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
