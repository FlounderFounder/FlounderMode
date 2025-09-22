# Floundermode Dictionary - Project Structure

This project has been organized into a clean, maintainable folder structure.

## 📁 Folder Structure

```
default-site-2/
├── assets/                    # Static assets (images, icons)
│   ├── carter-wynn.png
│   └── dark_carter_wynn.png
├── pages/                     # Individual term pages
│   ├── dashboard-fatigue.html
│   ├── founder-gut.html
│   ├── meta-investment.html
│   ├── mvp-theater.html
│   └── vibe-driven-dev.html
├── scripts/                   # JavaScript files
│   ├── bad-words.js
│   ├── easy-mode.js
│   ├── main.js
│   └── simple-profanity-filter.js
├── styles/                    # CSS stylesheets
│   ├── easy-mode.css
│   └── main.css
├── terms/                     # Individual term JSON files
│   ├── dashboard-fatigue.json
│   ├── founder-gut.json
│   ├── meta-investment.json
│   ├── mvp-theater.json
│   └── vibe-driven-dev.json
├── index.html                 # Main dictionary page
├── favicon.ico               # Site icon
├── package.json              # Node.js dependencies
└── CONTRIBUTING.md           # Contribution guidelines
```

## 🔄 How It Works

### Data Structure
- Each term has its own JSON file in the `/terms/` directory
- The main application loads all terms from individual JSON files
- This allows for easier maintenance and version control

### Page Structure
- Individual term pages are organized in the `/pages/` directory
- Each page has a clean URL structure: `/pages/term-name.html`
- All pages share the same styling and navigation

### Navigation
- Main dictionary: `/` (index.html)
- Individual terms: `/pages/term-name.html`
- Back navigation from term pages to main dictionary

## 🚀 Adding New Terms

1. Create a new JSON file in `/terms/` with the term data
2. Add the filename to the `termFiles` array in `/scripts/main.js`
3. Create a corresponding HTML page in `/pages/`
4. Update the main.js file to include the new term

## 🎨 Styling

- All pages use the same CSS files from `/styles/`
- Dark mode support across all pages
- Mobile-responsive design
- Consistent navigation and branding

## 📱 Features

- **Search functionality** on the main page
- **Individual term pages** with detailed information
- **Dark mode toggle** on all pages
- **Mobile responsive** design
- **Easy mode** for adding new terms
- **Random term** selection
