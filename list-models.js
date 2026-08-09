// One-time diagnostic — not part of the app. Run with:
// node list-models.js
// Then delete this file, it's not needed for the actual submission.
import "dotenv/config";

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
);
const data = await res.json();

if (data.error) {
  console.error("API key problem:", data.error.message);
} else {
  console.log("Models your key can actually use:\n");
  for (const m of data.models || []) {
    if (m.supportedGenerationMethods?.includes("generateContent")) {
      console.log(m.name.replace("models/", ""));
    }
  }
}