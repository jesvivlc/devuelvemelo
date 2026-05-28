import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { LoanWithContact, Tone } from "@/lib/supabase/types";
import { buildReminderPrompt } from "@/lib/llm/prompts";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 300;

function getClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

export async function generateReminder(
  loan: LoanWithContact,
  tone: Tone
): Promise<{ copy: string; tokensIn: number; tokensOut: number }> {
  const { system, user } = buildReminderPrompt(loan, tone);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected LLM response format");
  }

  return {
    copy: block.text.trim(),
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}
