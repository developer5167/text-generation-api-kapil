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
module.exports = {
  GetSubscriberdues,
  GetChitDetails
};
