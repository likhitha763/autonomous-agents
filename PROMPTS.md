# PROMPTS.md — AI Usage Log

This documents the actual prompts used to build this project, via Claude,
in the order they happened. Kept close to the original wording — trimmed of
filler/repetition where a prompt overlapped with an earlier one, not
rewritten or polished.

---

## 1. Starting point

Tool: Claude
Prompt:
"i am participating vicodathon - vibe coding hackathon , help me with it"

Outcome: Established this is the ABTalks Vibe Code Hackathon, three problem
statements available. Picked Track 1 (Autonomous AI Creator), 2-person team,
48 hours, mixed AI tools, must submit a PROMPTS.md.

---

## 2. Tooling constraint — Lovable/Replit and GitHub

Tool: Claude
Prompt:
"if i use lovable or replit i cant download the code ,then what to do ? should
i use cursor or antigravity but limit gets over quickly"

Outcome: Confirmed Lovable/Replit both support GitHub sync/export. Decided to
split work: one teammate on Lovable/Replit for backend scaffolding + deploy,
other teammate on Cursor for the persona/generation logic, same GitHub repo.

---

## 3. Cursor free tier constraint

Tool: Claude
Prompt:
"free tier"

Outcome: Got a strategy for stretching Cursor's free tier — do prompt/persona
wording outside Cursor (in a plain chat), only paste finished prompts into
Cursor for code wiring; use inline autocomplete over full agent mode where
possible; commit frequently so a mid-session limit doesn't lose work.

---

## 4. Lovable prompt sequence

Tool: Claude
Prompt:
"i have to give prompt to lovable , give the steps"

Outcome: Got a step-by-step sequence of small Lovable prompts (DB schema →
init endpoint → feed endpoint → generation logic → GitHub export) instead of
one large prompt, to avoid Lovable regenerating large fragile chunks of the
app at once.

---

## 5. Actually building the project

Tool: Claude
Prompt:
"i have to make the project lets atrt with that , first make the project"

Outcome: Claude generated the initial working backend directly — `server.js`,
`db.js`, `persona.js`, `generate.js`, `package.json`,
`.github/workflows/cron.yml` — as a starting scaffold instead of continuing
to write Lovable prompts one at a time.

---

## 6. Understanding what to actually do next

Tool: Claude
Prompt:
"So how to proceed ? With the help of ai tools like is backend required? What
easier frontend , I can use ? And all the things And I want to store the
prompts s well right Where store ?"

Outcome: Clarified no frontend is needed for this track (JSON API only, no
UI). Got a build order: deploy empty endpoints first, then wire one manual
generation cycle, then add the scheduler last. Confirmed PROMPTS.md goes in
the repo root and should be updated as-you-go, not written at the end.

---

## 7. Tech stack explanation

Tool: Claude
Prompt:
"So what tech stack we are using , and why ?"

Outcome: Got the stack laid out with reasoning per piece (Express, storage,
Anthropic API, HN Algolia API for topics, GitHub Actions cron, hosting
choice) — and this is where the JSON-file storage risk on serverless hosting
first got flagged.

---

## 8. Submission and testing process

Tool: Claude
Prompt:
"So how to submit , how to check if it's working ?"

Outcome: Got a concrete pre-submission test checklist (cold endpoint checks,
manual generation cycle review, walk-away test for the cron, checking GitHub
Actions logs for silent failures) and the actual Stage 1 submission
requirements (public repo, live URL, PROMPTS.md in repo).

---

## 9. Requesting the full code + README + prompt log

Tool: Claude
Prompt:
"So give me the codes used and readme md file to explain step wise what to do
And I have to save ethe prompt also Where store ? Give me prompts to do and
make the code so that I save it in well structured form"

Outcome: Got the full project as a downloadable zip with a step-by-step
README and this PROMPTS.md template.

---

## 10. Supabase connection trouble

Tool: Claude
Prompt:
"So what about super base? Like, I have to connect it now. And in super base,
the connecting code was not able to connect it in Versus code. So now I have
to do that or, is the ZIP okay."

Outcome: Determined Supabase wasn't actually necessary given the hosting
plan, told to hold off — pending which host was actually being used.

---

## 11. Hosting decision — Render

Tool: Claude
Prompt (via quick-select): "Render"

Outcome: Learned Render's free web services have an ephemeral filesystem —
the JSON-file storage would silently lose data on restart. Decided to drop
Supabase entirely and use Render's own free Postgres instead, same
dashboard as the web service. Claude rewrote `db.js`, `server.js`, and
`generate.js` to use Postgres, and updated the README with Render-specific
deploy steps.

---

## 12. Wanting the simplest reliable path

Tool: Claude
Prompt:
"I don't know, man. I just want my application to work. You just give me the
best possible solution you can get. Like, uh, which one is better? Like,
railway or render?"

Outcome: Recommended sticking with Render for both web service and Postgres
rather than adding a third platform, to avoid losing more time to
platform-switching.

---

## 13. Checking for deployment risk

Tool: Claude
Prompt:
"Will there be any problem with deployment or something You mentioned in few
chats before like free version of postgres on render is not reliable
something?"

Outcome: Got an honest list of real, checkable risks (cold starts, free-tier
connection limits, unclear idle behavior on free Postgres, a schema-creation
race condition) — none confirmed as actual failures, flagged for awareness
before deploying.

---

## 14. Considering alternatives

Tool: Claude
Prompt:
"So what are the other alternatives?"

Outcome: Compared Render Postgres, Neon, Supabase, Railway Postgres, and
MongoDB Atlas. Decided against switching preemptively — staying on Render
Postgres and only reconsidering if an actual failure shows up during testing.
