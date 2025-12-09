const { SpecialHandler } = require('../specialHandlers');
const configManager = require('../enableAwait');

class TransactionHandler extends SpecialHandler {
  canHandle(question) {
    return configManager.get('payment.transactions');
  }
  handle(question) {
    if (hasChitNumber(question)) {
      return "findTransactions";
    } else {
      return "Please enter valid group code to fetch transactions";
    }
  }
}
function hasChitNumber(message) {
  const hasChitNumber = /[A-Z]{2,6}\d{1,4}[A-Z]?-\d{1,3}/.test(message);
  return hasChitNumber;
}
module.exports = TransactionHandler;