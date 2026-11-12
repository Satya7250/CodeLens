import "server-only";

import type OpenAI from "openai";

import { createOpenRouterClient, getOpenRouterErrorStatus } from "@/lib/embeddings/openrouter";

export class OpenRouterChatError extends Error {
  constructor(
    message = "The AI provider could not complete the request. Please try again later.",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OpenRouterChatError";
  }
}

function getChatModel(): string {
  const model = process.env.OPENROUTER_CHAT_MODEL?.trim();
  if (!model) {
    throw new OpenRouterChatError(
      "Chat is not configured. Set OPENROUTER_CHAT_MODEL to a compatible OpenRouter chat model, such as openai/gpt-4o-mini.",
    );
  }
  return model;
}

export type OpenRouterChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export async function generateChatCompletion(messages: OpenRouterChatMessage[]): Promise<string> {
  const model = getChatModel();

  try {
    const response = await createOpenRouterClient().chat.completions.create({
      model,
      messages,
      max_tokens: 1200,
      temperature: 0.2,
    });
    const answer = response.choices[0]?.message.content;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new OpenRouterChatError(
        "The AI provider returned an empty response. Please try again.",
      );
    }

    return answer.trim();
  } catch (error) {
    if (error instanceof OpenRouterChatError) {
      throw error;
    }
    const status = getOpenRouterErrorStatus(error);
    console.error("OpenRouter chat completion failed.", { status });
    if (status === 401) {
      throw new OpenRouterChatError(
        "OpenRouter rejected the API key. Update OPENROUTER_API_KEY in apps/web/.env.local and restart the app.",
        { cause: error },
      );
    }
    throw new OpenRouterChatError(undefined, { cause: error });
  }
}
