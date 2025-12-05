import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate a 2-3 sentence summary of a document/resource
 * Uses LangChain-style prompt engineering for concise output
 */
async function generateResourceSummary(filePath, resourceType = 'document') {
  try {
    let content = '';
    
    // Read file content
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error(`File not found: ${filePath}`);
    }

    // Limit content length for API (keep first 10000 chars)
    const truncatedContent = content.substring(0, 10000);

    const prompt = `
      Summarize the following ${resourceType} in exactly 2-3 sentences. 
      Be concise and focus on the main topics, key concepts, and important information.
      Do not exceed 3 sentences.
      
      Content:
      ${truncatedContent}
      
      Summary (2-3 sentences):
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    
    // Ensure summary is 2-3 sentences (enforce length constraint)
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const finalSummary = sentences.slice(0, 3).join('. ').trim();
    
    return finalSummary || summary;
  } catch (error) {
    console.error("Error generating resource summary:", error);
    throw error;
  }
}

/**
 * Generate summary from URL content (for web resources)
 */
async function generateURLSummary(url) {
  try {
    // For URLs, we'd typically fetch and parse HTML/text
    // For now, return a placeholder - can be enhanced with web scraping
    const prompt = `
      Based on the URL "${url}", generate a brief 2-3 sentence summary of what this resource likely contains.
      Be concise and informative.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating URL summary:", error);
    return null;
  }
}

export { generateResourceSummary, generateURLSummary };

