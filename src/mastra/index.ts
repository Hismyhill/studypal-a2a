import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { studyPalWorkflow } from "./workflows/studypal-workflow";
import { studyPalAgent } from "./agents/studypal-agent";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  explanationQualityScorer,
} from "./scorers/studypal-scorer";
import { a2aAgentRoute } from "./routes/studypal-route";

export const mastra = new Mastra({
  workflows: { studyPalWorkflow },
  agents: { studyPalAgent },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,

    explanationQualityScorer,
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
    apiRoutes: [a2aAgentRoute],
  },
});
