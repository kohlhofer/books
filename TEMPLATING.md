# Handlebars Templating System

This project now uses **Handlebars.js** for templating, making it much more maintainable and organized.

## Directory Structure

```
templates/
├── layouts/           # Page layouts
│   └── main.hbs      # Main page layout
├── partials/          # Reusable components
│   ├── header.hbs     # Navigation header
│   ├── footer.hbs     # Footer
│   ├── book-card.hbs  # Individual book display
│   └── search-section.hbs # Search/filter controls
├── pages/             # Page-specific templates
│   ├── index.hbs      # All books page
│   ├── categories.hbs # Categories listing
│   ├── authors.hbs    # Authors listing
│   ├── category.hbs   # Individual category page
│   └── author.hbs     # Individual author page
└── styles/            # CSS files
    ├── base.css       # Base styles
    ├── layout.css     # Layout styles
    └── components.css # Component styles
```

## Key Benefits

### 1. **Reusable Components**
- **Navigation**: Update once in `header.hbs`, applies to all pages
- **Book Cards**: Consistent book display across all pages
- **Search Sections**: Unified search/filter interface

### 2. **Separation of Concerns**
- **HTML**: Templates focus on structure and data binding
- **CSS**: Organized into logical files (base, layout, components)
- **JavaScript**: Clean, focused functionality
- **Data**: Separated from presentation

### 3. **Easy Maintenance**
- **Add new pages**: Create new `.hbs` file in `pages/`
- **Update navigation**: Edit `partials/header.hbs`
- **Change styling**: Modify specific CSS files
- **Add features**: Update templates without touching build logic

### 4. **Consistent Structure**
- All pages use the same layout
- Consistent navigation and footer
- Unified styling approach
- Standardized data flow

## How It Works

### Build Process
1. **Load Templates**: Handlebars compiles `.hbs` files
2. **Register Partials**: Components are available across templates
3. **Process Data**: CSV files are parsed into structured data
4. **Generate Pages**: Templates are rendered with data
5. **Output Files**: Static HTML, CSS, and JS are generated

### Template Features
- **Partials**: `{{> component-name}}` for reusable components
- **Conditionals**: `{{#if condition}}...{{/if}}` for dynamic content
- **Loops**: `{{#each items}}...{{/each}}` for lists
- **Helpers**: Custom functions like `{{slugify text}}`
- **Data Binding**: `{{variable}}` for dynamic content

## Usage Examples

### Adding a New Page
1. Create template in `templates/pages/new-page.hbs`
2. Add page generation logic to `build-handlebars.js`
3. Include navigation link in `partials/header.hbs`

### Updating Navigation
1. Edit `templates/partials/header.hbs`
2. Rebuild with `npm run build`
3. Changes apply to all pages automatically

### Modifying Styles
1. Edit appropriate CSS file in `templates/styles/`
2. Rebuild to regenerate `dist/style.css`
3. Styles apply consistently across all pages

## Migration from Old System

- **Old build script**: `build.js` (kept as `build:old`)
- **New build script**: `build-handlebars.js` (default)
- **All functionality**: Preserved and enhanced
- **File structure**: Much cleaner and organized

## Commands

```bash
# Build with new templating system
npm run build

# Build with old system (if needed)
npm run build:old

# Start development server
npm run dev

# Clean dist directory
npm run clean
```

## Future Enhancements

- **Theme System**: Easy switching between visual themes
- **Internationalization**: Multi-language support
- **Plugin System**: Modular feature additions
- **Build Optimization**: Faster builds and better caching
- **Development Mode**: Hot reloading for template changes

---

The new templating system makes this project much more professional and maintainable. Each component has a single source of truth, making updates quick and error-free.
