const { pipeline } = require("@xenova/transformers");

let chatGenerator = null;

async function summarize(context, question) {
  if (!chatGenerator) {
    console.log("⚙️ Loading improved summarization model...");
    chatGenerator = await pipeline(
      "text2text-generation",
      "Xenova/LaMini-Flan-T5-783M" // More stable and context-aware
    );
  }

  // Trim context if too long (avoid model cutoff)
  if (context.length > 3000) {
    context = context.slice(0, 3000);
  }

  const prompt = `
You are Natasha, an intelligent and polite assistant representing Kapil Chits developed by kruparao.

User asked: "${question}"

Below is relevant company information and FAQs:
${context}

Based on this, give a natural and complete answer in plain language.
Avoid repeating "user question" or "relevant info" headers.
`;

  try {
    const output = await chatGenerator(prompt, {
      max_new_tokens: 220,
      temperature: 0.4,
      do_sample: true,
      repetition_penalty: 1.1,
    });

    let answer = (output[0].generated_text || "").trim();
    console.log("🤖 Raw model output:", answer);

    answer = cleanAnswer(answer);

    // sanity fallback
    if (!answer || answer.length < 10) {
      return generateSmartResponse(context, question);
    }

    return answer;
  } catch (err) {
    console.error("❌ Summarization error:", err.message);
    return generateSmartResponse(context, question);
  }
}

/**
 * Cleans leaked or incomplete model text.
 */
function cleanAnswer(answer) {
  const patterns = [
    /User asked:/gi,
    /Below is relevant/gi,
    /Based on this/gi,
    /Kapil Chits/gi,
  ];
  let cleaned = answer;
  for (const p of patterns) cleaned = cleaned.replace(p, "").trim();
  cleaned = cleaned.replace(/^[:\-–]+/, "").trim();

  return cleaned;
}

/**
 * Generates fallback answer if summarizer fails.
 */
function generateSmartResponse(context, question) {
  const q = question?.toLowerCase() || "";

  if (q.includes("why kapil")) {
    return `Kapil Chits is your trusted choice with over 44 years of zero-default service, 
registered under the Chit Fund Act (1982), offering online auctions, secure investments, 
and a strong branch and digital network. Your savings remain completely safe with us.`;
  }

  if (q.includes("who started") || q.includes("founder")) {
    return "Kapil Chits was founded in 1981 by Sri Vaman Rao under the Kapil Group.";
  }

  if (context) {
    const firstSentence = context.split(/[.!?]+/).find(s => s.trim().length > 25);
    return (firstSentence?.trim() || "Kapil Chits provides trusted chit fund services.") +
      " For details, please contact 1800-123-4343.";
  }

  return "I'm here to help! Please ask about our chit fund plans, registration, or safety features.";
}

module.exports = { summarize };
