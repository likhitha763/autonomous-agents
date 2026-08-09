# Autonomous AI Persona Agent

Built for the "Autonomous AI Creator" hackathon track. An agent that discovers
AI/tech topics, judges whether they're worth publishing, writes in a
consistent persona voice, remembers what it already posted, and keeps
publishing on a schedule with zero human input after initialization.

## Stack (and why)

| Piece | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | Minimal, predictable, every AI tool generates it cleanly |
| Storage | Render Postgres (free) | Same platform as hosting, no extra account, actually persists — Render's free web services have an ephemeral filesystem, so a local file would silently lose data on every restart |
| AI model | Google Gemini API | Does the actual editorial judgment + writing |
| Topic source | Hacker News Algolia API | Free, no API key, no rate limits, real current AI/tech discussion |
| Scheduler | GitHub Actions cron | Runs outside your app, so it keeps firing even if your server hiccups. Leaves a visible run history as proof of autonomous operation |
| Hosting | Render (web service) | Persistent container — **do not use Vercel or other serverless hosts** |

## Prerequisites

- Node.js 18+ installed locally (to test before deploying)
- A GitHub account + a new repo for this project
- A Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) — free tier, no card required
- A Render account (free tier is fine)

## Step 1 — Run it locally first

You'll need a Postgres database to test against locally too — easiest is to
create the free Render Postgres instance first (Step 4a below), copy its
"External Database URL" from the Render dashboard, and use that locally as
well as in production.

```bash
npm install
cp .env.example .env
# edit .env: paste your real GEMINI_API_KEY and DATABASE_URL
npm start
```

In another terminal, verify the two required endpoints work:

```bash
# Initialize the agent
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
# → should return {"agentId":"<some-uuid>"}

# Check the feed (use the agentId you got back above)
curl "http://localhost:3000/api/agent/feed?agentId=PASTE_ID_HERE"
# → should return {"posts":[]}
```

If both of these work, move on. If either errors, fix it here — don't deploy
a broken version and debug in production.

## Step 2 — Manually trigger a generation cycle

```bash
curl -X POST http://localhost:3000/api/agent/generate \
  -H "Content-Type: application/json" \
  -d '{"agentId":"PASTE_ID_HERE"}'
```

Run this 5-10 times. Read the actual response:
- Does it sometimes **reject** topics? If everything gets published, the
  editorial judgment isn't real — go tighten `persona.js`.
- Does the writing sound consistent, like one voice, not generic AI summary text?
- Does `sources` contain a real, working URL?

Then re-check the feed — accepted posts should now show up.

## Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "initial working version: init/feed/generate endpoints"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

Commit incrementally as you build, not all at once at the end — the
hackathon's authenticity review checks whether your commit history shows
real, steady work.

## Step 4 — Deploy to Render

### Step 4a — Create the database first
1. Render Dashboard → New → Postgres. Free tier is fine.
2. Once it's created, copy the **Internal Database URL** (you'll use this
   one, not the external one, since your web service will live on the same
   Render network — it's faster and doesn't count against external
   bandwidth).

### Step 4b — Create the web service
1. Render Dashboard → New → Web Service → connect your GitHub repo.
2. Build command: `npm install`. Start command: `npm start`.
3. Add environment variables:
   - `GEMINI_API_KEY` = your real key
   - `DATABASE_URL` = the Internal Database URL from Step 4a
4. Deploy. You'll get a public URL like `https://your-app.onrender.com`.
5. Re-run the Step 1 and Step 2 curl commands against that public URL instead
   of localhost, to confirm it works when deployed, not just on your machine.
   The very first request will be slower (free tier cold start + schema
   creation) — that's expected.

## Step 5 — Wire up the scheduler

1. In your GitHub repo: Settings → Secrets and variables → Actions
2. Add two repository secrets:
   - `APP_URL` = your deployed URL (no trailing slash), e.g. `https://your-app.onrender.com`
   - `AGENT_ID` = the real agentId you got from calling `/init` in production
3. The workflow file at `.github/workflows/cron.yml` is already set up to
   call `/api/agent/generate` every 3 hours.
4. Go to the Actions tab → find the workflow → click "Run workflow" to
   trigger it manually once, and confirm it succeeds.

## Step 6 — The test that actually matters

Walk away for 4-6 hours. Don't touch the project. Come back and:

```bash
curl "https://your-app.onrender.com/api/agent/feed?agentId=YOUR_AGENT_ID"
```

Also worth knowing: Render's free web services spin down after 15 minutes of
no traffic and take ~30-50 seconds to wake back up on the next request. That
won't lose your data anymore (Postgres persists independently), but it does
mean the *very first* poll after a quiet period will be slow — not broken,
just cold-starting. If you want to avoid that for the evaluation window, a
free uptime-pinger (e.g. cron-job.org hitting your `/feed` URL every 10 min)
keeps it warm; not required, just smoother.

Did new posts appear that you didn't manually trigger? Check the GitHub
Actions tab too — did the scheduled runs actually fire and succeed, not just
run without crashing? Do this with time left before the deadline, so you can
still fix it if the cron didn't work.

## Troubleshooting checklist

- **Feed returns empty after every deploy/restart** → check `DATABASE_URL`
  is actually set in Render's environment variables, not just your local
  `.env`. If it's missing, the app is silently failing DB calls.
- **"relation does not exist" error** → the schema didn't get created. This
  runs automatically on first request (`ensureSchema()` in `db.js`) — check
  the Render logs for a connection error happening before that.
- **Cron runs show green but no new posts appear** → open the actual run
  log, not just the pass/fail status. A silently-failing API call can still
  "succeed" as an HTTP request.
- **Every topic gets published, nothing rejected** → your persona prompt
  isn't enforcing standards. Tighten the rejection criteria in `persona.js`.
- **Same topic posted twice** → check `getRecentTitles` is actually being
  passed into the judgment prompt, and that the model is respecting it.

## Files

- `server.js` — the two required endpoints (`/init`, `/feed`) + manual `/generate` trigger
- `db.js` — storage layer
- `persona.js` — **the actual judged intelligence** — edit this to develop your voice
- `generate.js` — the generation cycle: fetch topics → judge → store
- `.github/workflows/cron.yml` — the external scheduler
- `PROMPTS.md` — required AI usage log for submission
