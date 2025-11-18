// reset_and_ingest.js
const { resetChroma } = require("./resetChroma");
const { unifiedIngest } = require("./ingest");

async function resetAndIngest() {
  console.log("🔄 Resetting ChromaDB...");
  await resetChroma();
  
  console.log("📥 Re-ingesting data...");
  await unifiedIngest();
  
  console.log("✅ Ready to use! Start your chat with: node query.js");
}

resetAndIngest().catch(console.error);