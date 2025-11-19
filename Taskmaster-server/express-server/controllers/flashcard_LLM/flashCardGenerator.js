import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Class from "../../models/classModel.js";
import FlashCard from "../../models/flashCardsModel.js"

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.Google_GenAI_URL);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function flashCardGeneration(classId) {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error("Class not found");
  }
  console.log(classDoc);

  const topics = classDoc.topics; // Array of topic objects
  const flashcards = [];

  for (const topic of topics) {
    const prompt = `
      Generate 10 flashcards in JSON format for the following topic.
      Each flashcard should include:
      - classId: "${classId}"
      - topic: "${topic}"
      - question: A relevant question based on the topic
      - answer: A short, clear answer
      
      Topic title: "${topic}"
      
      Format as an array of objects like this:
      [
        {
          "classId": "...",
          "topic": "...",
          "question": "...",
          "answer": "..."
        },
        ...
      ]
    `;

    try {
      const result = (await model.generateContent(prompt));
      const text = result.response.text(); // Gemini returns markdown-style text

      // Try parsing JSON content from Gemini's response
      const jsonMatch = text.match(/\[.*\]/s); // extract JSON array
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0]);
        flashcards.push(...cards); // add to overall array
      } else {
        console.warn("No JSON array found in response for topic:", topic.title);
      }
    } catch (err) {
      console.error(`Failed to generate flashcards for topic "${topic.title}":`, err.message);
    }
  }

  //Add to mongodb
  try {
      for(const flash of flashcards){
        const newFlashCard = new FlashCard(flash);
        newFlashCard.class = classId;
        await newFlashCard.save();
      }
      console.log(`FlashCards "${FlashCard.title}" saved to database.`);
  } catch(error) {
      console.error("Error saving class to database: ", error);
  }
}

export default flashCardGeneration;