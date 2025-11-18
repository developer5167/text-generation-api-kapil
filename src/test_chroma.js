const { ChromaClient } = require("chromadb");

async function testChroma() {
  // ✅ Create the embedded client — this starts Chroma automatically
  const client = new ChromaClient();

  // ✅ Create or open a collection
  const collection = await client.getOrCreateCollection({
    name: "test_collection",
  });

  // ✅ Add a simple example
  await collection.add({
    ids: ["1"],
    documents: ["Kapil Chits offers reliable chit fund services."],
    embeddings: [[0.1, 0.2, 0.3]], // dummy vector for now
  });

  // ✅ Query the same embedding to verify it works
  const result = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 1,
  });

  console.log("✅ Chroma test result:", result.documents);
}

testChroma().catch(console.error);
