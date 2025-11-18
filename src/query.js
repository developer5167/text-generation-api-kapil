const readline = require("readline");
const fs = require("fs");
const { pipeline } = require("@xenova/transformers");
const { getCollection } = require("./chromaClient");
const { summarize } = require("./summarizer");

// Utility: Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Intent detection using embeddings
async function detectIntent(question) {
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const intents = JSON.parse(fs.readFileSync("./intent_embeddings.json", "utf-8"));

  const queryEmb = Array.from(
    (await embedder(question, { pooling: "mean", normalize: true })).data
  );

  let bestIntent = null;
  let bestScore = -1;

  for (const intent of intents) {
    for (const emb of intent.embeddings) {
      const score = cosineSimilarity(queryEmb, emb);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent.name;
      }
    }
  }

  console.log(`🧭 Detected intent: ${bestIntent} (score: ${bestScore.toFixed(3)})`);
  if (bestScore < 0.60) return null; // threshold for confidence
  return bestIntent;
}

// Main query function
 async function queryNatasha(question) {
  const collection = await getCollection();
  const intent = await detectIntent(question);

  console.log(`\n🔍 Querying knowledge base: ${intent || "general"}.txt\n`);

  let results = await collection.query({
    queryTexts: [question],
    nResults: 5,
    where: intent ? { module: intent + ".txt" } : undefined
  });

  // Fallback if no results
  if (!results || !results.documents || results.documents[0].length === 0) {
    console.log("🔄 No intent match found, searching globally...");
    results = await collection.query({
      queryTexts: [question],
      nResults: 7
    });
  }

  if (!results.documents || results.documents[0].length === 0) {
    return "🤖 I couldn't find relevant information about that in our knowledge base. Could you please rephrase your question or ask about our chit fund services, company information, or contact details?";
  }

  const combinedText = results.documents[0]
    .filter(doc => doc && doc.trim().length > 10)
    .slice(0, 5)
    .join(" \n\n ");

  const answer = await summarize(combinedText, question);
  return answer;
}

// CLI Chat Interface
async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("💬 Natasha is online! Ask me anything (type 'exit' to quit):\n");

  rl.on("line", async (line) => {
    if (line.toLowerCase() === "exit") {
      console.log("👋 Bye!");
      rl.close();
      process.exit(0);
    }

    try {
      const answer = await queryNatasha(line);
      console.log("\n🤖 Natasha:", answer, "\n");
    } catch (err) {
      console.error("⚠️ Error:", err.message);
    }

    rl.prompt();
  });

  rl.prompt();
}

startChat();

module.exports = { queryNatasha };
