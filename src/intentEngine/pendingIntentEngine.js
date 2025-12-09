// src/intentEngine/pendingIntentEngine.js

const { INTENT_SCHEMAS } = require("./intentSchema.js");
const { extractSlots } = require("./slotExtractor.js");

// store per-user pending intent (use redis/db if needed)
const pendingIntents = {};

 function getPendingIntent(userId) {
    return pendingIntents[userId] || null;
}

 function clearPendingIntent(userId) {
    delete pendingIntents[userId];
}

 function startPendingIntent(userId, intentName) {
    const schema = INTENT_SCHEMAS[intentName];
    pendingIntents[userId] = {
        intent: intentName,
        collected: {},
        requiredParams: schema.params
    };
}

 function updatePendingIntent(userId, userMessage) {
    const pending = pendingIntents[userId];
    if (!pending) return null;

    // extract slot values dynamically
    const extracted = extractSlots(userMessage, pending.requiredParams);

    Object.entries(extracted).forEach(([key, val]) => {
        if (val) pending.collected[key] = val;
    });

    return pending;
}

 function getMissingParam(userId) {
    const pending = pendingIntents[userId];
    if (!pending) return null;

    for (const [key, def] of Object.entries(pending.requiredParams)) {
        if (def.required && !pending.collected[key]) {
            return { key, prompt: def.prompt };
        }
    }
    return null;
}
module.exports={
    getMissingParam,
    updatePendingIntent,
    startPendingIntent,
    clearPendingIntent,
    getPendingIntent
}
