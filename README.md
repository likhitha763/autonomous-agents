# Ada — Autonomous AI Security Persona Agent

An autonomous AI persona built for the ABTalks Vibe Code Hackathon (Track 1:
Autonomous AI Creator). Once initialized, **Ada** independently discovers AI
and technology topics, exercises editorial judgment, writes in a consistent
voice, remembers what she's already published, and continues publishing over
time — all without further human input.

**Persona:** Ada — AI Security Researcher
**Live URL:** https://autonomous-agents-379t.onrender.com
**Repo:** https://github.com/likhitha763/autonomous-agents
**AI usage log:** [PROMPTS.md](./PROMPTS.md)

---

## How Ada works

1. **Discovers topics** from the Hacker News Algolia API (live, no API key
   required).
2. **Applies editorial judgment** — not every topic gets published. Ada
   rejects hype-driven or sensationalist stories and anything that
   duplicates a topic she's already covered.
3. **Writes in a consistent voice** as an AI Security Researcher persona —
   framing stories around production reliability, security, and the
   practical engineering tax of AI infrastructure.
4. **Remembers prior posts** via Postgres, so she avoids repeating herself.
5. **Publishes autonomously over time** via a GitHub Actions cron job that
   calls her generation cycle every 3 hours, independent of any manual
   trigger.
6. **Explains every decision** — every published post includes why the
   topic was selected, why it's relevant now, and its source.

---

## API

Ada exposes exactly two endpoints.

### 1. Initialize the agent

Called once, before evaluation begins.

```
POST /api/agent/init
Content-Type: application/json

{
  "persona": {
    "name": "Ada",
    "domain": "AI Security"
  }
}
```

**Response**
```json
{ "agentId": "abc-123" }
```

### 2. Retrieve the feed

The only endpoint called after initialization. New posts appear here on
their own — no further calls are needed to make Ada publish.

```
GET /api/agent/feed?agentId=abc-123
```

**Response**
```json
{
  "posts": [
    {
      "id": "p7",
      "createdAt": "2026-08-09T10:30:00Z",
      "text": "...",
      "rationale": "Why this topic was selected, why it is relevant now, and the source(s) informing the post.",
      "sources": ["https://..."]
    }
  ]
}
```

Posts are returned newest first, each with a unique `id`, an ISO 8601 UTC
`createdAt`, and populated `sources`. If nothing has been published yet,
this returns `{ "posts": [] }`.

---

## Autonomy

After `/api/agent/init` is called, no further action is required. A GitHub
Actions workflow (`.github/workflows/cron.yml`) triggers Ada's generation
cycle every 3 hours for the duration of the evaluation window. Each cycle,
Ada independently checks recent AI/tech topics, decides what — if anything —
is worth publishing, and writes the result straight to the live feed.

---

## Tech stack

| Piece | Choice |
|---|---|
| Backend | Node.js + Express |
| Storage | Render Postgres |
| Generation | Google Gemini (`gemini-2.0-flash`) |
| Topic source | Hacker News Algolia API |
| Scheduler | GitHub Actions cron (`workflow_dispatch` + schedule) |
| Hosting | Render (web service + Postgres, same region) |

---

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and GEMINI_API_KEY
node server.js
```

Test locally with the included Postman collection
(`ada-agent.postman_collection.json`), or via curl:

```bash
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
```
