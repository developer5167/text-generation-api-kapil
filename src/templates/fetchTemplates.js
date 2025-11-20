const formatDueDetails = (dues) => {
  let message = "Here are your current Due Details:\n\n";

  dues.forEach((d) => {
    message += `
Chit Number: ${d.pchitno}
Branch: ${d.pvchbranch}

Current Installment: ₹${d.pcurrentmonthinstallment}
Penalty: ₹${d.ppenalty}
Pending Due: ₹${d.pdue}
Net Payable: ₹${d.pnetpayable}
------------------------------\n`;
  });

  message += "\nIf you want total payable or payment link, just ask!";
  return message;
};
const formatChitDetails = (dues) => {
  let message = "Here are your current Chit Details:\n\n";

  dues.forEach((d) => {
    message += `
Chit Number: ${d.pchitno}
Branch: ${d.pvchbranch}

Name: ₹${d.psubscribername}
Auction Month: ₹${d.pauctmonth}
Chit Value: ₹${d.pchitvalue}
Auction Date: ${d.pauctiondate}
------------------------------\n`;
  });

  message += "\nIf you want total now all the dues, just ask! 'Show me my dues'";
  return message;
};
module.exports = {
  formatDueDetails,
  formatChitDetails
};
