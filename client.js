const { io } = require("socket.io-client");

const socket = io("http://localhost:6000");

socket.on("connect", () => {
  console.log("✅ Connected to Natasha");
  socket.emit("ask_natasha", "Explain how chit funds work.");
});

socket.on("natasha_response", (data) => {
  console.log("🤖 Natasha:", data.answer);
});

socket.on("natasha_error", (err) => {
  console.error("⚠️ Error:", err.error);
});
