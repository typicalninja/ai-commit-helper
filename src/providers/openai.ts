import { createOpenAICompatProvider } from "./openai-compat.ts";

export const openaiProvider = createOpenAICompatProvider({
  name: "openai",
  defaultModel: "gpt-4o-mini",
  requiresKey: true,
  defaultBaseUrl: "https://api.openai.com/v1",
});
