const fs = require("fs");
const { pipeline } = require("@xenova/transformers");

(async () => {
  console.log("🧠 Generating embeddings for Natasha intents...");

  const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const intents = JSON.parse(fs.readFileSync("src/intents.json", "utf-8"));

  for (const intent of intents) {
    intent.embeddings = [];
    for (const example of intent.examples) {
      const output = await model(example, { pooling: "mean", normalize: true });
      intent.embeddings.push(Array.from(output.data));
      console.log(`✅ Embedded: "${example}" → ${intent.name}`);
    }
  }

  fs.writeFileSync("./intent_embeddings.json", JSON.stringify(intents, null, 2));
  console.log("\n🎯 Intent embeddings saved to intent_embeddings.json");
})();
