import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { buildAnalyzePrompt } from "@/lib/prompts";
import type { AnalysisResult, QAPair } from "@/lib/types";

const REQUIRED_KEYS: (keyof AnalysisResult)[] = [
  "decisionReframe",
  "keyAssumptions",
  "constraints",
  "reversibleFactors",
  "irreversibleFactors",
  "optionsAnalysis",
  "recommendedStrategy",
  "actionPlan",
  "reviewCriteria",
  "confidenceLevel",
];

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
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

  const prompt = buildAnalyzePrompt(decision, history);

  let raw: string;
  try {
    // Streamed rather than a single blocking call: adaptive thinking on a full
    // nine-section analysis can run past connection idle-timeouts otherwise.
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });
    const message = await stream.finalMessage();
    const textBlock = message.content.find((block) => block.type === "text");
    raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (err) {
    console.error("Anthropic request failed in /api/analyze:", err);
    return NextResponse.json({ error: "Failed to reach the analysis model." }, { status: 502 });
  }

  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    return NextResponse.json(
      { error: "Failed to parse the analysis response." },
      { status: 500 }
    );
  }

  const missing = REQUIRED_KEYS.filter((key) => !(key in parsed));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Analysis response is missing required fields: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed as AnalysisResult);
}
