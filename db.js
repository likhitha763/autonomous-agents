import pg from "pg";

// Render sets DATABASE_URL automatically once you link a Render Postgres
// instance to this web service (see README Step 4b). Locally, put the same
// "External Database URL" from your Render Postgres dashboard into .env.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id),
      text TEXT NOT NULL,
      rationale TEXT NOT NULL,
      sources TEXT[] NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      checked INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scan_id UUID NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      source_url TEXT,
      decision TEXT NOT NULL CHECK (decision IN ('publish', 'reject')),
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  initialized = true;
}

export async function createAgent({ name, domain }) {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO agents (name, domain) VALUES ($1, $2) RETURNING id, name, domain, created_at AS "createdAt"`,
    [name, domain]
  );
  return rows[0];
}

export async function getAgent(agentId) {
  await ensureSchema();
  const { rows } = await pool.query(`SELECT * FROM agents WHERE id = $1`, [agentId]);
  return rows[0];
}

export async function addPost(agentId, { text, rationale, sources }) {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO posts (agent_id, text, rationale, sources)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at AS "createdAt", text, rationale, sources`,
    [agentId, text, rationale, sources]
  );
  return rows[0];
}

export async function getPosts(agentId) {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, created_at AS "createdAt", text, rationale, sources
     FROM posts WHERE agent_id = $1 ORDER BY created_at DESC`,
    [agentId]
  );
  return rows;
}

export async function getRecentTitles(agentId, limit = 30) {
  const posts = await getPosts(agentId);
  return posts.slice(0, limit).map((p) => p.text);
}

export async function createScanRun(agentId, checked, published) {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO scan_runs (agent_id, checked, published)
     VALUES ($1, $2, $3)
     RETURNING id, agent_id AS "agentId", checked, published, created_at AS "createdAt"`,
    [agentId, checked, published]
  );
  return rows[0];
}

export async function addScanDecision(scanId, agentId, { topic, sourceUrl, decision, reason }) {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO scan_decisions (scan_id, agent_id, topic, source_url, decision, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, scan_id AS "scanId", agent_id AS "agentId", topic, source_url AS "sourceUrl", decision, reason, created_at AS "createdAt"`,
    [scanId, agentId, topic, sourceUrl, decision, reason]
  );
  return rows[0];
}

export async function getLatestScan(agentId) {
  await ensureSchema();
  const runRes = await pool.query(
    `SELECT id, agent_id AS "agentId", checked, published, created_at AS "createdAt"
     FROM scan_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [agentId]
  );
  if (runRes.rows.length === 0) {
    return null;
  }
  const scan = runRes.rows[0];
  const decisionsRes = await pool.query(
    `SELECT id, topic, source_url AS "sourceUrl", decision, reason, created_at AS "createdAt"
     FROM scan_decisions WHERE scan_id = $1 ORDER BY created_at ASC`,
    [scan.id]
  );
  return {
    id: scan.id,
    checked: scan.checked,
    published: scan.published,
    createdAt: scan.createdAt,
    decisions: decisionsRes.rows,
  };
}

