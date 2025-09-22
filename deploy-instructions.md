# 🚀 Floundermode Dictionary - Vercel Deployment

## Quick Deploy Commands:

1. **Login to Vercel (if not done already):**
   ```bash
   vercel login
   ```

2. **Deploy to production:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard:**
   - Go to: https://vercel.com/dashboard
   - Find your project → Settings → Environment Variables
   - Add:
     - AIRTABLE_TOKEN = [your token from .env]
     - AIRTABLE_BASE_ID = [your base ID from .env]

## After Deployment:
- Your site will be live at: https://your-project-name.vercel.app
- API endpoints will be: https://your-project-name.vercel.app/api/terms
- Test with: https://your-project-name.vercel.app/api/terms\?health\=true

## Troubleshooting:
- Check Vercel function logs if API fails
- Verify environment variables are set correctly
- Ensure Airtable permissions allow API access
