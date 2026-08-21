"use client";

import { useState } from "react";
import ResultsView from "@/components/ResultsView";
import { MAX_CLARIFYING_QUESTIONS } from "@/lib/prompts";
import type { AnalysisResult, ClarifyResponse, QAPair } from "@/lib/types";

type Stage = "input" | "clarify" | "insufficient" | "results";
type LoadingPhase = "clarifying" | "analyzing" | null;

const LOADING_COPY: Record<Exclude<LoadingPhase, null>, { button: string; note: string }> = {
  clarifying: {
    button: "Thinking...",
    note: "Reading through what you've shared so far...",
  },
  analyzing: {
    button: "Structuring analysis...",
    note:
      "Working through a full nine-part analysis — this usually takes a minute or two. Don't refresh; it'll appear here when it's ready.",
  },
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [decision, setDecision] = useState("");
  const [history, setHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = loadingPhase !== null;

  function resetAll() {
    setStage("input");
    setDecision("");
    setHistory([]);
    setCurrentQuestion("");
    setFieldValue("");
    setAnalysis(null);
    setError(null);
    setLoadingPhase(null);
  }

  async function requestClarification(decisionText: string, historyForRequest: QAPair[]) {
    setLoadingPhase("clarifying");
    setError(null);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decisionText, history: historyForRequest }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong while thinking through your answer.");
      }
      const data: ClarifyResponse = await res.json();

      if (data.status === "question") {
        setCurrentQuestion(data.text);
        setHistory(historyForRequest);
        setFieldValue("");
        setStage("clarify");
        setLoadingPhase(null);
        return;
      }

      if (data.status === "insufficient") {
        setHistory(historyForRequest);
        setStage("insufficient");
        setLoadingPhase(null);
        return;
      }

      // sufficient -> move on to structured analysis
      setHistory(historyForRequest);
      await requestAnalysis(decisionText, historyForRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoadingPhase(null);
    }
  }

  async function requestAnalysis(decisionText: string, historyForRequest: QAPair[]) {
    setLoadingPhase("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decisionText, history: historyForRequest }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong while preparing the analysis.");
      }
      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingPhase(null);
    }
  }

  function handleSubmitDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decision.trim() || loading) return;
    requestClarification(decision, []);
  }

  function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!fieldValue.trim() || loading) return;
    const newHistory = [...history, { question: currentQuestion, answer: fieldValue }];
    requestClarification(decision, newHistory);
  }

  if (stage === "results" && analysis) {
    return <ResultsView analysis={analysis} onStartOver={resetAll} />;
  }

  if (stage === "insufficient") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center space-y-6">
          <p className="text-lg text-[var(--color-deep-slate)]">
            There isn&apos;t enough information yet to think this through properly.
          </p>
          <button onClick={resetAll} className="btn-primary px-6 py-3">
            Start over
          </button>
        </div>
      </main>
    );
  }

  const isClarifyStage = stage === "clarify";
  const prompt = isClarifyStage
    ? currentQuestion
    : "What are you trying to decide? Share as much or as little context as you have.";

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <form
        onSubmit={isClarifyStage ? handleSubmitAnswer : handleSubmitDecision}
        className="max-w-2xl w-full space-y-5"
      >
        <p className="font-serif text-2xl text-[var(--color-deep-slate)]">{prompt}</p>
        <textarea
          value={isClarifyStage ? fieldValue : decision}
          onChange={(e) =>
            isClarifyStage ? setFieldValue(e.target.value) : setDecision(e.target.value)
          }
          rows={8}
          autoFocus
          className="w-full resize-none card px-5 py-4 text-base leading-relaxed placeholder:text-[var(--color-mist)] focus:outline-none focus:ring-2 focus:ring-[var(--color-clear-sky)]"
        />
        <p className="text-base text-[var(--color-deep-slate)]">
          You&apos;ll be asked at most {MAX_CLARIFYING_QUESTIONS} clarifying questions before the
          full analysis is put together.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col items-end gap-2">
          <button type="submit" disabled={loading} className="btn-primary px-6 py-3">
            {loadingPhase ? LOADING_COPY[loadingPhase].button : "Continue"}
          </button>
          {loadingPhase && (
            <p className="text-sm text-[var(--color-deep-slate)]/60 text-right max-w-sm animate-pulse">
              {LOADING_COPY[loadingPhase].note}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
