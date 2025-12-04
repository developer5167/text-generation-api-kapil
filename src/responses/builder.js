// responses/builder.js
function text(msg) {
  return { blocks: [{ type: "text", text: msg }], timestamp: new Date().toISOString() };
}

function list(type, items, hint) {
  return {
    blocks: [
      { type: "text", text: hint || "" },
      { type: "list", listType: type, items: items }
    ],
    timestamp: new Date().toISOString()
  };
}

function actions(buttons) {
  return { blocks: [{ type: "actions", buttons }], timestamp: new Date().toISOString() };
}

function qr(upiUrl) {
  return { blocks: [{ type: "qr", upiUrl }], timestamp: new Date().toISOString() };
}

function paymentResult(results) {
  return { blocks: [{ type: "payment_result", results }], timestamp: new Date().toISOString() };
}

module.exports = { text, list, actions, qr, paymentResult };
