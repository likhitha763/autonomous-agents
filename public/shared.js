//const API_BASE = "https://autonomous-agents-379t.onrender.com";
const API_BASE = "";

function getAgentId() {
  return localStorage.getItem("agentId") || null;
}

function setAgentId(id) {
  localStorage.setItem("agentId", id);
}

function saveLastDecisions(decisions) {
  localStorage.setItem("lastDecisions", JSON.stringify(decisions || []));
  localStorage.setItem("lastDecisionsAt", new Date().toISOString());
}

function getLastDecisions() {
  try {
    return JSON.parse(localStorage.getItem("lastDecisions") || "[]");
  } catch (e) {
    return [];
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function tickClock(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  setInterval(() => { el.textContent = new Date().toLocaleTimeString(); }, 1000);
  el.textContent = new Date().toLocaleTimeString();
}

function renderAgentTag(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = getAgentId() || "not initialized";
}

async function apiInit() {
  const res = await fetch(`${API_BASE}/api/agent/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona: { name: "Ada", domain: "AI Security" } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  setAgentId(data.agentId);
  return data.agentId;
}

async function apiGenerate() {
  const agentId = getAgentId();
  if (!agentId) throw new Error("Initialize a unit first.");
  const res = await fetch(`${API_BASE}/api/agent/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || `Server returned ${res.status}`);
  return data;
}

async function apiDecisions() {
  const agentId = getAgentId();

  if (!agentId) {
    return { scan: null };
  }

  const res = await fetch(
    `${API_BASE}/api/agent/decisions?agentId=${encodeURIComponent(agentId)}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Server returned ${res.status}`);
  }

  return data;
}

async function apiFeed() {
  const agentId = getAgentId();
  if (!agentId) return { posts: [] };
  const res = await fetch(`${API_BASE}/api/agent/feed?agentId=${encodeURIComponent(agentId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  return data;
}
