"use client";

import type { AnalysisResult } from "@/lib/types";

function TagCardList({
  items,
  variant,
}: {
  items: string[];
  variant: "sky" | "marigold" | "aqua" | "irreversible";
}) {
  const tagClass = `tag-card tag-card-${variant}`;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <span key={i} className={tagClass}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ResultsView({
  analysis,
  onStartOver,
}: {
  analysis: AnalysisResult;
  onStartOver: () => void;
}) {
  function handleStartOver() {
    if (window.confirm("Start over? This will clear your current analysis.")) {
      onStartOver();
    }
  }

  return (
    <main className="flex-1 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <button
          onClick={handleStartOver}
          className="text-sm text-[var(--color-deep-slate)]/60 hover:text-[var(--color-deep-slate)] transition-colors"
        >
          &larr; Start over
        </button>

        {/* 1. Decision reframe */}
        <section>
          <h1 className="font-serif text-lg font-medium leading-relaxed text-[var(--color-deep-slate)]">
            {analysis.decisionReframe}
          </h1>
        </section>

        {/* 2. 2x2 grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <h2 className="font-serif text-lg text-[var(--color-deep-slate)]">Key Assumptions</h2>
            <TagCardList items={analysis.keyAssumptions} variant="sky" />
          </div>
          <div className="card p-6 space-y-3">
            <h2 className="font-serif text-lg text-[var(--color-deep-slate)]">Constraints</h2>
            <TagCardList items={analysis.constraints} variant="marigold" />
          </div>
          <div className="card p-6 space-y-3">
            <h2 className="font-serif text-lg text-[var(--color-deep-slate)]">Reversible Factors</h2>
            <TagCardList items={analysis.reversibleFactors} variant="aqua" />
          </div>
          <div className="card p-6 space-y-3" style={{ borderColor: "var(--color-deep-slate)" }}>
            <h2 className="font-serif text-lg text-[var(--color-deep-slate)]">Irreversible Factors</h2>
            <TagCardList items={analysis.irreversibleFactors} variant="irreversible" />
          </div>
        </section>

        {/* 3. Options analysis */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-[var(--color-deep-slate)]">Options Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.optionsAnalysis.map((opt, i) => (
              <div
                key={i}
                className="card p-6 space-y-2"
                style={{ borderColor: "var(--color-clear-sky)" }}
              >
                <h3 className="font-medium text-[var(--color-deep-slate)]">{opt.option}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-deep-slate)]/80">
                  {opt.tradeoffs}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recommended strategy */}
        <section
          className="rounded-xl p-6 space-y-3"
          style={{
            border: "1.5px dashed var(--color-marigold)",
            background: "color-mix(in srgb, var(--color-marigold) 8%, white)",
          }}
        >
          <h2 className="font-serif text-xl text-[var(--color-deep-slate)]">Recommended Strategy</h2>
          <p className="leading-relaxed text-[var(--color-deep-slate)]">
            {analysis.recommendedStrategy}
          </p>
        </section>

        {/* Confidence level */}
        <section className="card p-6 space-y-2">
          <h2 className="font-serif text-lg text-[var(--color-deep-slate)]">Confidence Level</h2>
          <p className="font-mono text-sm leading-relaxed text-[var(--color-deep-slate)]">
            {analysis.confidenceLevel}
          </p>
        </section>

        {/* 5. Action plan */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[var(--color-deep-slate)]">
            Action Plan{" "}
            <span className="text-sm font-sans font-normal text-[var(--color-deep-slate)]/60">
              (2&ndash;4 week window)
            </span>
          </h2>
          <ul className="space-y-2">
            {analysis.actionPlan.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--color-clear-sky)]"
                  readOnly
                />
                <span className="text-[var(--color-deep-slate)] leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Review criteria */}
        <section className="space-y-3 pb-16">
          <h2 className="font-serif text-2xl text-[var(--color-deep-slate)]">Review Criteria</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--color-deep-slate)] leading-relaxed">
            {analysis.reviewCriteria.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
