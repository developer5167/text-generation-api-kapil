// server-integration.js
const express = require("express");
const cors = require("cors");
const planner = require("./planner");
const conversationManager = require("./conversationManager");

const app = express();
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
    const token = (req.headers.authorization || "").split(" ")[1];
    if (!message || !message.trim()) return res.status(400).json({ error: "message required" });

    const userId = generateUserId(req);
    const meta = { mobile, token };

    // planner returns structured response
    const response = await planner.handle(userId, message, meta);

    // Add to history if needed
    try { conversationManager.addToHistory(userId, message, response); } catch(e){}

    return res.json(response);
  } catch (e) {
    console.error(e);
    res.status(500).json({ blocks: [{ type: "text", text: "Sorry, an error occurred." }] });
  }
});

app.listen(3000, () => console.log("Natasha API on :3000"));
