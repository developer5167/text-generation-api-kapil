const { ChromaClient } = require("chromadb");
const { getEmbedding } = require("./embeddings");

const chroma = new ChromaClient({
  host: "localhost",  // if Docker running
  port: 8000,
  ssl: false,
});

const embeddingFunction = {
  generate: async (texts) => {
    const vectors = [];
    for (const text of texts) {
      const emb = await getEmbedding(text);
      vectors.push(emb);
    }
    return vectors;
  },
};

async function getCollection() {
  const collection = await chroma.getOrCreateCollection({
    name: "kapil_chits",
    embeddingFunction,
  });
  return collection;
}

module.exports = { getCollection };
