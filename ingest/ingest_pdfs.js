// ingest/ingest_pdfs.js

import { createRequire } from "module";
const require = createRequire(import.meta.url);


import fs from "fs";
import path from "path";
const pdf = require("pdf-parse");

const RAW_DIR = path.resolve("data/raw_pdfs");
const OUT_FILE = path.resolve("data/chunks.json");

function cleanAndFilter(text) {
  // basic cleaning: remove many base64-like lines, excessive tables
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const keep = lines.filter(line => {
    if (!line) return false;
    // if a line has too many digits (table row), drop it
    const digits = (line.match(/\d/g) || []).length;
    if (digits > 18) return false;
    // ignore long base64 like things
    if (line.startsWith("data:image/")) return false;
    // ignore very short lines
    if (line.length < 30) return false;
    return true;
  });
  return keep.join(" ");
}

function chunkText(text, wordsPerChunk = 300, overlapWords = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + wordsPerChunk).join(" ");
    chunks.push(slice);
    i += wordsPerChunk - overlapWords;
  }
  return chunks;
}

async function processAll() {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".pdf"));
  const chunksOut = [];
  for (const file of files) {
    const buf = fs.readFileSync(path.join(RAW_DIR, file));
    const data = await pdf(buf);
    const cleaned = cleanAndFilter(data.text || "");
    const chunks = chunkText(cleaned, 300, 50);
    chunks.forEach((c, idx) =>
      chunksOut.push({
        id: `${file.replace(".pdf","")}_chunk_${idx}`,
        source: file,
        text: c,
        category: "kapil_info"
      })
    );
    console.log(`Processed ${file}: ${chunks.length} chunks`);
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(chunksOut, null, 2));
  console.log(`Saved ${chunksOut.length} chunks to ${OUT_FILE}`);
}

processAll().catch(err => {
  console.error(err);
  process.exit(1);
});
