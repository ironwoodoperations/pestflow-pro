# PestFlow Pro

White-label SaaS platform for pest control companies.

## Deploy
1. Connect repo at vercel.com/new
2. Add env vars in Vercel dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_ANTHROPIC_API_KEY
   - VITE_TENANT_ID
3. Every push to main auto-deploys.

## Dev
```bash
npm run dev   # localhost:8080
npm run build # production build
```
