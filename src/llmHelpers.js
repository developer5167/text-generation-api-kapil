// intentEngine/llmHelpers.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function callLLMExtract(message, paramNames = []) {
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = "gemini-2.5-flash-light"; // Using your model
  const prompt = `
Extract the following parameters from the message.
Return JSON only.

Parameters: ${paramNames.join(", ")}
Message: "${message}"
  `;

  try {
    const models = model.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.3,
      },
    });
    const result = await models.generateContent(prompt);
    return JSON.parse(response.response.text());
  } catch (e) {
    return {}; // fallback if LLM fails
  }
}

module.exports = { callLLMExtract };
