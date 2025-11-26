// responseHandlers.js
const responseHandlers = {
  upcoming_auctions: (message, apiAnswer) => ({
    message: message,
    type: Array.isArray(apiAnswer) ? "upcoming_auctions" : "",
    data: apiAnswer,
    answer: Array.isArray(apiAnswer) ? "Here are the upcoming auctions" : apiAnswer,
    timestamp: new Date().toISOString()
  }),
  
  // Add more handlers here as needed
  payment_confirmation: (message, apiAnswer) => ({
    message: message,
    type: "payment",
    data: apiAnswer,
    answer: "Payment processed successfully",
    timestamp: new Date().toISOString()
  }),
  
  user_list: (message, apiAnswer) => ({
    message: message,
    type: "user_list",
    data: apiAnswer,
    answer: "Here are the users",
    timestamp: new Date().toISOString()
  }),
  
  default: (message, apiAnswer) => ({
    message: message,
    answer  : apiAnswer,
    timestamp: new Date().toISOString()
  })
};

function getResponseHandler(intent) {
  return responseHandlers[intent] || responseHandlers.default;
}

module.exports = { getResponseHandler };