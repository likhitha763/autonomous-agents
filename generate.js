import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import { addPost, getRecentTitles } from "./db.js";
import { PERSONA_SYSTEM_PROMPT } from "./persona.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((m, i, self) => self.indexOf(m) === i);

async function generateContentWithFallback(userMessage) {
  let lastError = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: PERSONA_SYSTEM_PROMPT,
      });
      return await model.generateContent(userMessage);
    } catch (err) {
      console.warn(`Model '${modelName}' failed (${err.message.split('\n')[0]}). Trying next fallback...`);
      lastError = err;
    }
  }
  throw lastError;
}

// Free, no-key, reliable source of current tech/AI discussion.
async function fetchCandidateTopics() {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI"
  );
  const data = await res.json();
  return (data.hits || [])
    .slice(0, 10)
    .map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    }))
    .filter((t) => t.title);
}

async function judgeTopic(agent, topic, recentTitles) {
  const userMessage = `
Recent titles you've already published (do not repeat these or near-duplicates):
${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join("\n") : "(none yet)"}

New candidate topic:
Title: ${topic.title}
Source: ${topic.url}

Decide whether to publish and respond with the required JSON only.
`;

  const result = await generateContentWithFallback(userMessage);
  const raw = result.response.text();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function runGenerationCycle(agent) {
  const topics = await fetchCandidateTopics();
  const recentTitles = await getRecentTitles(agent.id);

  const decisions = [];
  for (const topic of topics) {
    const judgment = await judgeTopic(agent, topic, recentTitles);
    decisions.push({ topic: topic.title, ...judgment });

    if (judgment.decision === "publish") {
      await addPost(agent.id, {
        text: judgment.text,
        rationale: judgment.rationale,
        sources: [topic.url],
      });
      // One publish per cycle keeps pacing realistic and cost bounded.
      break;
    }
  }

  return { checked: topics.length, decisions };
}
