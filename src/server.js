const express = require("express");
const cors = require("cors");
const { queryNatasha } = require("./query");
const { handleApiIntent } = require("./intentHandlers"); // ✅ New import
const conversationManager = require("./conversationManager");
const { getResponseHandler } = require("./responseHandlers"); // ✅ New import

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

function generateUserId(req) {
  const { mobile } = req.body;
  const sessionId = req.headers["session-id"] || req.ip;
  return mobile || `anon-${sessionId}`;
}

app.post("/api/ask-natasha", async (req, res) => {
  try {
    const { message, mobile } = req.body;
    const { authorization } = req.headers;
    const token = authorization && authorization.split(" ")[1];

    const userId = generateUserId(req);

    console.log(
      `💬 User asked: ${message} (Mobile: ${mobile}) Authorization:${authorization}`
    );

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required",
      });
    }
    // server.js - inside /api/ask-natasha handler, after userId, message, mobile, token prepared
    const pending = conversationManager.getPendingIntent(userId);
    if (pending) {
      // try to extract any of the pending params from the current message
      const extracted = await require("./slotExtractor").extractSlots(
        message,
        pending.requiredParams
      );

      // if any param found, update pending
      if (Object.keys(extracted).length > 0) {
        const updated = conversationManager.updatePendingCollected(
          userId,
          extracted
        );

        // if now complete -> execute API and return result to user
        if (conversationManager.isPendingComplete(userId)) {
          // call intent handler uniformly
          const collected = updated.collectedParams;
          // run the same handleApiIntent flow you already have
          const apiOutput = await require("./intentHandlers").handleApiIntent(
            pending.intentName,
            mobile,
            token,
            message,
            collected
          );

          conversationManager.clearPendingIntent(userId);
          conversationManager.addToHistory(userId, message, apiOutput);

          return res.json({
            message: message,
            answer: apiOutput,
            timestamp: new Date().toISOString(),
          }); // this is the only early return for pending flows
        }
        // otherwise: user provided some param but still missing others.
        // Do NOT return here — continue to NORMAL NATASHA flow below.
      }
      // user didn't provide any pending param — do NOT return; continue normal flow.
    }

    const answer = await queryNatasha(userId, message);

    console.log(`🤖 Natasha answered: ${answer}`);
    if (answer.type === "api_intent") {
      const apiAnswer = await handleApiIntent(
        answer.intent,
        mobile,
        token,
        message
      );
      conversationManager.addToHistory(userId, message, answer);
      const responseHandler = getResponseHandler(answer.intent);
      const response = responseHandler(message, apiAnswer);

      return res.json(response);
    } else {
      res.json({
        message: message,
        answer: answer
          .replace("The answer is ", "")
          .replace("Answer: ", "")
          .replace("The answer is: ", "")
          .trim(),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("❌ Natasha error:", err);
    res.status(500).json({
      error: "Sorry, something went wrong.",
    });
  }
});

app.post("/api/clear-session", (req, res) => {
  const { userId } = req.body;
  conversationManager.clearSession(userId);
  res.json({ status: "Session cleared", userId });
});

app.get("/api/session-info", (req, res) => {
  const userId = generateUserId(req);
  const session = conversationManager.getSession(userId);

  res.json({
    userId,
    historyLength: session.history.length,
    context: session.context,
    lastActive: session.lastActive,
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    activeSessions: conversationManager.sessions.size,
    timestamp: new Date().toISOString(),
  });
});
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Natasha API is running",
    timestamp: new Date().toISOString(),
  });
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Natasha API server running on port ${PORT}`)
);
