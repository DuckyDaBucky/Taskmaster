import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Class from "../../models/classModel.js";
import FlashCard from "../../models/flashCardsModel.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function flashCardGeneration(classId, userId, resourceId = null) {
  let savedCount = 0;
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error("Class not found");
  }
  console.log(classDoc);

  const topics = classDoc.topics || []; // Array of topic strings (can be empty)
  const flashcards = [];

  // If no topics, generate flashcards from class name and general info
  if (topics.length === 0) {
    const prompt = `
      Generate 10 flashcards in JSON format for the class "${classDoc.name}".
      Each flashcard should include:
      - topic: "${classDoc.name}"
      - question: A relevant question about ${classDoc.name} (1-2 sentences max)
      - answer: A short, clear answer (1-2 sentences max)
      
      Format as an array of objects like this:
      [
        {
          "topic": "${classDoc.name}",
          "question": "...",
          "answer": "..."
        },
        ...
      ]
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0]);
        flashcards.push(...cards);
      }
    } catch (err) {
      console.error(`Failed to generate flashcards for class "${classDoc.name}":`, err.message);
    }
  } else {
    // Generate flashcards for each topic
    for (const topic of topics) {
      const topicStr = typeof topic === 'string' ? topic : (topic.title || topic.name || String(topic));
      const prompt = `
        Generate 10 flashcards in JSON format for the following topic.
        Each flashcard should include:
        - topic: "${topicStr}"
        - question: A relevant question based on the topic (1-2 sentences max)
        - answer: A short, clear answer (1-2 sentences max)
        
        Topic: "${topicStr}"
        
        Format as an array of objects like this:
        [
          {
            "topic": "${topicStr}",
            "question": "...",
            "answer": "..."
          },
          ...
        ]
      `;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          const cards = JSON.parse(jsonMatch[0]);
          flashcards.push(...cards);
        } else {
          console.warn("No JSON array found in response for topic:", topicStr);
        }
      } catch (err) {
        console.error(`Failed to generate flashcards for topic "${topicStr}":`, err.message);
      }
    }
  }

  //Add to mongodb
  // let savedCount = 0; // Removed duplicate declaration
  try {
    for (const flash of flashcards) {
      // Ensure all required fields are present
      if (!flash.question || !flash.answer) {
        console.warn("Skipping flashcard with missing question or answer:", flash);
        continue;
      }

      try {
        const newFlashCard = new FlashCard({
          topic: flash.topic || classDoc.name || "General",
          question: String(flash.question).trim(),
          answer: String(flash.answer).trim(),
          class: classId,
          user: userId
        });

        // Validate before saving
        if (!newFlashCard.question || !newFlashCard.answer) {
          console.warn("Skipping flashcard with empty question or answer after processing");
          continue;
        }

        await newFlashCard.save();
        savedCount++;
      } catch (saveError) {
        console.error("Error saving individual flashcard:", saveError);
        // Continue with next card
      }
    }
    console.log(`FlashCards saved to database for user ${userId}. Count: ${savedCount}`);
    return savedCount;
  } catch (error) {
    console.error("Error saving flashcards to database: ", error);
    throw error; // Re-throw to let caller handle
  }
}

export default flashCardGeneration;