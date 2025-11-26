const userService = require('../services/userService');

const formatDueDetails = require('../templates/fetchTemplates').formatDueDetails;
const formatChitDetails = require('../templates/fetchTemplates').formatChitDetails;
const formatForPayChitDue = require('../templates/fetchTemplates').formatForPayChitDue;
const formatTransactionDetails = require('../templates/fetchTemplates').formatTransactionDetails;
const configManager = require("../enableAwait");

const GetSubscriberdues = async (mobile, token) => {
    const response = await userService.GetSubscriberdues(mobile, token);
    const formattedMessage = formatDueDetails(response.slice(0, 1)); // Show only first 3 due details
    return formattedMessage;
};
const GetChitDetails = async (mobile, token) => {
    const response = await userService.GetChitDetails(mobile, token);
    const formattedMessage = formatChitDetails(response.slice(0, 2)); // Show only first 2 chit details
    return formattedMessage;
};
const DoPayment = async (mobile, token) => {
  const duesList = await userService.GetSubscriberdues(mobile, token);
  const formattedMessage = formatForPayChitDue(duesList.slice(0, 1)); // Show only first 1 due
    return formattedMessage;
}; 
const payDueAmount = async (mobile, token,chitNumber,amount) => {
  const duesList = await userService.GetSubscriberdues(mobile, token);
  const findingDue = duesList.find(due => due.pchitno === chitNumber && due.pnetpayable >= amount);
  if (!findingDue) {
    configManager.setEnablePaymentAwait(false);
    return `Either the chit number ${chitNumber} is invalid or the amount ₹${amount} exceeds the net payable amount. Please check and try again.`;
  }else{
    configManager.setEnablePaymentAwait(false);
    return `Payment of ₹${amount} for chit number ${chitNumber} has been successfully processed.`;
  }
};
const findTransactions = async (groupcodetickectno, token) => {
  const duesList = await userService.GetTransactions(groupcodetickectno, token);
  if(duesList.lstSubscribertransDTO===null || duesList.lstSubscribertransDTO.length===0){
    return `No transactions found for group code ${groupcodetickectno}. Please check the group code and try again.`;
  }
  configManager.set('payment.transactions', false);
  const formattedMessage = formatTransactionDetails(duesList.lstSubscribertransDTO); // Show only first 5 dues
  return formattedMessage;
};
const findAuctions = async (mobile, token) => {
  const duesList = await userService.GetAuctionDetails(mobile, token);
  console.log(duesList.length);
  
  if(duesList.length===0){
    return `All caught up!, there are no upcoming auctions at the moment. Please check back later.`;
  }
  return duesList;
};
module.exports = {
  GetSubscriberdues,
  GetChitDetails,
  DoPayment,
  payDueAmount,
  findTransactions
  ,findAuctions
};
