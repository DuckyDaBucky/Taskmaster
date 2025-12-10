import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyzes a document and determines which class it belongs to
 * Creates a new class if no good match exists
 */
export const classifyDocument = async (filename, fileContent, existingClasses) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are a smart document classifier for a student task management system.

EXISTING CLASSES:
${existingClasses.map(c => `- ${c.name}`).join('\n')}

DOCUMENT INFO:
Filename: ${filename}
Content preview: ${fileContent.substring(0, 1000)}

TASK:
1. Analyze this document
2. If it clearly belongs to one of the existing classes, return JUST the class name
3. If no good match exists, suggest a NEW class name based on the document's subject

RULES:
- Be specific but concise for new class names
- Match existing classes if there's >70% relevance
- For syllabi/course materials, extract the course name
- For notes/assignments, identify the subject

Return ONLY the class name, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const className = response.text().trim();

        console.log(`📚 AI Classification: "${filename}" → "${className}"`);

        return className;
    } catch (error) {
        console.error("Gemini classification error:", error);
        return "General"; // Fallback
    }
};

/**
 * Extracts text content from uploaded file for analysis
 */
export const extractFileContent = (file) => {
    // For now, use filename and basic metadata
    // TODO: Add PDF text extraction, image OCR, etc.
    return `File: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes`;
};
