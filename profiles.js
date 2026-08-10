export const PROFILES = {
  ada: {
    id: "ada",
    name: "ADA",
    role: "AI SECURITY RESEARCHER — SIGNAL TRIAGE UNIT",
    description:
      "Scans live sources for AI/security signals, triages each one, and transmits only what clears editorial threshold. Every scan plots its verdicts on the array.",
    domain: "AI Security",
    stationTag: "ADA-SEC",
    searchQuery: "AI security",
  },
  nova: {
    id: "nova",
    name: "NOVA",
    role: "AI TECHNOLOGY ANALYST — EMERGING SYSTEMS UNIT",
    description:
      "Monitors new AI models, tools, frameworks, research, and major technology developments. Filters hype from genuine engineering breakthroughs.",
    domain: "AI Technology",
    stationTag: "NOVA-TECH",
    searchQuery: "AI model LLM framework",
  },
  orion: {
    id: "orion",
    name: "ORION",
    role: "CYBERSECURITY INTELLIGENCE — THREAT ANALYSIS UNIT",
    description:
      "Monitors cybersecurity research, vulnerabilities, attacks, defensive techniques, and important security developments worth tracking.",
    domain: "Cybersecurity",
    stationTag: "ORION-THR",
    searchQuery: "cybersecurity vulnerability exploit",
  },
  lyra: {
    id: "lyra",
    name: "LYRA",
    role: "AI SAFETY & ETHICS RESEARCHER — RESPONSIBLE AI UNIT",
    description:
      "Tracks AI safety research, responsible AI practices, AI governance, ethics, and major regulatory developments affecting the field.",
    domain: "AI Safety & Ethics",
    stationTag: "LYRA-SAF",
    searchQuery: "AI safety ethics",
  },
  atlas: {
    id: "atlas",
    name: "ATLAS",
    role: "DEVELOPER INTELLIGENCE — OPEN SOURCE UNIT",
    description:
      "Monitors developer tools, GitHub/open-source projects, APIs, frameworks, libraries, and important engineering developments.",
    domain: "Developer Tools",
    stationTag: "ATLAS-DEV",
    searchQuery: "open source developer tools github",
  },
  echo: {
    id: "echo",
    name: "ECHO",
    role: "AI SOCIAL INTELLIGENCE — TREND ANALYSIS UNIT",
    description:
      "Detects meaningful AI and technology discussions, trends, community signals, and emerging topics across the tech ecosystem.",
    domain: "AI Trends",
    stationTag: "ECHO-SOC",
    searchQuery: "artificial intelligence trend",
  },
};

export const PROFILE_IDS = Object.keys(PROFILES);

export function getProfile(profileId) {
  return PROFILES[profileId] || PROFILES.ada;
}

export function generateUnitId(profileId) {
  const prefix = (profileId || "ada").toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}
