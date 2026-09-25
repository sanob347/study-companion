# Study Companion — MVP setup (phone workflow)

## What's here
- Login (magic link, no password)
- 11-question onboarding
- API route that turns answers into a learning profile using Groq
  (key stays server-side, never touches the browser)
- Placeholder dashboard showing the generated summary

## 1. Get a Groq API key
Go to console.groq.com → API Keys → create one. Free tier is enough for now.

## 2. Put the code on GitHub (from your phone browser)
1. Create a new **empty** repository on github.com (e.g. `study-companion`).
2. Use GitHub's web file editor ("Add file" → "Create new file") to recreate
   this same folder structure and paste each file's content in.
   Easiest order: create `package.json` first, then the rest.
3. Keep the exact folder paths (e.g. `app/onboarding/page.tsx`).

If typing every file by hand on a phone browser is painful, the GitHub
mobile app also lets you create files — same process, just a nicer editor.

## 3. Deploy on Vercel
1. Go to vercel.com, sign in, **Add New → Project**.
2. Import the GitHub repo you just made.
3. Before deploying, add these **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase → Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same page, the `anon` `public` key
   - `GROQ_API_KEY` — from step 1 (no `NEXT_PUBLIC_` prefix — keeps it off the browser)
4. Deploy.

## 4. Supabase auth setting
In Supabase → Authentication → URL Configuration, set:
- Site URL: your Vercel URL (e.g. `https://study-companion.vercel.app`)
- Add `https://your-vercel-url/onboarding` under Redirect URLs

Without this, the magic-link email will redirect somewhere wrong.

## 5. Test it
Open your deployed URL → Get started → enter your email → open the link
from your email app → answer the 11 questions → you should land on
`/dashboard` with an AI-written summary.

## Notes
- The onboarding API route calls `increment_ai_usage()` before calling Groq
  — if a student hits 50 AI calls in a day it returns a 429 with a clear
  message instead of silently failing.
- Subjects typed into onboarding get inserted into the `subjects` table
  automatically (comma-separated free text, split on commas).
