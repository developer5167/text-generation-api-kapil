const OpenAI = require("openai");

require('dotenv').config();


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store your API key in environment variables
});

// Fallback to Xenova for offline/backup (optional)
let fallbackGenerator = null;

async function summarizeByOpenAi(context, question) {
  // Trim context if too long (OpenAI token limits)
  if (context.length > 12000) {
    context = context.slice(0, 12000) + "... [content truncated]";
  }

  const prompt = `
You are Natasha, an intelligent and polite assistant for Kapil Chits. Your role is to provide accurate, helpful, and natural responses based on the context provided.

CONTEXT FROM KNOWLEDGE BASE:
${context}

USER QUESTION: "${question}"

INSTRUCTIONS:
1. Answer naturally and conversationally as Natasha
2. Use only the information from the context provided
3. If the context doesn't contain the answer, politely say you don't have that information
4. Keep responses clear and concise
5. Maintain a helpful and professional tone
6. Don't mention that you're using context or following instructions
7. If asked about company info, highlight Kapil Chits' 44+ years of trust and safety

Please provide your response:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" for better quality
      messages: [
        {
          role: "system",
          content: "You are Natasha, a helpful assistant for Kapil Chits. Provide accurate, natural responses based on the context given. Be polite and professional."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 350,
      temperature: 0.3, // Lower temperature for more consistent, factual responses
    });

    let answer = completion.choices[0].message.content.trim();
    
    console.log("🤖 OpenAI response:", answer);

    // Basic cleaning
    answer = cleanAnswer(answer);

    if (!answer || answer.length < 5) {
      return await fallbackToXenova(context, question);
    }

    return answer;

  } catch (error) {
    console.error("❌ OpenAI API error:", error.message);
    
    // Fallback to Xenova if OpenAI fails
    return await fallbackToXenova(context, question);
  }
}

/**
 * Fallback to Xenova if OpenAI fails
 */
async function fallbackToXenova(context, question) {
  console.log("🔄 Falling back to local model...");
  
  try {
    if (!fallbackGenerator) {
      const { pipeline } = require("@xenova/transformers");
      fallbackGenerator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-783M"
      );
    }

    const fallbackPrompt = `Context: ${context.slice(0, 2000)}\n\nQuestion: ${question}\n\nAnswer:`;
    
    const output = await fallbackGenerator(fallbackPrompt, {
      max_new_tokens: 150,
      temperature: 0.4,
    });

    return output[0].generated_text.trim();
  } catch (fallbackError) {
    console.error("❌ Fallback also failed:", fallbackError.message);
    return generateSmartResponse(context, question);
  }
}

/**
 * Clean any artifacts from the response
 */
function cleanAnswer(answer) {
  // Remove any potential prefix artifacts
  const cleaned = answer
    .replace(/^(Answer:|Response:|Natasha:)/i, "")
    .replace(/["']/g, "")
    .trim();

  return cleaned;
}

/**
 * Emergency fallback response generator
 */
function generateSmartResponse(context, question) {
  const q = question?.toLowerCase() || "";

  // Your existing fallback logic
  if (q.includes("why kapil")) {
    return `Kapil Chits is your trusted choice with over 44 years of zero-default service, registered under the Chit Fund Act (1982), offering online auctions, secure investments, and a strong branch and digital network. Your savings remain completely safe with us.`;
  }

  if (q.includes("who started") || q.includes("founder")) {
    return "Kapil Chits was founded in 1981 by Sri Vaman Rao under the Kapil Group.";
  }

  return "Thank you for your question. For detailed information about our chit fund services, please contact our customer care at 1800-123-4343 or visit your nearest branch.";
}

module.exports = { summarizeByOpenAi };