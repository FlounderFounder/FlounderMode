# Contributing to Floundermode Dictionary

Welcome to the Floundermode Dictionary! This guide will help you contribute new terms using our streamlined process.

## 🚀 Quick Start

### Option 1: One-Click Contribution (Recommended)
1. Visit the [Floundermode Dictionary](https://your-site-url.com)
2. Click the **"Contribute"** button
3. Fill out the easy mode form with your term details
4. Click **"Create PR Automatically"** - this will:
   - Open GitHub with your term pre-filled
   - Create the JSON file automatically
   - Fill in the PR title and description
   - Submit the pull request

### Option 2: Manual Contribution
1. Fork this repository
2. Create a new JSON file in the `terms/` directory
3. Follow the file format guidelines below
4. Create a pull request

## 📝 File Format

Each term should be a separate JSON file in the `terms/` directory with this structure:

```json
{
  "term": "Your Term Name",
  "definition": "Clear, concise definition (max 200 characters)",
  "usage": "Example sentence showing how to use it (max 150 characters)",
  "related": ["Tag1", "Tag2", "Tag3", "Tag4"]
}
```

### Naming Convention
- Use kebab-case for filenames: `my-awesome-term.json`
- Keep filenames descriptive but concise
- Avoid special characters except hyphens

### Field Requirements
- **term**: The actual term/phrase (max 50 characters)
- **definition**: What it means (max 200 characters)
- **usage**: Example sentence (max 150 characters)
- **related**: Array of related tags (max 4 tags)

## 🤖 Automated Workflow

When you create a pull request with new term files, the system will automatically:

1. ✅ **Validate JSON format** - Ensures all files are properly formatted
2. ✅ **Check for duplicates** - Prevents duplicate terms
3. ✅ **Generate HTML pages** - Creates individual HTML pages for all terms
4. ✅ **Update terms manifest** - Automatically updates the terms-manifest.json file
5. ✅ **Sync with Supabase** - Initializes new definitions in the voting database

### Dynamic Term Loading

The site now uses a dynamic term loading system that:
- Reads from `terms-manifest.json` to discover available terms
- Automatically loads new terms without code changes
- Initializes voting data in Supabase for new definitions
- Falls back to hardcoded list if manifest is unavailable

### Adding New Terms

When you add a new term:

1. **Create the JSON file** in the `terms/` directory
2. **Run `node generate-pages.js`** to update the manifest and generate pages
3. **The site will automatically**:
   - Load the new term from the manifest
   - Initialize it in Supabase for voting
   - Generate the individual HTML page
   - Update the carousel and search functionality

### Supabase Integration

New definitions are automatically:
- **Detected** when terms are loaded
- **Initialized** in the Supabase votes table
- **Ready for voting** immediately after deployment

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/FlounderFounder/FlounderMode.git
cd FlounderMode

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Validation and HTML Generation
Before submitting a PR, validate your terms and generate HTML pages locally:

```bash
# Validate JSON files
npm run validate

# Generate HTML pages for all terms
npm run generate-html
```

**Validation checks:**
- JSON format validity
- Required fields presence
- Field length limits
- Duplicate term detection

**HTML Generation:**
- Creates individual HTML pages in `pages/` directory
- Uses the same template as existing term pages
- Automatically handles proper linking and navigation

## 📋 Contribution Guidelines

### Content Standards
- **Be accurate**: Definitions should be precise and helpful
- **Be concise**: Keep definitions under 200 characters
- **Be relevant**: Terms should relate to startup/tech culture
- **Be respectful**: No offensive or inappropriate content

### Quality Checklist
- [ ] Term is unique and not already in the dictionary
- [ ] Definition is clear and concise (≤200 chars)
- [ ] Usage example demonstrates the term appropriately (≤150 chars)
- [ ] Related tags are relevant and helpful (≤4 tags)
- [ ] Filename follows kebab-case convention
- [ ] JSON file is valid and properly formatted

### Examples

**Good Term:**
```json
{
  "term": "Feature Creep",
  "definition": "When a project keeps adding new features instead of finishing the core functionality.",
  "usage": "We started with a simple app, but feature creep turned it into a monster.",
  "related": ["Product Management", "Scope", "Deadlines"]
}
```

**Bad Term:**
```json
{
  "term": "Something Really Long That Should Be Shorter Because It Exceeds The Character Limit",
  "definition": "This definition is way too long and exceeds the 200 character limit that we have set for definitions in this dictionary. It should be much more concise and to the point.",
  "usage": "This usage example is also way too long and exceeds the 150 character limit that we have set for usage examples in this dictionary.",
  "related": ["Too", "Many", "Tags", "Here", "And", "More"]
}
```

## 🔄 Workflow Process

### Automated Workflow (Recommended)
1. **Fill Form**: Complete the easy mode form on the website
2. **One-Click**: Click "Create PR Automatically" button
3. **GitHub Opens**: Browser opens GitHub with everything pre-filled
4. **Submit**: Click "Propose new file" on GitHub
5. **Done**: The system handles the rest automatically!

### Manual Workflow
1. **Create/Fork**: Fork the repository or create a new branch
2. **Add Term**: Create your term JSON file in `terms/`
3. **Validate**: Run `npm run validate` locally
4. **Generate HTML**: Run `npm run generate-html` locally (optional)
5. **Commit**: Commit your changes with a descriptive message
6. **PR**: Create a pull request
7. **Review**: The system will validate, generate HTML, and provide feedback
8. **Merge**: Once approved, your term will be live with both JSON and HTML files!

## 🐛 Troubleshooting

### Common Issues

**"Invalid JSON" Error**
- Check for missing commas, quotes, or brackets
- Use a JSON validator online
- Ensure all strings are properly quoted

**"Duplicate Term" Error**
- Search existing terms to avoid duplicates
- Check for similar terms that might conflict
- Consider variations or synonyms

**"Field Too Long" Error**
- Shorten your definition or usage example
- Remove unnecessary words
- Focus on the essential meaning

### Getting Help
- Check existing issues on GitHub
- Create a new issue for bugs or questions
- Join our community discussions

## 📚 Resources

- [JSON Format Guide](https://www.json.org/)
- [GitHub Pull Request Guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests)
- [Markdown Cheat Sheet](https://www.markdownguide.org/cheat-sheet/)

## 🎉 Recognition

Contributors will be recognized in:
- The site's contributor section
- Release notes for significant contributions
- Community highlights

Thank you for contributing to the Floundermode Dictionary! 🚀