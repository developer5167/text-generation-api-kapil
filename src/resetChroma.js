// src/resetChroma.js
const { ChromaClient } = require("chromadb");

async function resetChroma() {
  const client = new ChromaClient({
    host: "localhost",
    port: 8000,
    ssl: false,
  });

  const collections = await client.listCollections();
  console.log("🗂 Existing collections:", collections.map(c => c.name));

  for (const col of collections) {
    console.log("🗑 Deleting collection:", col.name);
    await client.deleteCollection({ name: col.name });
  }

  console.log("✅ All collections deleted successfully.");
}

resetChroma().catch(console.error);

module.exports = { resetChroma };


