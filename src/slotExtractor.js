// intentEngine/slotExtractor.js
const { extractChitNumber, extractAmount } = require("./intentHandlers"); // reuse your existing helpers
const { callLLMExtract } = require("./llmHelpers"); // optional - implement if you want LLM fallback

// message: string
// paramNames: array of strings like ["group_code","amount","dob"]
async function extractSlots(message, paramNames = []) {
  const out = {};
  const text = (message || "").trim();

  for (const name of paramNames) {
    if (name === "group_code" || name === "chit_number") {
      const val = extractChitNumber(text);
      if (val) out[name] = val;
      continue;
    }
    if (name === "amount" || name === "payment_amount") {
      const a = extractAmount(text);
      if (a) out[name] = a;
      continue;
    }
    // add quick regex patterns for dates, otp, phone
    if (name === "dob") {
      const m = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})\b/);
      if (m) out[name] = m[1];
      continue;
    }
    if (name === "otp") {
      const m = text.match(/\b(\d{4,6})\b/);
      if (m) out[name] = m[1];
      continue;
    }
  }

  // if nothing found for any required param, optionally call LLM to extract
  const stillMissing = paramNames.filter(p => out[p] == null);
  if (stillMissing.length > 0) {
    try {
      const llmRes = await callLLMExtract(text, stillMissing);
      // llmRes should be an object {paramName: value|null}
      Object.assign(out, llmRes);
    } catch (e) {
      // ignore LLM failure; we'll wait for user to provide explicitly
    }
  }

  return out;
}

module.exports = { extractSlots };
