
const { GoogleGenerativeAI } = require("@google/generative-ai");
const conversationManager = require('./conversationManager');
require("dotenv").config();

class GeminiSummarizer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = "gemini-2.5-flash-light"; // Using your model
  }

  async summarizeWithContext(userId, context, question) {
    const session = conversationManager.getSession(userId);
    const conversationHistory = this.formatHistory(session.history);
    
    const prompt = this.buildContextAwarePrompt(
      context, 
      question, 
      conversationHistory,
      session.context
    );

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.3,
        }
      });

      const result = await model.generateContent(prompt);
      let answer = result.response.text().trim();
      
      // Update conversation context based on this interaction
      this.updateConversationContext(userId, question, answer);
      
      // Add to history
      conversationManager.addToHistory(userId, question, answer);
      
      return answer;
      
    } catch (error) {
      console.error("❌ Gemini error:", error);
      return this.getContextAwareFallback(userId, question);
    }
  }

  formatHistory(history) {
    if (!history || history.length === 0) return "No previous conversation.";
    
    return history.map(entry => 
      `User: ${entry.user}\nAssistant: ${entry.bot}`
    ).join('\n\n');
  }

  buildContextAwarePrompt(context, question, history, sessionContext) {
    return `
You are Natasha, an AI assistant for Kapil Chits. Maintain conversation context and understand references.

PREVIOUS CONVERSATION:
${history}

CURRENT CONTEXT:
${context}

USER'S CURRENT QUESTION: "${question}"

SESSION CONTEXT: ${JSON.stringify(sessionContext, null, 2)}

INSTRUCTIONS:
1. Understand pronouns (he, she, it, they) based on conversation history
2. Maintain context from previous messages
3. If user refers to something mentioned before, connect it
4. Answer naturally and conversationally
5. Use only the provided context and conversation history

RESPONSE:`;
  }

  updateConversationContext(userId, question, answer) {
    const contextUpdates = {};
    const q = question.toLowerCase();
    const a = answer.toLowerCase();

    // Detect what we're talking about
    if (q.includes('founder') || q.includes('vaman') || a.includes('founder')) {
      contextUpdates.lastTopic = 'founder';
      contextUpdates.mentionedFounder = true;
    }
    
    if (q.includes('payment') || q.includes('pay') || q.includes('due')) {
      contextUpdates.lastTopic = 'payment';
      contextUpdates.mentionedPayment = true;
    }
    
    if (q.includes('chit') && (q.includes('detail') || q.includes('plan'))) {
      contextUpdates.lastTopic = 'chit_details';
    }
    
    if (q.includes('contact') || q.includes('number') || q.includes('call')) {
      contextUpdates.lastTopic = 'contact';
    }

    // Extract entities for future reference
    if (a.includes('sri vaman rao')) {
      contextUpdates.founderName = 'Sri Vaman Rao';
    }
    
    if (a.match(/\d{4}/)) { // If we mentioned a year
      const yearMatch = a.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) contextUpdates.mentionedYear = yearMatch[0];
    }

    conversationManager.updateContext(userId, contextUpdates);
  }

  getContextAwareFallback(userId, question) {
    const session = conversationManager.getSession(userId);
    const lastTopic = session.context.lastTopic;
    
    // Context-aware fallbacks
    if (lastTopic === 'founder') {
      return "The founder's name is Sri Vaman Rao. Kapil Chits was established in 1981.";
    }
    
    if (lastTopic === 'payment') {
      return "For payment-related queries, please contact our customer care at 1800-123-4343.";
    }
    
    if (lastTopic === 'contact') {
      return "You can reach us at 1800-123-4343 or visit your nearest branch.";
    }

    // Generic fallback
    return "I apologize, I'm having trouble accessing that information. Please contact customer care at 1800-123-4343 for assistance.";
  }
}

module.exports = GeminiSummarizer;