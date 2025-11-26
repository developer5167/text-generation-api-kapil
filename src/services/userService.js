const axios = require('axios');
const baseUrl = 'https://testapi.kapilchitskarnataka.com/';

const GetSubscriberdues = async (mobile, token) => {
  const response = await fetch(`${baseUrl}/api/GetSubscriberdues?Mobileno=${mobile}`,
    {
        method: 'GET',
        headers: {

            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Replace with actual API key
        }
    }

  );
  if (!response.ok) {
    return "Im sorry! I couldn't fetch your subscriber dues at the moment.";
  }
  const responseBody = await response.json();
  return responseBody;
  
  
     
};
const GetTransactions = async (groupcodetickectno, token) => {
  const response = await fetch(`${baseUrl}/api/GetSubscriberChitDetailsbasedongroupcode?groupcodetickectno=${groupcodetickectno}`,
    {
        method: 'GET',
        headers: {

            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Replace with actual API key
        }
    }

  );
  if (!response.ok) {
    return "Im sorry! I couldn't fetch your transactions at the moment.";
  }
  const responseBody = await response.json();
  return responseBody;
  
  
     
};
const GetChitDetails = async (mobile, token) => {
  const response = await fetch(`${baseUrl}/api/GetSubscriberChitDetails?Mobileno=${mobile}`,
    {
        method: 'GET',
        headers: {

            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Replace with actual API key
        }
    }

  );
  if (!response.ok) {
    return "Im sorry! I couldn't fetch your chit deatils at the moment.";
  }
  const responseBody = await response.json();  
  
  return responseBody;     
};
const GetAuctionDetails = async (mobile, token) => {
  const response = await fetch(`${baseUrl}/api/GetSubscriberauctionDetails?Mobileno=${mobile}`,
    {
        method: 'GET',
        headers: {

            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Replace with actual API key
        }
    }

  );
  if (!response.ok) {
    return "Im sorry! I couldn't fetch your chit deatils at the moment.";
  }
  const responseBody = await response.json();  
  console.log(response.body);
  
  
  return responseBody;     
};

//  https://testapi.kapilchitskarnataka.com/api/GetSubscriberauctionDetailsAll?Mobileno=9705772178
module.exports = {
  GetSubscriberdues,
  GetChitDetails,
  GetTransactions,
  GetAuctionDetails
};
