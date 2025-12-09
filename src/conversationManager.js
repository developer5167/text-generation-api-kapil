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
        context: {
          
        },
        history: [],
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
  setFlag(userId, key, value) {
  const session = this.getSession(userId);
  session.context[key] = value;
}

  getFlag(userId, key) {
  const session = this.getSession(userId);
  return session.context[key];
}

clearFlag(userId, key) {
  const session = this.getSession(userId);
  delete session.context[key];
}
setPendingIntent(userId, pendingIntent) {
  const session = this.getSession(userId);
  session.context = session.context || {};
  session.context.pendingIntent = pendingIntent;
}

// get the pending intent or null
getPendingIntent(userId) {
  const session = this.getSession(userId);
  return session.context && session.context.pendingIntent ? session.context.pendingIntent : null;
}

// update collected params (merge)
updatePendingCollected(userId, newParams = {}) {
  const pending = this.getPendingIntent(userId);
  if (!pending) return null;
  pending.collectedParams = { ...(pending.collectedParams || {}), ...newParams };
  return pending;
}

// check whether all required params are present
isPendingComplete(userId) {
  const pending = this.getPendingIntent(userId);
  if (!pending) return false;
  for (const p of pending.requiredParams || []) {
    if (!pending.collectedParams || pending.collectedParams[p] == null) return false;
  }
  return true;
}

// clear pending intent
clearPendingIntent(userId) {
  const session = this.getSession(userId);
  if (session && session.context) delete session.context.pendingIntent;
}
markPendingExecuting(userId) {
  const p = this.getPendingIntent(userId);
  if (p) p.status = 'executing';
}

}

module.exports = new ConversationManager();