# Autonomous AI Persona Agent

This repository is a Node.js autonomous publishing agent that:
- initializes an AI persona,
- fetches candidate AI/tech topics from Hacker News,
- judges whether a topic is worth publishing,
- writes a short post in a consistent persona voice,
- stores posts in PostgreSQL,
- and supports manual and scheduled generation.

## How it works

- `POST /api/agent/init`
  - creates a new agent record and returns `agentId`
- `GET /api/agent/feed`
  - returns the agent's published posts
- `POST /api/agent/generate`
  - fetches candidate topics, asks Gemini AI to judge them, and stores one accepted post

## Important files

- `server.js` — Express API server and static assets.
- `db.js` — Postgres schema, queries, and persistence.
- `generate.js` — topic fetch, judgment, and publish workflow.
- `persona.js` — editor persona prompt with publication rules and voice.
- `.github/workflows/cron.yml` — scheduled GitHub Actions workflow for generation.
- `PROMPTS.md` — prompt history and usage log for evaluation.
- `.env.example` — local environment variable example.

## Requirements

- Node.js 18+
- Gemini API key set in `GEMINI_API_KEY`
- PostgreSQL accessible via `DATABASE_URL`

## Local setup

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
copy .env.example .env
```

Edit `.env` and set:

```text
GEMINI_API_KEY=your-key-here
DATABASE_URL=your-postgres-url-here
PORT=3000
```

Start the server:

```bash
npm start
```

## Verify locally

### Initialize the agent

```bash
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
```

Expected response:

```json
{"agentId":"<some-uuid>"}
```

### Check the feed

```bash
curl "http://localhost:3000/api/agent/feed?agentId=PASTE_ID_HERE"
```

### Trigger generation manually

```bash
curl -X POST http://localhost:3000/api/agent/generate \
  -H "Content-Type: application/json" \
  -d '{"agentId":"PASTE_ID_HERE"}'
```

If the app rejects most topics, that's expected. The goal is to publish only the most suitable content.

## Deployment notes

This app is built to work with a persistent Postgres database. Render is a recommended host because it supports long-running services and managed Postgres.

### Render deployment

1. Create a Render Postgres instance.
2. Create a Render Web Service for this repo.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables:
   - `GEMINI_API_KEY`
   - `DATABASE_URL`
6. Deploy and confirm the app responds.

`db.js` automatically creates the `agents` and `posts` tables on first request.

## Scheduler setup

The workflow at `.github/workflows/cron.yml` calls `/api/agent/generate` every 20 minutes.

Add these repository secrets in GitHub:
- `APP_URL` — deployed app base URL without a trailing slash
- `AGENT_ID` — the agent ID returned from `/api/agent/init`

Run the workflow manually from Actions once to confirm it works.

## Troubleshooting

- `DATABASE_URL` missing or invalid: the app cannot connect to the database.
- `relation "agents" does not exist`: schema creation failed or DB connection failed.
- Empty feed after generation: the agent may have judged no candidate worthy of publishing.
- Repeated content: `generate.js` uses `getRecentTitles` to avoid duplicates.

## Notes

- `generate.js` fetches candidates from Hacker News Algolia and evaluates them in a single Gemini call.
- `persona.js` defines the editorial voice, acceptance rules, and rejection behavior.
- `public/` is served statically by Express and can host optional UI assets.

## Quick command summary

```bash
npm install
copy .env.example .env
npm start
```

Then use:

```bash
curl -X POST http://localhost:3000/api/agent/init -H "Content-Type: application/json" -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
curl "http://localhost:3000/api/agent/feed?agentId=PASTE_ID_HERE"
curl -X POST http://localhost:3000/api/agent/generate -H "Content-Type: application/json" -d '{"agentId":"PASTE_ID_HERE"}'
```
