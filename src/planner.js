// planner.js
const router = require("./router");
const slots = require("./slots");
const conversationManager = require("./conversationManager");
const intentHandlers = require("./intentHandlers"); // expects handleApiIntent(intent, userId, mobile, token, message, slots)
const responses = require("./responses/builder");

async function handle(userId, message, meta = {}) {
  // route first
  const route = await router.route(userId, message);

  if (route.action === "clarify") {
    return responses.text("I didn't understand — could you clarify what you'd like to do?");
  }

  if (route.action === "answer" || route.action === "knowledge") {
    // forward to knowledge handler (intentHandlers.searchAndAnswer)
    const ans = await intentHandlers.searchAndAnswer(userId, meta.mobile, meta.token, message);
    return ans; // expect structured blocks
  }

  if (route.action === "tool") {
    // Slot extraction stage: try deterministic first
    const chitNums = slots.extractChitNumber(message);
    const amounts = slots.extractAmounts(message);
    let indexes = null;
    const lastList = conversationManager.getLastList(userId);
    if (lastList && lastList.list && lastList.list.length) {
      indexes = slots.extractIndexes(message, lastList.list.length);
    }

    let slotPayload = { chitNumbers: chitNums, amounts, indexes };

    // If nothing detected, try LLM fallback
    if ((!chitNums || chitNums.length === 0) && (!amounts || amounts.length === 0) && (!indexes || indexes.length === 0)) {
      const lres = await slots.llmExtractSlots(userId, message);
      slotPayload = lres;
      // try to map 'last' if needed (llm may return last index as number)
    }

    // Call the tool handler with slots
    const result = await intentHandlers.handleApiIntent(route.intent, userId, meta.mobile, meta.token, message, slotPayload);
    // Expect result to be structured response (blocks) OR plain string
    return result;
  }

  // fallback
  return responses.text("Sorry, I couldn't understand that. Would you like me to search our docs?");
}
async function handleActionPayload(userId, actionPayload, meta = {}) {
  try {
    const { action, payload } = actionPayload;

    // ACTION: pay_indexes
    if (action === "pay_indexes") {
      const { indexes } = payload;
      const last = conversationManager.getLastList(userId);

      if (!last || !last.list || !last.list.length) {
        return responses.text("Please show your dues first.");
      }

      // indexes → convert to slot format
      const slotPayload = { indexes, chitNumbers: [], amounts: [] };

      // Call payment intent handler directly
      return await intentHandlers.handleApiIntent(
        "proceed_payment",
        userId,
        meta.mobile,
        meta.token,
        "(via action)",
        slotPayload
      );
    }

    // ACTION: show_index
    if (action === "show_index") {
      const { index } = payload;
      const last = conversationManager.getLastList(userId);

      if (!last || !last.list) {
        return responses.text("Please show a list first.");
      }

      const item = last.list[index - 1];
      if (!item) {
        return responses.text("Invalid selection.");
      }

      // Return a nice block with details
      return {
        blocks: [
          { type: "text", text: `Here are the details for item ${index}:` },
          {
            type: "list",
            listType: last.type,
            items: [item],
          },
        ],
      };
    }

    // You can add more button actions here:
    // pay_single, show_details, repeat_last, etc.

    return responses.text("Action not recognized.");
  } catch (err) {
    console.error("handleActionPayload ERROR:", err);
    return responses.text("Sorry! Something went wrong while processing your request.");
  }
}

module.exports = { 
    
    handle,
    handleActionPayload,


 };
