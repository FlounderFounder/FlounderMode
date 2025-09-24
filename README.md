# Floundermode Dictionary

A comprehensive dictionary of internet slang, memes, and digital culture terminology with **real-time voting** powered by Supabase.

## 🚀 Features

- **Real-time voting** - Vote counts update instantly across all users
- **Persistent storage** - Votes are saved in Supabase database
- **Automatic sorting** - Definitions sort by vote count (highest first)
- **GitHub Pages ready** - Deploys as a static site
- **Responsive design** - Works on desktop and mobile
- **Dark mode** - Toggle between light and dark themes

## 🛠️ Setup

### 1. Supabase Setup
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL schema from `supabase-schema.sql`
4. Get your API keys from Settings → API
5. Update `scripts/supabase-voting.js` with your keys

### 2. Local Development
```bash
# Install dependencies
npm install

# Start local server
npm run dev
# or
python3 -m http.server 8000
```

### 3. Deploy to GitHub Pages
1. Push to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Your site will be live at `https://username.github.io/repository-name`

## 📁 Project Structure

```
├── scripts/
│   ├── main.js              # Main application logic
│   ├── supabase-voting.js   # Supabase integration
│   └── easy-mode.js         # Contribution system
├── styles/
│   ├── main.css            # Main styles
│   ├── definitions.css     # Definition-specific styles
│   └── voting-ui.css       # Voting interface styles
├── terms/                  # JSON files for each term
├── pages/                  # Generated individual term pages
└── supabase-schema.sql     # Database setup
```

## 🎯 How It Works

1. **Supabase** stores all votes in a PostgreSQL database
2. **Real-time subscriptions** update vote counts instantly
3. **localStorage fallback** works if Supabase is unavailable
4. **GitHub Pages** serves the static site
5. **No backend server** needed!

## 🔧 Configuration

- Set `USE_SUPABASE = false` in `main.js` to use localStorage only
- Update Supabase URL and keys in `supabase-voting.js`
- Modify vote sorting logic in `generateDefinitionsHtml()`

## 📊 Free Tier Limits

- **Supabase**: 500MB database, 50k users/month
- **GitHub Pages**: Unlimited bandwidth
- **Perfect for** small to medium sites

## 🎉 That's it!

Your voting dictionary is ready to go live!