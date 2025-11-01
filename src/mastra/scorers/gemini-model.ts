import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function explainTopic(topic: string): Promise<string> {
  const prompt = `
  Explain the topic "${topic}" for a student.
  Provide a clear breakdown, examples, and 3 study resources (books, videos, or articles).
  Format as:
  - **Explanation**
  - **Study Materials**
  - **Next Step Prompt**
  `;

  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  return text;
}
