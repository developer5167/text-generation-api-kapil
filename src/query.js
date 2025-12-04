const readline = require("readline");
const fs = require("fs");
const { pipeline } = require("@xenova/transformers");
const { getCollection } = require("./chromaClient");
// const { summarizeByOpenAi } = require("./summariser_open_ai");
const GeminiSummarizer = require("./geminiSummarizer");
const geminiSummarizer = new GeminiSummarizer();
const conversationManager = require("./conversationManager");

const { isApiIntent } = require("./intentHandlers"); // ✅ New import
const { processSpecialHandlers } = require('./specialHandlers');
const PaymentHandler = require('./paymentHandlers/paymentHandler');
const { registerSpecialHandler } = require('./specialHandlers');
const TransactionHandler = require("./transactionsHandler/transactionHandler");

registerSpecialHandler(new PaymentHandler());
registerSpecialHandler(new TransactionHandler());


function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
function hasBothChitDetails(message) {
  const hasChitNumber = /[A-Z]{2,6}\d{1,4}[A-Z]?-\d{1,3}/.test(message);

  const amountPatterns = [
    /₹\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/,
    /Rs\.?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i,
    /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:rupees?|RS?\.?)/i,
    /\b\d{4,}\b/,
    /amount\s*:?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i,
    /chit\s*value\s*:?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i
  ];

  const hasAmount = amountPatterns.some(pattern => pattern.test(message));

  console.log("hasBothChitDetails - Amount:", hasAmount, "Chit Number:", hasChitNumber);

  return hasChitNumber && hasAmount;
}
// Intent detection using embeddings
async function detectIntent(question,userId) {
  const session = conversationManager.getSession(userId);

  if (session.paymentAwait) {

    // User provided chit number + amount → proceed
    if (hasBothChitDetails(question)) {
        return "proceed_payment";
    }

    // If message clearly looks like payment-related:
    if (/pay|amount|rupees|₹|rs|chit|ticket|number|due/i.test(question)) {
        return "please enter both chit number and amount to proceed with payment.";
    }

    // Otherwise → LET NORMAL INTENTS WORK
    // Do NOT return anything here — allow normal flow to continue
}
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
  const intents = JSON.parse(
    fs.readFileSync("./intent_embeddings.json", "utf-8")
  );
  console.log("DASDASDADA>>>>");
  
 const specialResult = processSpecialHandlers(question);
  if (specialResult) return specialResult;
  console.log(`DASDASDADA. ${specialResult}`);

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

  console.log(
    `🧭 Detected intent: ${bestIntent} (score: ${bestScore.toFixed(3)})`
  );
  if (bestScore < 0.6) return null; // threshold for confidence
  return bestIntent;
}

// Main query function
async function queryNatasha(userId, question) {
  const collection = await getCollection();
  const intent = await detectIntent(question,userId);

  console.log(
    `\n🔍 Querying knowledge base: ${
      intent || "general"
    }.txt\n user ${userId} asked: ${question}`
  );
  if (intent && isApiIntent(intent)) {
    return { type: "api_intent", intent };
  }
  let results = await collection.query({
    queryTexts: [question],
    nResults: 5,
    where: intent ? { module: intent + ".txt" } : undefined,
  });

  // Fallback if no results
  if (!results || !results.documents || results.documents[0].length === 0) {
    console.log("🔄 No intent match found, searching globally...");
    results = await collection.query({
      queryTexts: [question],
      nResults: 7,
    });
  }

  if (!results.documents || results.documents[0].length === 0) {
    return "🤖 I couldn't find relevant information about that in our knowledge base. Could you please rephrase your question or ask about our chit fund services, company information, or contact details?";
  }

  const combinedText = results.documents[0]
    .filter((doc) => doc && doc.trim().length > 10)
    .slice(0, 5)
    .join(" \n\n ");
  const answer = await geminiSummarizer.summarizeWithContext(
    userId,
    combinedText,
    question
  );

  // const answer = await geminiSummarizer.summarizeAccurate(combinedText, question);
  // console.log("Ans from gemini: "+answer);

  return answer;
}

// CLI Chat Interface
async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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


async function testConversation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const testUserId = "test-user-123";

  console.log("💬 Testing conversation context. Type 'exit' to quit:\n");

  rl.on("line", async (line) => {
    if (line.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    try {
      const result = await queryNatasha(testUserId, line);
      console.log("\n🤖 Natasha:", result.content, "\n");

      // Show current context (for debugging)
      const session = conversationManager.getSession(testUserId);
      console.log("📝 Context:", session.context);
      console.log("💾 History length:", session.history.length, "\n");
    } catch (err) {
      console.error("⚠️ Error:", err.message);
    }

    rl.prompt();
  });

  rl.prompt();
}

startChat();

module.exports = { queryNatasha };
