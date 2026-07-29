import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { buildClarifyPrompt, MAX_CLARIFYING_QUESTIONS } from "@/lib/prompts";
import type { ClarifyResponse, QAPair } from "@/lib/types";

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function isValidShape(value: unknown): value is ClarifyResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.status === "sufficient" || v.status === "insufficient") return true;
  if (v.status === "question" && typeof v.text === "string") return true;
  return false;
}

export async function POST(request: Request) {
  let body: { decision?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const decision = typeof body.decision === "string" ? body.decision : "";
  const history: QAPair[] = Array.isArray(body.history)
    ? body.history.filter(
        (qa): qa is QAPair =>
          !!qa && typeof qa.question === "string" && typeof qa.answer === "string"
      )
    : [];

  if (!decision.trim()) {
    return NextResponse.json({ error: "Missing decision text." }, { status: 400 });
  }

  const prompt = buildClarifyPrompt(decision, history);

  let raw: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (err) {
    console.error("Anthropic request failed in /api/clarify:", err);
    return NextResponse.json({ error: "Failed to reach the analysis model." }, { status: 502 });
  }

  let parsed: ClarifyResponse;
  try {
    const candidate = JSON.parse(stripFences(raw));
    if (!isValidShape(candidate)) {
      throw new Error("Unexpected shape");
    }
    parsed = candidate;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse the clarifying-question response." },
      { status: 500 }
    );
  }

  // Hard cap: never allow a question once the maximum has been reached.
  if (history.length >= MAX_CLARIFYING_QUESTIONS && parsed.status === "question") {
    parsed = { status: "insufficient" };
  }

  return NextResponse.json(parsed);
}
