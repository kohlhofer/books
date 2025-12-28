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

// Helper to generate seeded random number for consistent dimensions
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Slightly adjust a hex color's brightness/saturation
function adjustColor(hexColor, index) {
    // Parse hex color
    const hex = hexColor.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Generate subtle variation (-15 to +15 for each channel)
    const variation = (seededRandom(index * 73) - 0.5) * 30;
    const hueShift = (seededRandom(index * 89) - 0.5) * 20;

    // Apply variation while keeping within bounds
    r = Math.max(0, Math.min(255, Math.round(r + variation + hueShift * 0.3)));
    g = Math.max(0, Math.min(255, Math.round(g + variation)));
    b = Math.max(0, Math.min(255, Math.round(b + variation - hueShift * 0.3)));

    // Convert back to hex
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Fake publisher logos (simple geometric shapes described as CSS)
const publisherLogos = [
    { name: 'circle', symbol: '●', style: 'publisher-logo-circle' },
    { name: 'diamond', symbol: '◆', style: 'publisher-logo-diamond' },
    { name: 'star', symbol: '★', style: 'publisher-logo-star' },
    { name: 'square', symbol: '■', style: 'publisher-logo-square' },
    { name: 'triangle', symbol: '▲', style: 'publisher-logo-triangle' },
    { name: 'ring', symbol: '○', style: 'publisher-logo-ring' },
    { name: 'bars', symbol: '≡', style: 'publisher-logo-bars' },
    { name: 'cross', symbol: '+', style: 'publisher-logo-cross' },
];

// Calculate spine dimensions based on title (scaled 1.5x)
function calculateSpineDimensions(title, index) {
    const titleLength = (title || '').length;

    // Height: 290-350px - less variation for more uniform look
    const baseHeight = 290;
    const heightVariation = Math.min(titleLength * 0.8, 40);
    const randomHeightOffset = (seededRandom(index * 17) - 0.5) * 20;
    const height = Math.round(baseHeight + heightVariation + randomHeightOffset);

    // Width based on title length - thin books only for short titles
    const widthRandom = seededRandom(index * 31);
    let width;
    if (titleLength <= 15 && widthRandom < 0.4) {
        // Short titles can be thin (55-70px)
        width = Math.round(55 + seededRandom(index * 41) * 15);
    } else if (titleLength <= 25 && widthRandom < 0.3) {
        // Medium titles can be slim (65-85px)
        width = Math.round(65 + seededRandom(index * 41) * 20);
    } else {
        // Long titles or random selection get normal width (75-105px)
        width = Math.round(75 + seededRandom(index * 41) * 30);
    }

    // Spine style variant (0-5 for different visual treatments)
    const styleVariant = Math.floor(seededRandom(index * 47) * 6);

    // Font variant (0-3 for different font families)
    const fontVariant = Math.floor(seededRandom(index * 61) * 4);

    // Publisher logo disabled for cleaner look
    const publisherLogo = null;

    return { height, width, styleVariant, fontVariant, publisherLogo };
}

// Organize books into shelf rows
function organizeIntoShelves(books, booksPerShelf = 12) {
    const shelves = [];
    for (let i = 0; i < books.length; i += booksPerShelf) {
        shelves.push(books.slice(i, i + booksPerShelf));
    }
    return shelves;
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
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const locationFilter = document.getElementById('locationFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    const bookItems = Array.from(document.querySelectorAll('[data-category]'));
    let visibleCount = 0;

    bookItems.forEach(item => {
        // Get title from data attribute or element
        const title = (item.dataset.title || item.querySelector('.book-spine-title, .book-cover-title, h3')?.textContent || '').toLowerCase();
        // Get author from data attribute or element
        const author = (item.dataset.author || item.querySelector('.book-spine-author, .book-cover-author, p')?.textContent || '').toLowerCase();
        const category = (item.dataset.category || '').toLowerCase();
        const location = item.dataset.location || '';
        const type = item.dataset.type || '';

        const matchesSearch = !searchTerm || title.includes(searchTerm) || author.includes(searchTerm) || category.includes(searchTerm);
        const matchesCategory = !categoryFilter || item.dataset.category === categoryFilter;
        const matchesLocation = !locationFilter || location === locationFilter;
        const matchesType = !typeFilter || type === typeFilter;

        const shouldShow = matchesSearch && matchesCategory && matchesLocation && matchesType;
        item.style.display = shouldShow ? '' : 'none';

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
    const sortBy = document.getElementById('sortBy')?.value || 'author';
    const bookItems = Array.from(document.querySelectorAll('[data-category]'));
    const container = document.querySelector('.shelf-row, .covers-shelf, .grid');

    if (!container) return;

    bookItems.sort((a, b) => {
        switch (sortBy) {
            case 'title':
                const aTitle = (a.dataset.title || a.querySelector('.book-spine-title, .book-cover-title, h3')?.textContent || '').toLowerCase();
                const bTitle = (b.dataset.title || b.querySelector('.book-spine-title, .book-cover-title, h3')?.textContent || '').toLowerCase();
                return aTitle.localeCompare(bTitle);
            case 'author':
                const aAuthor = (a.dataset.author || '').toLowerCase();
                const bAuthor = (b.dataset.author || '').toLowerCase();
                // Sort by last name
                const aLastName = aAuthor.split(' ').pop() || '';
                const bLastName = bAuthor.split(' ').pop() || '';
                if (aLastName !== bLastName) {
                    return aLastName.localeCompare(bLastName);
                }
                return aAuthor.localeCompare(bAuthor);
            default:
                return 0;
        }
    });

    // Reorder DOM elements
    bookItems.forEach(item => container.appendChild(item));
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
    
    // Initial display and sort by author (default)
    displayBooks();
    sortBooks(); // This will sort by author since it's the first option
});`;
};

// Color palette for categories - cozy old bookstore colors
    const colorPalette = [
        // Deep burgundy/maroon - classic leather
        { bg: '#f5e6e8', text: '#722f37', border: '#d4a5a5', accent: '#e8c4c4', dark: '#722f37', darkText: '#f5e6dc' },
        // Forest green - aged cloth binding
        { bg: '#e8efe8', text: '#2d4a3e', border: '#7d9d8c', accent: '#a8c5b5', dark: '#2d4a3e', darkText: '#e8efe8' },
        // Navy blue - traditional hardcover
        { bg: '#e6eaf0', text: '#2c3e5c', border: '#8a9cba', accent: '#b5c4d8', dark: '#2c3e5c', darkText: '#e6eaf0' },
        // Warm brown - aged leather
        { bg: '#f0e8dc', text: '#5c4033', border: '#b8a089', accent: '#d4c4aa', dark: '#5c4033', darkText: '#f0e8dc' },
        // Faded olive - vintage cloth
        { bg: '#eceee6', text: '#4a4f3c', border: '#9da388', accent: '#c4c9b0', dark: '#4a4f3c', darkText: '#eceee6' },
        // Dusty rose - antique
        { bg: '#f2e8e8', text: '#7d5a5a', border: '#c9a8a8', accent: '#dcc4c4', dark: '#7d5a5a', darkText: '#f2e8e8' },
        // Muted teal - art deco
        { bg: '#e4ecec', text: '#3d5c5c', border: '#8aabab', accent: '#b0c9c9', dark: '#3d5c5c', darkText: '#e4ecec' },
        // Burnt sienna - terracotta
        { bg: '#f2e6dc', text: '#8b4c39', border: '#c9967d', accent: '#ddb8a0', dark: '#8b4c39', darkText: '#f2e6dc' },
        // Slate gray - modern classic
        { bg: '#eaeaec', text: '#4a4a52', border: '#9a9aa5', accent: '#c0c0c8', dark: '#4a4a52', darkText: '#eaeaec' },
        // Ochre/mustard - aged paper
        { bg: '#f5eee0', text: '#7a6832', border: '#c9b87a', accent: '#ddd0a0', dark: '#7a6832', darkText: '#f5eee0' },
        // Deep plum - vintage
        { bg: '#ede6ee', text: '#5c3d5e', border: '#a888ab', accent: '#c8b0ca', dark: '#5c3d5e', darkText: '#ede6ee' },
        // Aged copper - weathered
        { bg: '#f0ebe4', text: '#6b5344', border: '#b8a08c', accent: '#d0c0aa', dark: '#6b5344', darkText: '#f0ebe4' },
        // Muted indigo - scholarly
        { bg: '#e8e8f0', text: '#3f3f5c', border: '#8888aa', accent: '#b0b0c8', dark: '#3f3f5c', darkText: '#e8e8f0' },
        // Sage green - pastoral
        { bg: '#e8ece4', text: '#4f5c44', border: '#99a888', accent: '#bcc8ae', dark: '#4f5c44', darkText: '#e8ece4' },
        // Russet - autumn tones
        { bg: '#f2e8e0', text: '#6b4433', border: '#b89070', accent: '#d4b498', dark: '#6b4433', darkText: '#f2e8e0' },
        // Charcoal - ink black
        { bg: '#e8e8e8', text: '#3a3a3a', border: '#8a8a8a', accent: '#b0b0b0', dark: '#3a3a3a', darkText: '#e8e8e8' },
        // Faded brick - weathered
        { bg: '#f0e4dc', text: '#7a4a42', border: '#c0908a', accent: '#d8b4ac', dark: '#7a4a42', darkText: '#f0e4dc' },
        // Antique gold - gilded
        { bg: '#f4f0e4', text: '#6b5c32', border: '#c0aa68', accent: '#d8c890', dark: '#6b5c32', darkText: '#f4f0e4' }
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
    books.forEach((book, index) => {
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

        // Add spine dimensions and style variants for bookshelf display
        const dimensions = calculateSpineDimensions(book.title, index);
        book.spineHeight = dimensions.height;
        book.spineWidth = dimensions.width;
        book.spineStyle = dimensions.styleVariant;
        book.spineFont = dimensions.fontVariant;

        // Apply subtle color variation to the spine color
        book.spineColor = adjustColor(categoryColors.dark, index);

        // Add publisher logo if applicable
        if (dimensions.publisherLogo) {
            book.hasPublisherLogo = true;
            book.publisherLogoSymbol = dimensions.publisherLogo.symbol;
            book.publisherLogoStyle = dimensions.publisherLogo.style;
        }
    });
    
    // Generate index page
    const shelves = organizeIntoShelves(books, 25);
    const indexData = {
        title: 'All Books',
        books: books,
        shelves: shelves,
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
            isCategories: true,
            // Ensure category colors are available
            categoryBg: book.categoryBg,
            categoryText: book.categoryText,
            categoryBorder: book.categoryBorder,
            categoryAccent: book.categoryAccent,
            categoryDark: book.categoryDark,
            categoryDarkText: book.categoryDarkText
        }));
        const categoryShelves = organizeIntoShelves(categoryBooks, 20);
        const categoryColors = getCategoryColors(category.name);
        const categoryData = {
            title: category.name,
            categoryName: category.name,
            books: categoryBooks,
            shelves: categoryShelves,
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
            includeScripts: false
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
            isAuthors: true,
            // Ensure category colors are available
            categoryBg: book.categoryBg,
            categoryText: book.categoryText,
            categoryBorder: book.categoryBorder,
            categoryAccent: book.categoryAccent,
            categoryDark: book.categoryDark,
            categoryDarkText: book.categoryDarkText
        }));
        const authorShelves = organizeIntoShelves(authorBooks, 5); // 5 covers per shelf
        const authorData = {
            title: author,
            authorName: author,
            books: authorBooks,
            shelves: authorShelves,
            isAuthors: true,
            basePath: '../',
            assetPath: isProduction ? '/books/' : '../'
        };
        
        const authorContent = mainLayout({
            ...authorData,
            body: authorTemplate(authorData),
            includeScripts: false
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
