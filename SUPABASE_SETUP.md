# Supabase Setup Guide for Floundermode Voting

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (free)
3. Create a new project
4. Choose a region close to your users
5. Set a database password (save it!)

### 2. Set Up Database
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to create the votes table

### 3. Get Your API Keys
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Update `scripts/supabase-voting.js`:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

### 4. Add Supabase to Your HTML
Add this to your `index.html` and term pages:
```html
<!-- Add before your main.js script -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="scripts/supabase-voting.js"></script>
<script src="scripts/main.js"></script>
```

### 5. Deploy to GitHub Pages
1. Commit and push your changes
2. GitHub Pages will automatically deploy
3. Your voting system will work with real-time updates!

## 🎯 Features You Get

✅ **Real-time voting** - Votes update instantly across all users  
✅ **Persistent storage** - Votes survive browser refreshes  
✅ **User tracking** - Prevents duplicate votes per user  
✅ **Automatic sorting** - Definitions sort by vote count  
✅ **Free hosting** - Works perfectly with GitHub Pages  
✅ **Scalable** - Handles thousands of votes  

## 🔧 Free Tier Limits

- **500MB database** (plenty for votes)
- **2GB bandwidth** per month
- **50,000 monthly active users**
- **Unlimited API requests**

## 🛠️ Troubleshooting

### Votes not showing?
1. Check browser console for errors
2. Verify your Supabase URL and key
3. Make sure the database schema was created

### Real-time not working?
1. Check if Row Level Security is enabled
2. Verify the policies are set correctly
3. Check browser console for subscription errors

### Fallback to localStorage?
Set `USE_SUPABASE = false` in `main.js` to use localStorage only.

## 🎉 That's it!

Your voting system is now powered by Supabase and works perfectly with GitHub Pages!
