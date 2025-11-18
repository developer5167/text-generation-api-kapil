// ingest.js - UPDATED VERSION
const fs = require("fs");
const path = require("path");
const { getEmbedding } = require("./embeddings");
const { getCollection } = require("./chromaClient");

const txtDir = path.join(__dirname, "../data/pdfs");

// ADD THIS FUNCTION TO YOUR ingest.js
function parseEnhancedStructure(content, filename) {
  const chunks = [];
  
  // Split by major sections (looking for ALL_CAPS_HEADERS: pattern)
  const majorSections = content.split(/\n\n(?=[A-Z][A-Z_]+:)/);
  
  majorSections.forEach(section => {
    if (section.trim().length < 10) return;
    
    const lines = section.split('\n');
    const headerMatch = lines[0].match(/^([A-Z][A-Z_]+):/);
    const header = headerMatch ? headerMatch[1] : 'GENERAL';
    
    // Create chunk for entire section
    chunks.push({
      text: section.trim(),
      metadata: {
        major_section: header,
        file: filename,
        content_type: 'structured_section',
        priority: getPriority(header)
      }
    });
    
    // Also create smaller chunks for bullet points and key-value pairs
    const bulletPoints = section.match(/^- .+$/gm);
    if (bulletPoints) {
      bulletPoints.forEach((point, index) => {
        const cleanPoint = point.replace(/^- /, '').trim();
        if (cleanPoint.length > 10) {
          chunks.push({
            text: `${header}: ${cleanPoint}`,
            metadata: {
              major_section: header,
              sub_section: `point_${index + 1}`,
              file: filename,
              content_type: 'bullet_point',
              priority: 'medium'
            }
          });
        }
      });
    }
    
    // Extract key-value pairs (Format: - Key: Value)
    const keyValuePairs = section.match(/^- [A-Za-z ]+:.+$/gm);
    if (keyValuePairs) {
      keyValuePairs.forEach((pair, index) => {
        const cleanPair = pair.replace(/^- /, '').trim();
        chunks.push({
          text: `${header}: ${cleanPair}`,
          metadata: {
            major_section: header,
            sub_section: `detail_${index + 1}`,
            file: filename,
            content_type: 'key_value',
            priority: 'medium'
          }
        });
      });
    }
  });
  
  return chunks;
}

function getPriority(section) {
  const highPriority = [
    'SAFETY_SECURITY', 'COMPANY_CREDENTIALS', 'BASIC_CONCEPT', 
    'CONTACT_CHANNELS', 'FINANCIAL_ADVANTAGES', 'KEY_TERMINOLOGY'
  ];
  return highPriority.includes(section) ? 'high' : 'medium';
}

// ENHANCED INGESTION FUNCTION
async function enhancedIngest() {
  const collection = await getCollection();
  const files = fs.readdirSync(txtDir).filter(f => f.endsWith(".txt"));
  let totalChunks = 0;

  console.log("🔄 Starting enhanced ingestion with structured parsing...");

  for (const file of files) {
    console.log(`📝 Processing ${file} with enhanced parser...`);
    
    try {
      const filePath = path.join(txtDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      // USE THE ENHANCED PARSER INSTEAD OF OLD CHUNKING
      const chunks = parseEnhancedStructure(content, file);
      
      console.log(`📊 ${file}: Created ${chunks.length} structured chunks`);
      
      for (const chunk of chunks) {
        // Only process chunks with sufficient content
        if (chunk.text.length < 20) continue;
        
        const embedding = await getEmbedding(chunk.text);
        
        await collection.add({
          ids: [`${file}_${chunk.metadata.major_section}_${totalChunks}`],
          documents: [chunk.text],
          embeddings: [embedding],
          metadatas: [chunk.metadata],
        });
        
        totalChunks++;
      }
      
      console.log(`✅ ${file}: Added ${chunks.length} chunks to database`);
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`🎉 Enhanced ingestion complete! Total chunks: ${totalChunks}`);
}

// Replace your current ingest() call with:
enhancedIngest().catch(err => console.error("❌ Enhanced ingest failed:", err));