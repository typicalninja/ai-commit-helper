import { createOpenAICompatProvider } from "./openai-compat.ts";

export const geminiProvider = createOpenAICompatProvider({
  name: "gemini",
  defaultModel: "gemini-2.5-flash-lite",
  requiresKey: true,
  defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
});
