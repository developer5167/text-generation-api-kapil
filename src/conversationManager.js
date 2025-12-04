// conversationManager.js
class ConversationManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
  }

  // Get or create user session
  getSession(userId) {
    this.cleanupExpiredSessions();

    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        userId,
        context: {},
        history: [],
        paymentAwait: false, // <-- per-user flag
        lastActive: Date.now(),
        createdAt: Date.now()
      });
    }

    const session = this.sessions.get(userId);
    session.lastActive = Date.now();
    return session;
  }

  // Update conversation context
  updateContext(userId, newContext) {
    const session = this.getSession(userId);
    session.context = { ...session.context, ...newContext };
    return session;
  }

  // Add message to history
  addToHistory(userId, userMessage, botResponse) {
    const session = this.getSession(userId);
    session.history.push({
      user: userMessage,
      bot: botResponse,
      timestamp: new Date().toISOString()
    });

    // Keep only last 8 messages to manage token usage
    if (session.history.length > 8) {
      session.history = session.history.slice(-8);
    }
  }

  // Get recent conversation history
  getRecentHistory(userId, maxMessages = 4) {
    const session = this.getSession(userId);
    return session.history.slice(-maxMessages);
  }

  // Clean up old sessions
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.sessionTimeout) {
        this.sessions.delete(userId);
      }
    }
  }

  // Clear specific session
  clearSession(userId) {
    this.sessions.delete(userId);
  }

  /* ---------- New: per-user paymentAwait helpers ---------- */

  // Set payment-await state for a specific user
  setPaymentAwait(userId, value) {
    const session = this.getSession(userId);
    session.paymentAwait = !!value;
  }

  // Get payment-await state for a specific user
  getPaymentAwait(userId) {
    const session = this.getSession(userId);
    return !!session.paymentAwait;
  }
}

module.exports = new ConversationManager();
