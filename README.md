# 📚 Book Shelf Website

A beautiful, responsive static website to browse, filter, and search through your personal book collection. Built with vanilla HTML, CSS, and JavaScript, designed to work seamlessly with GitHub Pages.

## ✨ Features

- **📖 Complete Book Collection**: Displays all books from your CSV files
- **🔍 Advanced Search**: Search by title, author, or category
- **🎯 Smart Filtering**: Filter by category, language, location, and type
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🚀 Fast & Lightweight**: Pure static files, no external dependencies
- **🔄 Auto-deployment**: Automatically deploys to GitHub Pages via GitHub Actions

## 🏗️ Project Structure

```
book-shelf/
├── books/                    # Your CSV book files
│   ├── library.csv          # Physical library books
│   ├── kindle.csv           # Kindle books
│   ├── audible.csv          # Audible audiobooks
│   └── image1-12.csv        # Physical book images
├── .github/workflows/        # GitHub Actions
├── dist/                     # Generated website (auto-created)
├── build.js                  # Build script
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Website

```bash
npm run build
```

This will:
- Process all your CSV files
- Generate a static website in the `dist/` folder
- Create searchable and filterable book cards

### 3. Preview Locally

```bash
npm run dev
```

Open your browser to `http://localhost:8000`

### 4. Deploy to GitHub Pages

The website automatically deploys when you push to the main branch thanks to GitHub Actions!

## 📊 CSV Format Support

The build script automatically detects and handles both CSV formats:

### New Format (Recommended)
```csv
FirstName,LastName,Title,Category,Language,Location,Type
Alex,Gino,Melissa,Unknown,Unknown,library,book
```

### Legacy Format
```csv
Author,Title,Category,Language,Location,Type
"Gino, Alex",Melissa,Unknown,Unknown,library,book
```

## 🎨 Customization

### Colors and Styling
Edit `build.js` → `generateCSS()` function to customize:
- Color scheme
- Typography
- Layout spacing
- Card designs

### Layout and Features
Modify `build.js` → `generateHTML()` function to:
- Add new filter options
- Change the grid layout
- Add additional book metadata
- Include new sections

## 🔧 Build Process

The build script (`build.js`) does the following:

1. **Reads all CSV files** from the `books/` directory
2. **Normalizes data** to handle different CSV formats
3. **Generates metadata** (categories, languages, locations, types)
4. **Creates static files**:
   - `index.html` - Main website
   - `style.css` - Styling
   - `script.js` - Search and filter functionality
   - `books-data.json` - Raw book data

## 🌐 GitHub Pages Setup

1. **Enable GitHub Pages** in your repository settings
2. **Set source** to "GitHub Actions"
3. **Push to main branch** - the website will auto-deploy!

### Repository Settings
- Go to Settings → Pages
- Source: "GitHub Actions"
- Branch: Leave as default

## 📱 Mobile Optimization

The website is fully responsive and includes:
- Mobile-first design approach
- Touch-friendly interface
- Optimized layouts for small screens
- Fast loading on mobile networks

## 🔍 Search & Filter Features

### Search
- **Real-time search** as you type
- Searches across title, author, and category
- Case-insensitive matching

### Filters
- **Category**: Fiction, Nonfiction, Science Fiction, etc.
- **Language**: English, German, French, etc.
- **Location**: Library, Kindle, Audible, etc.
- **Type**: Book, Audiobook, etc.

### Combined Filtering
- Use multiple filters simultaneously
- Clear all filters with one click
- Live count updates

## 🛠️ Development

### Adding New Book Sources
1. Add your CSV file to the `books/` directory
2. Update the `csvFiles` array in `build.js`
3. Rebuild: `npm run build`

### Modifying the Design
1. Edit the CSS in `build.js` → `generateCSS()`
2. Modify HTML structure in `build.js` → `generateHTML()`
3. Add new JavaScript features in `build.js` → `generateJavaScript()`

### Testing Changes
```bash
npm run build
npm run dev
# Open http://localhost:8000
```

## 📈 Performance

- **Zero external dependencies** - pure vanilla JavaScript
- **Optimized CSS** - minimal, efficient styling
- **Fast search** - client-side filtering
- **Lightweight** - typically under 100KB total

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build && npm run dev`
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify as needed!

## 🆘 Troubleshooting

### Build Issues
- Ensure all CSV files exist in the `books/` directory
- Check CSV format matches expected structure
- Verify Node.js version 16+ is installed

### GitHub Pages Issues
- Check GitHub Actions tab for build logs
- Ensure repository has GitHub Pages enabled
- Verify the `gh-pages` branch is created

### Local Development Issues
- Clear browser cache
- Check browser console for JavaScript errors
- Verify `dist/` folder contains generated files

---

**Happy reading! 📚✨** 