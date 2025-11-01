import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// ✅ Initialize Gemini properly
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const studyPalTool = createTool({
  id: "explain-topic",
  description: "Get an explanation for a topic",
  inputSchema: z.object({
    topic: z.string().describe("The topic to explain"),
  }),
  outputSchema: z.object({
    explanation: z.string(),
  }),
  execute: async ({ context }) => {
    const prompt = `
      Explain the topic "${context.topic}" for a student.
      Provide a clear breakdown, examples, and 3 study resources (books, videos, or articles).
      Format as:
      - **Explanation**
      - **Study Materials**
      - **Next Step Prompt**
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return {
      explanation: text,
    };
  },
});

export const quizTool = createTool({
  id: "generate-quiz",
  description: "Generate a quiz based on a given topic",
  inputSchema: z.object({
    topic: z.string().describe("Topic for quiz questions"),
    numQuestions: z
      .number()
      .default(5)
      .describe("Number of questions to generate"),
  }),
  outputSchema: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).optional(),
        answer: z.string().optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { topic, numQuestions } = context;

    try {
      const prompt = `
        Create a ${numQuestions}-question multiple-choice quiz on the topic "${topic}".
        Each question should have 4 options and indicate the correct answer.
        Format as JSON:
        [
          {
            "question": "What is ...?",
            "options": ["A", "B", "C", "D"],
            "answer": "A"
          }
        ]
      `;

      const result = await model.generateContent(prompt);

      // ✅ Handle text output correctly
      const text = await result.response.text();
      // Strip markdown code block fences before parsing
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      const parsed = JSON.parse(jsonString);

      return { questions: parsed };
    } catch (err: any) {
      console.error("Quiz tool error:", err);
      throw new Error(`Failed to generate quiz: ${err.message}`);
    }
  },
});
