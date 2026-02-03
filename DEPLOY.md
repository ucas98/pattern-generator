# Deploy Pattern Generator to Railway

## What You Need
- GitHub account
- Railway account (sign up at railway.app - it's free to start)

## Step-by-Step Deployment

### 1. Push to GitHub
```bash
# In your project folder with these files:
# - pattern-generator.html
# - server.js
# - package.json

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Click "Deploy from GitHub repo"
4. Select your pattern-generator repo
5. Railway will auto-detect it's a Node.js app

### 3. Add Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically connects it via DATABASE_URL

### 4. Get Your URL

1. Click on your app service
2. Go to "Settings"
3. Click "Generate Domain"
4. Your app will be live at: `your-app.railway.app`

## That's It!

Your pattern generator is now live with:
- ✅ Postgres database (patterns persist)
- ✅ Automatic HTTPS
- ✅ Free hosting (Railway free tier)

## Testing

Visit: `https://your-app.railway.app`

The app will:
- Load the pattern generator
- Automatically connect to the API
- Save patterns to Postgres
- Fall back to localStorage if API fails

## No Docker Required!

Railway handles everything automatically. Just push your code and it works.
