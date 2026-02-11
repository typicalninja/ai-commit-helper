import { createOpenAICompatProvider } from "./openai-compat.ts";

export const ollamaProvider = createOpenAICompatProvider({
  name: "ollama",
  defaultModel: "llama3.2",
  requiresKey: false,
  defaultBaseUrl: "http://localhost:11434/v1",
});
