# CareerAiHub — Deployment Guide
Version: Final · Audit: 65/65 checks passed · March 2026

## Files in this package

```
careeraihub/
├── index.html              ← Landing page (careeraihub.com)
├── app/
│   ├── index.html          ← App loader (careeraihub.com/app)
│   └── dream-job-ai.jsx    ← React app (all 10 AI modules)
├── nginx.conf              ← Nginx config reference
├── deploy.sh               ← Automated server setup script
└── README.md               ← This file
```

---

## BEFORE YOU DEPLOY — Required Steps

### Step A: Run Supabase SQL (one time, 2 minutes)
1. Go to: https://supabase.com/dashboard/project/ruibdsvrcctxgxctaxwe
2. Click **SQL Editor** → **New Query**
3. Paste the contents of `supabase_setup.sql`
4. Click **Run**
5. You should see: "Success. No rows returned"

This creates 7 tables: profiles, user_memory, resume_scans, applications,
star_stories, jd_analyses, cover_letters — all with Row Level Security.

### Step B: Disable Email Confirmation (important for MVP)
1. Supabase dashboard → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** → **OFF**
3. Save

Without this, users can't sign in until they verify email — kills conversion.

### Step C: Add API Keys (optional but recommended)
Open `app/dream-job-ai.jsx` and find `const LLM_KEYS` near the top:

```js
const LLM_KEYS = {
  claude : "sk-ant-YOUR_CLAUDE_KEY_HERE",   // ← Add your Anthropic key
  openai : "sk-YOUR_OPENAI_KEY_HERE",       // ← Add for Cover Letter + Rejection Coach
  gemini : "YOUR_GEMINI_KEY_HERE",          // ← Add for Insight Banner + Job Search Intel
};
```

- Claude key: https://console.anthropic.com → API Keys
- OpenAI key: https://platform.openai.com/api-keys
- Gemini key: https://aistudio.google.com/app/apikey

**Note:** Without OpenAI/Gemini keys, those modules fall back to Claude Haiku
automatically. The app still works — just slightly higher cost per call.

---

## Deployment Steps

### Step 1 — Point DNS to your VPS

In your domain registrar DNS settings:
```
Type: A  |  Name: @    |  Value: YOUR_VPS_IP  |  TTL: 300
Type: A  |  Name: www  |  Value: YOUR_VPS_IP  |  TTL: 300
```

Find VPS IP: Hostinger dashboard → VPS → your server → IP address

### Step 2 — SSH into VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 3 — Run setup script
```bash
# Upload script from local machine
scp deploy.sh root@YOUR_VPS_IP:/root/

# SSH in and run
ssh root@YOUR_VPS_IP
chmod +x /root/deploy.sh
bash /root/deploy.sh
```

When prompted, enter:
- Domain: `careeraihub.com`
- Email: your email (for SSL certificate)

### Step 4 — Upload all files
Run from your LOCAL machine:

```bash
# Landing page
scp index.html root@YOUR_VPS_IP:/var/www/careeraihub/index.html

# App folder (both files)
scp app/index.html root@YOUR_VPS_IP:/var/www/careeraihub/app/index.html
scp app/dream-job-ai.jsx root@YOUR_VPS_IP:/var/www/careeraihub/app/dream-job-ai.jsx

# Fix permissions
ssh root@YOUR_VPS_IP "chown -R www-data:www-data /var/www/careeraihub && chmod -R 755 /var/www/careeraihub"
```

### Step 5 — Verify
- `https://careeraihub.com` → Landing page
- `https://careeraihub.com/app` → Full AI platform
- `https://www.careeraihub.com` → Redirects to non-www

---

## URL Structure

| URL | What it shows |
|-----|--------------|
| `careeraihub.com` | Landing page (index.html) |
| `careeraihub.com/app` | React app (all 10 AI modules) |
| `careeraihub.com/app/` | Same as above |

All buttons on the landing page link to `/app`.

---

## How the App Works (Technical)

The app (`dream-job-ai.jsx`) is a React single-page app that:
- Loads in the browser via Babel CDN (no build step needed)
- Calls Anthropic API directly from the browser
- Calls Supabase API directly from the browser
- Stores user session in localStorage (token)
- Stores all data in Supabase cloud database

**No backend server needed.** Nginx just serves static files.

---

## Useful VPS Commands

```bash
# Reload Nginx after config changes
systemctl reload nginx

# Test Nginx config
nginx -t

# View Nginx error log
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Renew SSL manually (auto-renews via cron)
certbot renew --dry-run
```

---

## File Locations on VPS

| File | Path |
|------|------|
| Landing page | `/var/www/careeraihub/index.html` |
| App loader | `/var/www/careeraihub/app/index.html` |
| React app | `/var/www/careeraihub/app/dream-job-ai.jsx` |
| Nginx config | `/etc/nginx/sites-available/careeraihub` |
| SSL certs | `/etc/letsencrypt/live/careeraihub.com/` |
| Nginx logs | `/var/log/nginx/` |

---

## Troubleshooting

**"502 Bad Gateway"**
→ Files not uploaded: `ls /var/www/careeraihub/`

**"SSL certificate not found"**
→ Run: `certbot certonly --nginx -d careeraihub.com -d www.careeraihub.com`

**"DNS not resolving"**
→ Check: `nslookup careeraihub.com` — DNS can take 5–30 min to propagate

**"App loads but auth fails"**
→ Check: Supabase SQL was run, email confirmation disabled

**"AI not responding"**
→ Check: Anthropic API key in LLM_KEYS.claude, or rate limit hit

**"Permission denied on upload"**
→ Run: `chown -R www-data:www-data /var/www/careeraihub && chmod -R 755 /var/www/careeraihub`

---

## Support
GitHub: github.com/ivythaophuong/AI-Jobkicker
Email: hello@careeraihub.com
