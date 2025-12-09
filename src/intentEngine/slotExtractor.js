// src/intentEngine/slotExtractor.js

const { generativeModel } = require("../summariser_open_ai.js");

 async function extractSlots(userMessage, paramDefs) {
    const schemaKeys = Object.keys(paramDefs);

    const prompt = `
Extract the following fields from user message:
${schemaKeys.join(", ")}

User message:
"${userMessage}"

Return JSON only. If not present return null.
    `;

    try {
        const res = await generativeModel.generateContent(prompt);
        return JSON.parse(res.response.text());
    } catch (e) {
        return {};
    }
}
module.exports={
    extractSlots
}
