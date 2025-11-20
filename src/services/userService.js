const axios = require('axios');
const baseUrl = 'https://testapi.kapilchitskarnataka.com/';
const formatDueDetails = require('../templates/fetchTemplates').formatDueDetails;
const formatChitDetails = require('../templates/fetchTemplates').formatChitDetails;

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
  console.log(responseBody);
  
  
  const formattedMessage = formatDueDetails(responseBody);
  return formattedMessage;
     
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
  console.log(responseBody);
  
  
  const formattedMessage = formatChitDetails(responseBody);
  return formattedMessage;
     
};
module.exports = {
  GetSubscriberdues,
  GetChitDetails
};
