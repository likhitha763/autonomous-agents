//const API_BASE = "https://autonomous-agents-379t.onrender.com";
const API_BASE = "";

const PROFILES = [
  {
    id: "ada",
    name: "ADA",
    role: "AI SECURITY RESEARCHER — SIGNAL TRIAGE UNIT",
    description:
      "Scans live sources for AI/security signals, triages each one, and transmits only what clears editorial threshold. Every scan plots its verdicts on the array.",
    domain: "AI Security",
    stationTag: "ADA-SEC",
  },
  {
    id: "nova",
    name: "NOVA",
    role: "AI TECHNOLOGY ANALYST — EMERGING SYSTEMS UNIT",
    description:
      "Monitors new AI models, tools, frameworks, research, and major technology developments. Filters hype from genuine engineering breakthroughs.",
    domain: "AI Technology",
    stationTag: "NOVA-TECH",
  },
  {
    id: "orion",
    name: "ORION",
    role: "CYBERSECURITY INTELLIGENCE — THREAT ANALYSIS UNIT",
    description:
      "Monitors cybersecurity research, vulnerabilities, attacks, defensive techniques, and important security developments worth tracking.",
    domain: "Cybersecurity",
    stationTag: "ORION-THR",
  },
  {
    id: "lyra",
    name: "LYRA",
    role: "AI SAFETY & ETHICS RESEARCHER — RESPONSIBLE AI UNIT",
    description:
      "Tracks AI safety research, responsible AI practices, AI governance, ethics, and major regulatory developments affecting the field.",
    domain: "AI Safety & Ethics",
    stationTag: "LYRA-SAF",
  },
  {
    id: "atlas",
    name: "ATLAS",
    role: "DEVELOPER INTELLIGENCE — OPEN SOURCE UNIT",
    description:
      "Monitors developer tools, GitHub/open-source projects, APIs, frameworks, libraries, and important engineering developments.",
    domain: "Developer Tools",
    stationTag: "ATLAS-DEV",
  },
  {
    id: "echo",
    name: "ECHO",
    role: "AI SOCIAL INTELLIGENCE — TREND ANALYSIS UNIT",
    description:
      "Detects meaningful AI and technology discussions, trends, community signals, and emerging topics across the tech ecosystem.",
    domain: "AI Trends",
    stationTag: "ECHO-SOC",
  },
];

function migrateLegacyStorage() {
  const legacyId = localStorage.getItem("agentId");
  if (!legacyId) return;
  try {
    const agents = JSON.parse(localStorage.getItem("profileAgents") || "{}");
    if (!agents.ada) {
      agents.ada = { agentId: legacyId, unitId: legacyId.slice(0, 8).toUpperCase() };
      localStorage.setItem("profileAgents", JSON.stringify(agents));
    }
  } catch (e) { /* ignore */ }
  localStorage.removeItem("agentId");
}

function getProfileAgents() {
  migrateLegacyStorage();
  try {
    return JSON.parse(localStorage.getItem("profileAgents") || "{}");
  } catch (e) {
    return {};
  }
}

function setProfileAgent(profileId, agentId, unitId) {
  const agents = getProfileAgents();
  agents[profileId] = { agentId, unitId };
  localStorage.setItem("profileAgents", JSON.stringify(agents));
}

function getSelectedProfileId() {
  return localStorage.getItem("selectedProfile") || "ada";
}

function setSelectedProfileId(profileId) {
  localStorage.setItem("selectedProfile", profileId);
}

function getProfile(profileId) {
  const id = profileId || getSelectedProfileId();
  return PROFILES.find((p) => p.id === id) || PROFILES[0];
}

function getAgentId(profileId) {
  const id = profileId || getSelectedProfileId();
  const agents = getProfileAgents();
  return agents[id]?.agentId || null;
}

function getUnitId(profileId) {
  const id = profileId || getSelectedProfileId();
  const agents = getProfileAgents();
  return agents[id]?.unitId || null;
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
  const selected = getSelectedProfileId();
  if (selected === "all") {
    const agents = getProfileAgents();
    const count = Object.keys(agents).length;
    el.textContent = count > 0 ? `${count}/6 UNITS ONLINE` : "ALL UNITS (NOT INITIALIZED)";
    return;
  }
  el.textContent = getUnitId() || "not initialized";
}

function applyProfileUI() {
  const selected = getSelectedProfileId();
  if (selected === "all") {
    const nameEl = document.getElementById("profileName");
    const roleEl = document.getElementById("profileRole");
    const descEl = document.getElementById("profileDesc");
    const stationEl = document.getElementById("stationTag");

    if (nameEl) nameEl.textContent = "ALL UNITS";
    if (roleEl) roleEl.textContent = "GLOBAL SIGNAL NETWORK — ALL MONITORING UNITS";
    if (descEl) descEl.textContent = "Aggregated signal triage and transmission across all active intelligence units.";
    if (stationEl) stationEl.textContent = "ALL-UNITS";

    renderAgentTag("agentIdDisplay");
    renderProfileBar();
    return;
  }
  const profile = getProfile();
  const nameEl = document.getElementById("profileName");
  const roleEl = document.getElementById("profileRole");
  const descEl = document.getElementById("profileDesc");
  const stationEl = document.getElementById("stationTag");

  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) roleEl.textContent = profile.role;
  if (descEl) descEl.textContent = profile.description;
  if (stationEl) stationEl.textContent = profile.stationTag;

  renderAgentTag("agentIdDisplay");
  renderProfileBar();
}

function renderProfileBar() {
  const bar = document.getElementById("profileBar");
  if (!bar) return;
  const selected = getSelectedProfileId();
  const agents = getProfileAgents();

  const items = [
    { id: "all", name: "ALL UNITS" },
    ...PROFILES,
  ];

  bar.innerHTML = items.map((p) => {
    const isActive = p.id === selected;
    const isInit = p.id === "all" ? Object.keys(agents).length > 0 : !!agents[p.id]?.agentId;
    const cls = "profile-chip" + (isActive ? " active" : "") + (isInit ? " initialized" : "");
    return `<button type="button" class="${cls}" data-profile="${p.id}" onclick="selectProfile('${p.id}')">${p.name}</button>`;
  }).join("");
}

function selectProfile(profileId) {
  setSelectedProfileId(profileId);
  applyProfileUI();
  if (typeof onProfileChange === "function") {
    onProfileChange(profileId);
  }
}

function initProfileUI() {
  applyProfileUI();
}

async function apiInit(profileId) {
  const pid = profileId || getSelectedProfileId();
  const profile = getProfile(pid);
  const res = await fetch(`${API_BASE}/api/agent/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId: pid,
      persona: { name: profile.name, domain: profile.domain },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  setProfileAgent(pid, data.agentId, data.unitId || data.agentId);
  return { agentId: data.agentId, unitId: data.unitId };
}

async function apiGenerate(profileId) {
  const agentId = getAgentId(profileId);
  if (!agentId) throw new Error("Initialize a unit first.");
  const res = await fetch(`${API_BASE}/api/agent/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || `Server returned ${res.status}`);
  return data;
}

async function apiDecisions(profileId) {
  const pid = profileId || getSelectedProfileId();
  if (pid === "all") {
    const agents = getProfileAgents();
    const scans = [];
    for (const p of PROFILES) {
      const agentId = agents[p.id]?.agentId;
      if (agentId) {
        try {
          const res = await fetch(
            `${API_BASE}/api/agent/decisions?agentId=${encodeURIComponent(agentId)}`
          );
          const data = await res.json();
          if (data.scan) {
            scans.push({ ...data.scan, profileName: p.name, profileId: p.id, stationTag: p.stationTag });
          }
        } catch (e) { /* ignore */ }
      }
    }
    return { scans };
  }

  const agentId = getAgentId(pid);
  if (!agentId) return { scan: null };

  const res = await fetch(
    `${API_BASE}/api/agent/decisions?agentId=${encodeURIComponent(agentId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  return data;
}

async function apiFeed(profileId) {
  const pid = profileId || getSelectedProfileId();
  if (pid === "all") {
    const agents = getProfileAgents();
    const allPosts = [];
    for (const p of PROFILES) {
      const agentId = agents[p.id]?.agentId;
      if (agentId) {
        try {
          const res = await fetch(
            `${API_BASE}/api/agent/feed?agentId=${encodeURIComponent(agentId)}`
          );
          const data = await res.json();
          if (data.posts) {
            data.posts.forEach((post) => {
              allPosts.push({ ...post, profileName: p.name, profileId: p.id, stationTag: p.stationTag });
            });
          }
        } catch (e) { /* ignore */ }
      }
    }
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { posts: allPosts };
  }

  const agentId = getAgentId(pid);
  if (!agentId) return { posts: [] };
  const res = await fetch(`${API_BASE}/api/agent/feed?agentId=${encodeURIComponent(agentId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  return data;
}

document.addEventListener("DOMContentLoaded", initProfileUI);
