
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { studyPalAgent } from '../agents/studypal-agent';

const explanationSchema = z.object({
  explanation: z.string(),
  topic: z.string(),
});

const fetchExplanation = createStep({
  id: 'fetch-explanation',
  description: 'Fetches an explanation for a given topic',
  inputSchema: z.object({
    topic: z.string().describe('The topic to get an explanation for'),
  }),
  outputSchema: explanationSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('studyPalAgent');
    if (!agent) {
      throw new Error('StudyPal agent not found');
    }

    const response = await agent.stream([
      {
        role: 'user',
        content: `Explain the topic "${inputData.topic}" for a student.`,
      },
    ]);

    let explanationText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      explanationText += chunk;
    }

    return {
      explanation: explanationText,
      topic: inputData.topic,
    };
  },
});

const studyPalWorkflow = createWorkflow({
  id: 'studypal-workflow',
  inputSchema: z.object({
    topic: z.string().describe('The topic to get an explanation for'),
  }),
  outputSchema: z.object({
    explanation: z.string(),
  }),
})
  .then(fetchExplanation)

studyPalWorkflow.commit();

export { studyPalWorkflow };
