// intentHandlers.js
const {
  GetSubscriberdues,
  GetChitDetails,
  DoPayment,
  payDueAmount,
  transactions
} = require("./controllers/userController");
const conversationManager = require("./conversationManager");

// Registry of all API-based intent handlers
const intentHandlers = {
  subscriber_dues: {
    requiresAuth: true,
    handler: async (userId, mobile, token, message) => {
      return await GetSubscriberdues(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to fetch your subscriber dues.",
  },

  chit_details: {
    requiresAuth: true,
    handler: async (userId, mobile, token, message) => {
      return await GetChitDetails(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to fetch your chit details.",
  },

  do_payment: {
    requiresAuth: true,
    handler: async (userId, mobile, token, message) => {
      // Mark only this user's session as waiting for chit+amount
      conversationManager.setPaymentAwait(userId, true);
      console.log("paymentAwait set true for", userId);
      return await DoPayment(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },

  proceed_payment: {
    requiresAuth: true,
    handler: async (userId, mobile, token, message) => {
      const chitNumber = extractChitNumber(message);
      const amount = extractAmount(message);
      if (!chitNumber || !amount) {
        return "To process your payment, please provide the chit number and the amount you wish to pay.";
      }
      return await payDueAmount( mobile, token, chitNumber, amount,userId,);
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },

  transactions: {
    requiresAuth: true,
    handler: async (userId, mobile, token, groupcodetickectno) => {
      if (!extractGroupCodeTicketNo(groupcodetickectno)) {
        return "Please provide a valid group code ticket number to fetch your transactions.";
      }
      return await transactions(mobile, token, groupcodetickectno);
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },

  // Add new intents here - NO CODE CHANGES NEEDED ELSEWHERE
};

// Check if intent requires API call
function isApiIntent(intent) {
  return intentHandlers.hasOwnProperty(intent);
}

// Handle API intent uniformly
async function handleApiIntent(intent, userId, mobile, token, message) {
  const handlerConfig = intentHandlers[intent];

  if (!handlerConfig) {
    throw new Error(`No handler configured for intent: ${intent}`);
  }

  // Check authentication for protected intents
  if (handlerConfig.requiresAuth && (!mobile || !mobile.trim() || !token)) {
    return {
      blocks: [
        { type: "text", text: handlerConfig.authMessage },
      ],
    };
  }
  return await handlerConfig.handler(userId, mobile, token, message);
}

/* ---------------- helper extractors (unchanged) ---------------- */

function extractChitNumber(message) {
  const text = message.trim();
  const chitPattern = /[A-Z]{2,6}\d{1,4}[A-Z]?-\d{1,3}/gi;
  const matches = text.match(chitPattern);
  if (matches && matches.length > 0) {
    return matches[0].toUpperCase();
  }
  const labeledPattern = /chit\s*(?:number|code|id|no\.?)?\s*:?\s*([A-Z0-9-]+)/gi;
  const labeledMatch = labeledPattern.exec(text);
  if (labeledMatch && labeledMatch[1]) {
    return labeledMatch[1].toUpperCase().trim();
  }
  const commonPhrases = [
    /chit\s+([A-Z0-9-]+)/gi,
    /for\s+chit\s+([A-Z0-9-]+)/gi,
    /pay\s+(?:for\s+)?([A-Z0-9-]+)/gi,
    /against\s+chit\s+([A-Z0-9-]+)/gi
  ];
  for (const pattern of commonPhrases) {
    const match = pattern.exec(text);
    if (match && match[1] && /[A-Z]/.test(match[1])) {
      return match[1].toUpperCase().trim();
    }
  }
  return null;
}
function extractGroupCodeTicketNo(message) {
  return extractChitNumber(message);
}
function extractAmount(message) {
  const text = message.trim();
  const amountPatterns = [
    { pattern: /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, group: 1 },
    { pattern: /Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /amount\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /chit\s*value\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|RS?\.?)/i, group: 1 },
    { pattern: /pay\s*(?:amount)?\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /paid?\s*(?:amount)?\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /(\d{4,})\s*(?=\s*(?:rupees?|amount|pay|₹|Rs\.?))/i, group: 1 },
    { pattern: /\b(\d{4,6})\b/, group: 1 }
  ];
  for (const { pattern, group } of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[group]) {
      const amountStr = match[group].replace(/,/g, "");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        if (amount >= 100 && amount <= 1000000) {
          return amount;
        }
      }
    }
  }
  const paymentKeywords = /(pay|paid|amount|due|balance|rupees?|₹|rs\.?)/i;
  if (paymentKeywords.test(text)) {
    const allNumbers = text.match(/\d{3,6}/g);
    if (allNumbers) {
      for (const numStr of allNumbers) {
        const amount = parseInt(numStr);
        if (amount >= 100 && amount <= 1000000) {
          return amount;
        }
      }
    }
  }
  return null;
}

module.exports = {
  intentHandlers,
  isApiIntent,
  handleApiIntent,
};
