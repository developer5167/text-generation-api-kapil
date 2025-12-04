// router.js
// Hybrid router: fast embedding match, fallback LLM reranker when uncertain.

const fs = require("fs");
const { pipeline } = require("@xenova/transformers");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

// Load intents metadata (should include short "desc" in each intent)
const intents = JSON.parse(fs.readFileSync("src/intents.json", "utf-8"));

// thresholds (tune these)
const HIGH = 0.72;
const LOW = 0.56;

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedMatch(text) {
  const embedder = await embedderPromise;
  const emb = Array.from((await embedder(text, { pooling: "mean", normalize: true })).data);
  let best = { intent: null, score: -1, rankings: [] };

  for (const intent of intents) {
    // each intent may include multiple embeddings precomputed as intent.embeddings
    if (!intent.embeddings) continue;
    for (const ie of intent.embeddings) {
      const s = cosine(emb, ie);
      best.rankings.push({ name: intent.name, score: s });
      if (s > best.score) {
        best.score = s;
        best.intent = intent.name;
      }
    }
  }

  // sort top rankings
  best.rankings.sort((a, b) => b.score - a.score);
  best.topCandidates = best.rankings.slice(0, 6);
  return best;
}

async function llmRerank(userText, candidates) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: { temperature: 0.0, maxOutputTokens: 150 }
  });

  const prompt = `
You are an intent routing assistant. Given a user's message and a small list of intent names with short descriptions, return a compact JSON object:
{ "action": "<tool|knowledge|answer|clarify>", "intent": "<intent-name or null>", "confidence": 0.0-1.0, "reason": "<short reason>" }

INTENT CANDIDATES:
${candidates.map(c => `- ${c.name}: ${c.desc || c.examples?.[0] || ""}`).join("\n")}

USER MESSAGE:
"""${userText}"""

Rules:
- If the user requests an action (pay, show, list, fetch, create, delete, open, generate, scan), prefer action "tool".
- If the user asks for explanation or knowledge, prefer "knowledge" or "answer".
- If it's ambiguous, prefer "clarify".
Return ONLY valid JSON.
`;

  const res = await model.generateContent(prompt);
  const text = res.response.text().trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback conservative result
    return { action: "answer", intent: null, confidence: 0.5, reason: "parse_error" };
  }
}

module.exports = {
  route: async (userId, message) => {
    // quick heuristic: if message contains explicit task verbs, prefer tool early
    const taskVerbRegex = /\b(pay|show|list|fetch|send|transfer|generate|scan|select|open|download|upload|pay for|pay the|pay )\b/i;
    if (taskVerbRegex.test(message)) {
      // still use embedding but bias toward tool detection
      const emb = await embedMatch(message);
      if (emb.score >= LOW) {
        return { action: "tool", intent: emb.intent, confidence: emb.score, method: "embed" };
      }
      // if low score, call LLM reranker with top candidates
      const topCands = emb.topCandidates.map(r => {
        const meta = intents.find(i => i.name === r.name) || {};
        return { name: r.name, desc: meta.desc || (meta.examples && meta.examples[0]) || "" };
      });
      const rer = await llmRerank(message, topCands);
      return { action: rer.action, intent: rer.intent, confidence: rer.confidence, reason: rer.reason, method: "llm" };
    }

    // Normal flow: try embeddings first
    const emb = await embedMatch(message);
    if (emb.score >= HIGH) {
      return { action: "tool", intent: emb.intent, confidence: emb.score, method: "embed" };
    }
    if (emb.score >= LOW) {
      const topCands = emb.topCandidates.map(r => {
        const meta = intents.find(i => i.name === r.name) || {};
        return { name: r.name, desc: meta.desc || (meta.examples && meta.examples[0]) || "" };
      });
      const rer = await llmRerank(message, topCands);
      return { action: rer.action, intent: rer.intent, confidence: rer.confidence, reason: rer.reason, method: "llm" };
    }

    // fallback: knowledge/answer via LLM
    return { action: "answer", intent: null, confidence: emb.score, method: "fallback" };
  }
};
