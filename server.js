import "dotenv/config";
import express from "express";
import { createAgent, getAgent, getPosts, getLatestScan } from "./db.js";
import { runGenerationCycle } from "./generate.js";
import { PROFILES, PROFILE_IDS, getProfile, generateUnitId } from "./profiles.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Called exactly once by the evaluator before evaluation begins.
app.post("/api/agent/init", async (req, res) => {
  const { persona, profileId } = req.body || {};
  const pid = profileId || "ada";
  const profile = getProfile(pid);

  const name = persona?.name || profile.name;
  const domain = persona?.domain || profile.domain;

  if (!name || !domain) {
    return res.status(400).json({ error: "persona.name and persona.domain are required" });
  }
  try {
    const unitId = generateUnitId(pid);
    const agent = await createAgent({
      name,
      domain,
      profileId: pid,
      unitId,
    });
    res.json({ agentId: agent.id, unitId: agent.unitId, profileId: pid });
  } catch (err) {
    console.error("init failed:", err);
    res.status(500).json({ error: "init failed", detail: String(err) });
  }
});

app.get("/api/profiles", (_req, res) => {
  res.json({
    profiles: PROFILE_IDS.map((id) => {
      const p = PROFILES[id];
      return {
        id: p.id,
        name: p.name,
        role: p.role,
        description: p.description,
        domain: p.domain,
        stationTag: p.stationTag,
      };
    }),
  });
});

// The only endpoint the evaluator polls after init.
app.get("/api/agent/feed", async (req, res) => {
  const { agentId } = req.query;
  if (!agentId) return res.status(400).json({ error: "agentId query param is required" });
  try {
    const agent = await getAgent(agentId);
    if (!agent) return res.status(404).json({ error: "unknown agentId" });

    const posts = await getPosts(agentId);
    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        text: p.text,
        rationale: p.rationale,
        sources: p.sources,
      })),
    });
  } catch (err) {
    console.error("feed failed:", err);
    res.status(500).json({ error: "feed failed", detail: String(err) });
  }
});

app.get("/api/agent/decisions", async (req, res) => {
  const { agentId } = req.query;
  if (!agentId) return res.status(400).json({ error: "agentId query param is required" });
  try {
    const agent = await getAgent(agentId);
    if (!agent) return res.status(404).json({ error: "unknown agentId" });

    const scan = await getLatestScan(agentId);
    res.json({ scan });
  } catch (err) {
    console.error("decisions failed:", err);
    res.status(500).json({ error: "decisions failed", detail: String(err) });
  }
});

// NOT part of the official spec — this is what the GitHub Actions cron
// hits on a schedule to actually produce new content. Keep it unauthenticated
// only if you're comfortable with that for the hackathon; add a shared-secret
// header check before you rely on it unattended for 48 hours.
app.post("/api/agent/generate", async (req, res) => {
  const { agentId } = req.body || {};
  if (!agentId) return res.status(400).json({ error: "agentId is required" });
  try {
    const agent = await getAgent(agentId);
    if (!agent) return res.status(404).json({ error: "unknown agentId" });

    const result = await runGenerationCycle(agent);
    res.json(result);
  } catch (err) {
    console.error("generation cycle failed:", err);
    res.status(500).json({ error: "generation failed", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
