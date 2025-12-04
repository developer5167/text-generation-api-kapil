// slots.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const conversationManager = require("./conversationManager");

function extractChitNumber(text) {
  const pattern = /[A-Z]{2,6}\d{1,4}[A-Z]?\-\d{1,3}/gi;
  const m = text.match(pattern);
  return m ? m.map(x => x.toUpperCase()) : [];
}

function extractAmounts(text) {
  const patterns = [
    /₹\s*([\d,]+(?:\.\d{1,2})?)/g,
    /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(\d{1,3}(?:,\d{3})+|\d{4,})\s*(?:rupees|rs|₹)?/gi
  ];
  const amounts = [];
  for (const p of patterns) {
    let match;
    while ((match = p.exec(text)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(num)) amounts.push(num);
    }
  }
  return amounts;
}

// index parser (from prior helper)
function extractIndexes(message, listLength = 0) {
  message = message.toLowerCase();
  const wordToIndex = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, last: listLength || -1 };
  let indexes = [];
  for (const w in wordToIndex) {
    if (message.includes(w)) {
      const val = wordToIndex[w];
      if (val === -1) {
        // last: we'll fill later
        indexes.push("last");
      } else indexes.push(val);
    }
  }
  const numbers = message.match(/\b\d+\b/g);
  if (numbers) indexes = indexes.concat(numbers.map(n => parseInt(n, 10)));
  // ranges like 1-3
  const ranges = message.match(/\b(\d+)\s*-\s*(\d+)\b/g);
  if (ranges) {
    ranges.forEach(r => {
      const [a,b] = r.split(/-/).map(x => parseInt(x,10));
      for (let i=a;i<=b;i++) indexes.push(i);
    });
  }
  // normalize last if present and listLength known
  indexes = indexes.map(i => i === "last" ? listLength : i).filter(n => Number.isInteger(n));
  indexes = Array.from(new Set(indexes)); // unique
  // filter bounds
  indexes = indexes.filter(i => i >=1 && (listLength===0 || i <= listLength));
  return indexes.length ? indexes : null;
}

async function llmExtractSlots(userId, message) {
  // small LLM prompt to produce JSON slots: chitNumbers[], amounts[], indexes[]
  const session = conversationManager.getSession(userId);
  const lastList = session.lastListRaw ? session.lastListRaw.slice(0,8) : [];
  const shortList = lastList.map((it, idx) => `${idx+1}. ${it.pchitno || it.id || it.code} - ${it.pnetpayable || it.amount || ""}`).join("\n");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: { temperature: 0.0, maxOutputTokens: 300 }
  });

  const prompt = `
Extract payment-related slots from the user's message.
Return valid JSON with fields:
{ "chitNumbers": [..], "amounts": [..], "indexes": [..], "mode": "full|partial|unknown" }

User message: """${message}"""

Context: Last shown list (first 8 items):
${shortList || "(no list)"} 

If the user referenced list indexes like "2 and 4", put them in indexes.
If the user references chit numbers, put them in chitNumbers.
If amounts present, put them in amounts.
If ambiguous, return empty arrays and "mode":"unknown".
Return ONLY JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (e) {
    return { chitNumbers: [], amounts: [], indexes: [], mode: "unknown" };
  }
}

module.exports = {
  extractChitNumber,
  extractAmounts,
  extractIndexes,
  llmExtractSlots
};
