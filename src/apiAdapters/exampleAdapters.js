// apiAdapters/exampleAdapters.js
const baseUrl = process.env.KAPIL_BASE_URL || "https://testapi.kapilchitskarnataka.com";

async function GetSubscriberdues(mobile, token) {
  const res = await fetch(`${baseUrl}/api/GetSubscriberdues?Mobileno=${mobile}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to fetch dues");
  return await res.json(); // expect array of dues
}

async function GetChitDetails(mobile, token) {
  const res = await fetch(`${baseUrl}/api/GetSubscriberChitDetails?Mobileno=${mobile}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to fetch chit details");
  return await res.json();
}
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
     throw new Error("Something went wrong");
  }
  const responseBody = await response.json();
  console.log(responseBody);
  
  return responseBody;
     
};

// Simulated pay adapter — adapt to your real payment API
async function PayDue(mobile, token, chitNumber, amount) {
  // If you have a payment initiation API, call it here and return a UPI URL or tx id
  // For demo: return simulated upiUrl string
  return { success: true, upiUrl: `upi://pay?pa=9999999999@upi&pn=KapilChits&am=${amount}&tn=ChitPayment` };
}

module.exports = { GetSubscriberdues, GetChitDetails, PayDue,GetTransactions };
