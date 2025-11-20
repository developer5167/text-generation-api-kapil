const express = require("express");
const cors = require("cors");
const { queryNatasha } = require("./query");
const { GetSubscriberdues,GetChitDetails } = require("./controllers/userController");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// API endpoint for Natasha
app.post("/api/ask-natasha", async (req, res) => {
  try {
    const { message, mobile } = req.body;
    const { authorization } = req.headers;
    const token = authorization && authorization.split(" ")[1];

    console.log(
      `💬 User asked: ${message} (Mobile: ${mobile}) Authorization:${authorization}`
    );

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const answer = await queryNatasha(message);

    console.log(`🤖 Natasha answered: ${answer}`);
    if (answer == "subscriber_dues") {
      if (!mobile || mobile.trim() === "" || token === "" || !token) {
        res.json({
          message: message,
          answer:
            "Please login with a valid mobile number to fetch your subscriber dues.",
          timestamp: new Date().toISOString(),
        });
        return;
      }
      GetSubscriberdues(mobile, token).then((data) => {
        res.json({
          message: message,
          answer: data,
          timestamp: new Date().toISOString(),
        });
      });
      return;
    }else if (answer === "chit_details") {
      if (!mobile || mobile.trim() === "" || token === "" || !token) {

        res.json({
          message: message,
          answer:     "Please login with a valid mobile number to fetch your chit details.",  
          timestamp: new Date().toISOString(),
        });
        return;
      }
      GetChitDetails(mobile, token).then((data) => {
        res.json({
          message: message,
          answer: data,
          timestamp: new Date().toISOString(),
        });
      });
      return;
    }  else {
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
