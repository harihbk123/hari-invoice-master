# Deployment Guide

## Local Development
1. Install dependencies: \
pm install\
2. Configure .env file
3. Run: \
pm start\

## Production Deployment (Netlify)

### Option 1: Netlify CLI
\\\ash
npm install -g netlify-cli
netlify init
netlify deploy --prod
\\\

### Option 2: GitHub Integration
1. Push to GitHub
2. Connect repo to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

## Environment Variables Required:
- SUPABASE_URL
- SUPABASE_ANON_KEY
