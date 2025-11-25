const { SpecialHandler } = require('../specialHandlers');
const configManager = require('../enableAwait');

class PaymentHandler extends SpecialHandler {
  canHandle(question) {
    return configManager.getEnablePaymentAwait();
  }
  
  handle(question) {
    if (hasBothChitDetails(question)) {
      return "proceed_payment";
    } else {
      return "please enter both chit number and amount to proceed with payment.";
    }
  }
}
function hasBothChitDetails(message) {
  // Check for chit number pattern (like KSET14F-45)
  const hasChitNumber = /[A-Z]{2,6}\d{1,4}[A-Z]?-\d{1,3}/.test(message);

  // Enhanced amount detection - handles multiple formats:
  // ₹1000, ₹ 1000, Rs.1000, Rs 1000, 1000, 1,000, 1000 rupees, etc.
  const amountPatterns = [
    /₹\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/, // ₹ symbol
    /Rs\.?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i, // Rs or Rs.
    /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:rupees?|RS?\.?)/i, // 1000 rupees
    /\b\d{4,}\b/, // Plain numbers (4+ digits, likely amounts)
    /amount\s*:?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i, // Amount: 1000
    /chit\s*value\s*:?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i // Chit value: 100000
  ];

  const hasAmount = amountPatterns.some(pattern => pattern.test(message));
  
  console.log("hasBothChitDetails - Amount:", hasAmount, "Chit Number:", hasChitNumber);
  
  return hasChitNumber && hasAmount;
}
module.exports = PaymentHandler;