import { z } from "zod";
import { createToolCallAccuracyScorerCode } from "@mastra/evals/scorers/code";
import { createCompletenessScorer } from "@mastra/evals/scorers/code";
import { createScorer } from "@mastra/core/scores";

export const toolCallAppropriatenessScorer = createToolCallAccuracyScorerCode({
  expectedTool: "studyPalTool",
  strictMode: false,
});

export const completenessScorer = createCompletenessScorer();

// Custom LLM-judged scorer: evaluates if the explanation is high quality
export const explanationQualityScorer = createScorer({
  name: "Explanation Quality",
  description:
    "Checks that the explanation is clear, thorough, and easy to understand",
  type: "agent",
  judge: {
    model: "google/gemini-2.0-flash",
    instructions:
      "You are an expert evaluator of educational content. " +
      "Determine whether the assistant provided a high-quality explanation of the topic. " +
      "A high-quality explanation is clear, thorough, and easy to understand. " +
      "Return only the structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || "";
    return { assistantText };
  })
  .analyze({
    description: "Extract the explanation and evaluate its quality",
    outputSchema: z.object({
      isHighQuality: z.boolean(),
      confidence: z.number().min(0).max(1).default(1),
      explanation: z.string().default(""),
    }),
    createPrompt: ({ results }) => `
            You are evaluating if the StudyPal assistant provided a high-quality explanation.
            Assistant response:
            """
            ${results.preprocessStepResult.assistantText}
            """
            Tasks:
            1) Identify if the assistant provided an explanation.
            2) If so, evaluate whether the explanation is clear, thorough, and easy to understand.
            Return JSON with fields:
            {
            "isHighQuality": boolean,
            "confidence": number, // 0-1
            "explanation": string
            }
        `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    if (r.isHighQuality)
      return Math.max(0, Math.min(1, 0.7 + 0.3 * (r.confidence ?? 1)));
    return 0; // Not high quality
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Explanation quality scoring: isHighQuality=${r.isHighQuality ?? false}, confidence=${r.confidence ?? 0}. Score=${score}. ${r.explanation ?? ""}`;
  });

export const scorers = {
  toolCallAppropriatenessScorer,
  completenessScorer,
  explanationQualityScorer,
};
