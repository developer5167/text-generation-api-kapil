const userService = require('../services/userService');

const formatDueDetails = require('../templates/fetchTemplates').formatDueDetails;
const formatChitDetails = require('../templates/fetchTemplates').formatChitDetails;
const formatForPayChitDue = require('../templates/fetchTemplates').formatForPayChitDue;
const awaitEnabled = require("../enableAwait");

const GetSubscriberdues = async (mobile, token) => {
    const response = await userService.GetSubscriberdues(mobile, token);
    const formattedMessage = formatDueDetails(response);
    return formattedMessage;
};
const GetChitDetails = async (mobile, token) => {
    const response = await userService.GetChitDetails(mobile, token);
    const formattedMessage = formatChitDetails(response);
    return formattedMessage;
};
const DoPayment = async (mobile, token) => {
  const duesList = await userService.GetSubscriberdues(mobile, token);
  const formattedMessage = formatForPayChitDue(duesList.slice(0, 1)); // Show only first 5 dues
    return formattedMessage;
};  
const payDueAmount = async (mobile, token,chitNumber,amount) => {
  const duesList = await userService.GetSubscriberdues(mobile, token);
  const findingDue = duesList.find(due => due.pchitno === chitNumber && due.pnetpayable >= amount);
  if (!findingDue) {
    return `Either the chit number ${chitNumber} is invalid or the amount ₹${amount} exceeds the net payable amount. Please check and try again.`;
  }else{
    awaitEnabled.setEnablePaymentAwait(false);
    return `Payment of ₹${amount} for chit number ${chitNumber} has been successfully processed.`;
  }
};
module.exports = {
  GetSubscriberdues,
  GetChitDetails,
  DoPayment,
  payDueAmount
};
