// intentHandlers.js
const {
  GetSubscriberdues,
  GetChitDetails,
  DoPayment,
  payDueAmount,
  findTransactions,
  findAuctions
} = require("./controllers/userController");
const configManager = require("./enableAwait");
// Registry of all API-based intent handlers
const intentHandlers = {
  subscriber_dues: {
    requiresAuth: true,
    handler: async (mobile, token, message) => {
      return await GetSubscriberdues(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to fetch your subscriber dues.",
  },

  chit_details: {
    requiresAuth: true,
    handler: async (mobile, token, message) => {
      return await GetChitDetails(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to fetch your chit details.",
  },
  do_payment: {
    requiresAuth: true,
    handler: async (mobile, token, message) => {
      configManager.setEnablePaymentAwait(true);
      if (!extractChitNumber(message) || !extractAmount(message)) {
        return "To process your payment, please provide the chit number and the amount you wish to pay.";
      }
      return await payDueAmount(
        mobile,
        token,
        extractChitNumber(message),
        extractAmount(message)
      );
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },
  transactions: {
    requiresAuth: true,
    handler: async (mobile, token, message) => {
      console.log(extractChitNumber(message));
      if (!validateChitNumber(extractChitNumber(message))) {
        console.log(validateChitNumber(extractChitNumber(message)));
        configManager.set('payment.transactions', true);
        return "To check transactions, please provide the valid group code.";
      }else{
        return await findTransactions(extractChitNumber(message), token);
      }
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },
  findTransactions: {
    requiresAuth: true,
    handler: async (mobile, token,message) => {
      console.log(message);
      console.log(extractChitNumber(message));
      if (!validateChitNumber(extractChitNumber(message))) {
        console.log(validateChitNumber(extractChitNumber(message)));
        return "To check transactions, please provide the valid group code.";
      }
      return await findTransactions(extractChitNumber(message), token);
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",
  },
  upcoming_auctions: {
    requiresAuth: true,
    handler: async (mobile, token,message) => {
      console.log(message);
      return await findAuctions(mobile, token);
    },
    authMessage:
      "Please login with a valid mobile number to fetch upcoming auctions.",
  },
  proceed_payment: {
    requiresAuth: true,
    handler: async (mobile, token, message) => {
      if (!extractChitNumber(message) || !extractAmount(message)) {
        return "To process your payment, please provide the chit number and the amount you wish to pay.";
      }
      return await payDueAmount(
        mobile,
        token,
        extractChitNumber(message),
        extractAmount(message)
      );
    },
    authMessage:
      "Please login with a valid mobile number to proceed with the payment.",

  },

  // Add new intents here - NO CODE CHANGES NEEDED ELSEWHERE
};
function extractChitNumber(text) {
  const regex = /\b[A-Z]{2,6}\d{1,4}[A-Z]?-\d{1,3}\b/i;
  const match = text.match(regex);
  return match ? match[0].toUpperCase() : null;
}
function validateChitNumber(chitNumber) {
  const chitRegex = /^[A-Z]{4}\d{2}[A-Z]-\d{2}$/;
  return chitRegex.test(chitNumber);
}
// Check if intent requires API call
function isApiIntent(intent) {
  return intentHandlers.hasOwnProperty(intent);
}

// Handle API intent uniformly
async function handleApiIntent(intent, mobile, token, message) {
  const handlerConfig = intentHandlers[intent];

  if (!handlerConfig) {
    throw new Error(`No handler configured for intent: ${intent}`);
  }

  // Check authentication for protected intents
  if (handlerConfig.requiresAuth && (!mobile || !mobile.trim() || !token)) {
    return handlerConfig.authMessage;
  }
  return await handlerConfig.handler(mobile, token, message);
}

function extractAmount(message) {
  const text = message.trim();

  // Comprehensive amount patterns in order of specificity
  const amountPatterns = [
    // Pattern 1: ₹ symbol with optional spaces
    { pattern: /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, group: 1 },
    
    // Pattern 2: Rs or Rs. with optional spaces
    { pattern: /Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    
    // Pattern 3: Amount labeled with currency
    { pattern: /amount\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    
    // Pattern 4: Chit value labeled
    { pattern: /chit\s*value\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    
    // Pattern 5: Rupees mentioned after number
    { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|RS?\.?)/i, group: 1 },
    
    // Pattern 6: Pay/paid amount patterns
    { pattern: /pay\s*(?:amount)?\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    { pattern: /paid?\s*(?:amount)?\s*:?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, group: 1 },
    
    // Pattern 7: Numbers with "amount" context nearby
    { pattern: /(\d{4,})\s*(?=\s*(?:rupees?|amount|pay|₹|Rs\.?))/i, group: 1 },
    
    // Pattern 8: Standalone large numbers (4+ digits) - broader range
    { pattern: /\b(\d{4,6})\b/, group: 1 }
  ];

  // Try each pattern in order
  for (const { pattern, group } of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[group]) {
      const amountStr = match[group].replace(/,/g, "");
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount) && amount > 0) {
        // Validate amount range for chit payments
        if (amount >= 100 && amount <= 1000000) {
          return amount;
        }
      }
    }
  }

  // Final fallback: look for any reasonable number in payment context
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
