const formatDueDetails = (dues) => {
  let message = "Here are your current Due Details:\n\n";
 let totalNoOfChitDues = 0;
  dues.forEach((d, index) => {
    totalNoOfChitDues += 1;
    message += `
Chit Number: ${d.pchitno}
Branch: ${d.pvchbranch}

Current Installment: ₹${d.pcurrentmonthinstallment}
Penalty: ₹${d.ppenalty}
Pending Due: ₹${d.pdue}
Net Payable: ₹${d.pnetpayable}
------------------------------\n`;
  });

  message += "\nif want to pay any due, please tell me the chit number and the amount to pay. i will do the rest.";
  return message;
};
const formatChitDetails = (dues) => {
  let totalNoOfChits = 0;
  let message = "Here are your current Chit Details:\n\n";

  dues.forEach((d,index) => {
    totalNoOfChits += 1;
    message += `
Chit Number: ${d.pchitno}
Branch: ${d.pvchbranch}

Name: ₹${d.psubscribername}
Auction Month: ₹${d.pauctmonth}
Chit Value: ₹${d.pchitvalue}
Auction Date: ${d.pauctiondate}
------------------------------\n`;
  });
  message += "Do you want to know the last transaction details for any chit? If yes, please provide the group code and i will fetch it for you.";
  return message;
};

const formatForPayChitDue = (dues) => {
  let message = "Here are your current Due Chit Details:\n\n";
  dues.forEach((d, index) => {
    message += `
Chit Number: ${d.pchitno}
Current Installment: ₹${d.pcurrentmonthinstallment}
Pending Due: ₹${d.pdue}
Net Payable: ₹${d.pnetpayable}
------------------------------\n`;
  });

  message += "\nTell me the chit number and chit amount for which you want to pay the due. for example, 'Pay ₹5000 for chit KSET14F-45'. then i will process your payment.";
  return message;
};
const formatTransactionDetails = (dues) => {
  let message = "Here are your last transactions:\n\n";
  dues.forEach((d, index) => {
    message += `
Tr.No: ${d.ptransno}
Grp Code: ${d.pgroupcode}
Tr Date: ${formatReadableDate(d.ptransdate)}
Amount: ₹${d.ptotalamount}
------------------------------`;} );

message += "\n Now do you want to no your chit dues or chit details? just ask me.";
return message;
};

function formatReadableDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
const formatAuctionsDetails = (dues) => {
  let message = "Here are your last auctions:\n\n";
  dues.forEach((d, index) => {
    message += `
Subscriber name: ${d.vchsubscribername}
Auction Date: ${d.auctiondate}
Auction Status: ${d.auctionstatus}
A.Date/Time: ₹${d.auctiondatetime}\n\n
CLICK HERE TO PLACE BID: ${d.auctionlink}

------------------------------`;} );

message += "\n ";
return message;
};
module.exports = {
  formatDueDetails,
  formatChitDetails
  ,formatForPayChitDue
  ,formatAuctionsDetails
  ,formatTransactionDetails
};
