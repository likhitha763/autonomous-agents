import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import { addPost, getRecentTitles, createScanRun, addScanDecision } from "./db.js";
import { PERSONA_SYSTEM_PROMPT } from "./persona.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using the "-latest" alias instead of a pinned version — Google has
// retired two specific model names on us already this build (gemini-2.0-flash,
// then gemini-2.5-flash-lite). The alias always points at their current
// recommended Flash model, so it survives future retirements without a code change.
const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  systemInstruction: PERSONA_SYSTEM_PROMPT,
});

// Free, no-key, reliable source of current tech/AI discussion.
async function fetchCandidateTopics() {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI"
  );
  const data = await res.json();
  return (data.hits || [])
    .slice(0, 8)
    .map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    }))
    .filter((t) => t.title);
}

// ONE API call evaluates ALL candidate topics at once, instead of one call
// per topic. This is both cheaper (fits comfortably in free-tier RPM/RPD)
// and arguably better editorial judgment — a real editor compares options
// against each other, not one at a time in isolation.
async function judgeAllTopics(topics, recentTitles) {
  const topicList = topics
    .map((t, i) => `${i}. Title: ${t.title}\n   Source: ${t.url}`)
    .join("\n");

  const userMessage = `
Recent titles you've already published (do not repeat these or near-duplicates):
${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join("\n") : "(none yet)"}

Candidate topics (indexed):
${topicList}

Evaluate ALL candidates against your editorial standards. Pick AT MOST ONE
to publish — the strongest fit, if any qualify. If none meet your standards,
publish none.

Respond with STRICT JSON only, no prose outside the JSON, in this exact shape:

{
  "evaluations": [
    { "index": 0, "decision": "publish" | "reject", "reason": "..." },
    { "index": 1, "decision": "publish" | "reject", "reason": "..." }
  ],
  "publish": {
    "index": <the index you chose to publish, or null if none>,
    "text": "<the actual post text, only if you're publishing, else empty string>",
    "rationale": "<why this topic was selected and why it's relevant now, only if publishing, else empty string>"
  }
}
`;

  const result = await model.generateContent(userMessage);
  const raw = result.response.text();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function runGenerationCycle(agent) {
  const topics = await fetchCandidateTopics();
  const recentTitles = await getRecentTitles(agent.id);

  const judgment = await judgeAllTopics(topics, recentTitles);

  const isPublishing =
    judgment.publish &&
    judgment.publish.index !== null &&
    judgment.publish.index !== undefined;
  const publishedCount = isPublishing ? 1 : 0;

  const scan = await createScanRun(agent.id, topics.length, publishedCount);

  const evaluationsWithTopics = [];
  if (Array.isArray(judgment.evaluations)) {
    for (const evaluation of judgment.evaluations) {
      const topicObj = topics[evaluation.index] || {};
      const topicTitle = topicObj.title || "";
      const sourceUrl = topicObj.url || null;
      const decision = evaluation.decision;
      const reason = evaluation.reason;

      await addScanDecision(scan.id, agent.id, {
        topic: topicTitle,
        sourceUrl: sourceUrl,
        decision: decision,
        reason: reason,
      });

      evaluationsWithTopics.push({
        index: evaluation.index,
        topic: topicTitle,
        sourceUrl: sourceUrl,
        decision: decision,
        reason: reason,
      });
    }
  }

  if (isPublishing) {
    const chosen = topics[judgment.publish.index];
    if (chosen) {
      await addPost(agent.id, {
        text: judgment.publish.text,
        rationale: judgment.publish.rationale,
        sources: [chosen.url],
      });
    }
  }

  return {
    checked: topics.length,
    evaluations: evaluationsWithTopics,
    published: judgment.publish,
    scanId: scan.id,
  };
}