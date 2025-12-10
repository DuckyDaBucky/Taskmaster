import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import Class from '../../models/classModel.js';
dotenv.config();
import {parseAndSaveSyllabus as taskParser} from "./taskParser.js"

const genAI = new GoogleGenerativeAI(process.env.Google_GenAI_URL);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


async function readSyllabus(filePath) {
  try {
    return await fs.readFile(filePath); 
    
  } catch (error) {
    console.error('Error reading syllabus', error);
    return null;
  }
}

async function extractSyllabusDataTasks(syllabusText) {
  const prompt = `
    Extract the following information which is the class info from syllabus, also nicly format the gradingPolicy stuff and make the gradingPolicy relatively short but includes the numbers, dont mention the assignments or its points:

    {
        name: String,
        professor: String, 
        timing: String (timing of class),
        examDates: [Date] (dates of all exams, ISO 8601 for data deadlines and set to 11:59 pm),
        topics: [String] (string of all units),
        gradingPolicy: String (string of grading policy),
        contactInfo: String (string of only email),
        textbooks: [String] (string array of the textbooks to buy),
        location: String (String of room location),
    }
    provide the JSON without any surrounding text for markdown.
  `;

  const result = await model.generateContent([ 
    {
      inlineData: {
        data: syllabusText.toString("base64"),
        mimeType: "application/pdf"
      }
    }, 
    prompt
  ]);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```(?:json)?\n?/g, '');
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API returned invalid JSON:', error);
    return null;
  }
}

async function saveClassesToDatabase(classes, userId) {
  console.log("Start of class mongose code");
  

  try {
    classes.user = userId;
    const newClass = new Class(classes);
    
    await newClass.save();
    const classId = newClass._id;
    
    console.log(`Class "${Class.title}" saved to database.`);

    return classId;

  } catch(error) {
      console.error("Error saving class to database: ", error);
  }
}

async function parseAndSaveSyllabus(syllabusFilePath, userId) {
  const syllabusText = await readSyllabus(syllabusFilePath);
  if (!syllabusText) {
      console.error("Failed to read syllabus file.");
      return;
  }

  const classText = await extractSyllabusDataTasks(syllabusText);
  if (!classText) {
      console.error("Failed to extract classes from syllabus.");
      return;
  }

  const classId = await saveClassesToDatabase(classText, userId);
  console.log("Syllabus parsed and classes saved successfully.");
  taskParser(syllabusFilePath, classId);
  
}


export {extractSyllabusDataTasks, readSyllabus, saveClassesToDatabase, parseAndSaveSyllabus};