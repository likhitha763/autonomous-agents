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
