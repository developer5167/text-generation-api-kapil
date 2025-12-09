// src/intentEngine/intentSchema.js

 const INTENT_SCHEMAS = {
    SHOW_TRANSACTIONS: {
        params: {
            group_code: { required: true, type: "string", prompt: "Please enter your group code" },
            from_date: { required: false, type: "string", prompt: "Enter start date (optional)" },
            limit: { required: false, type: "number", prompt: "How many records do you want?" }
        }
    },

    PAYMENT_HISTORY: {
        params: {
            customerId: { required: true, type: "string", prompt: "Enter customer ID" }
        }
    },

    // you can add unlimited API intents here without touching other code
};
module.exports={
    INTENT_SCHEMAS
}
