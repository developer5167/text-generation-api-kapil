const formatDueDetails = (dues) => {
  let message = "Here are your current Due Details:\n\n";
 let totalNoOfChitDues = 0;
  dues.forEach((d, index) => {
    totalNoOfChitDues += 1;
    message += `${index + 1}.
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
  let totalNoOfChits = 0;
  let message = "Here are your current Chit Details:\n\n";

  dues.forEach((d,index) => {
    totalNoOfChits += 1;
    message += 
    `${index + 1}.
Chit Number: ${d.pchitno}
Branch: ${d.pvchbranch}

Name: ₹${d.psubscribername}
Auction Month: ₹${d.pauctmonth}
Chit Value: ₹${d.pchitvalue}
Auction Date: ${d.pauctiondate}
------------------------------\n`;
  });
  message += "\ You have total " + totalNoOfChits + " chits.";
  return message;
};

const formatForPayChitDue = (dues) => {
  let message = "Here are your current Due Chit Details:\n\n";
 let totalNoOfChitDues = 0;
  dues.forEach((d, index) => {
    totalNoOfChitDues += 1;
    message += `${index + 1}.
Chit Number: ${d.pchitno}
Current Installment: ₹${d.pcurrentmonthinstallment}
Pending Due: ₹${d.pdue}
Net Payable: ₹${d.pnetpayable}
------------------------------\n`;
  });

  message += "\nTell me the chit number and chit amount for which you want to pay the due. for example, 'Pay ₹5000 for chit KSET14F-45'.";
  return message;
};



module.exports = {
  formatDueDetails,
  formatChitDetails
  ,formatForPayChitDue
};
