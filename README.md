# AI Decision Navigator

A tool that structures thinking for high-stakes, ambiguous personal decisions — it doesn't make the decision for you. You describe what you're deciding, it asks a handful of clarifying questions, then produces a structured nine-part analysis (reframe, assumptions, constraints, reversible/irreversible factors, options, a recommended direction, an action plan, and review criteria).

Built with Next.js (App Router, TypeScript) and the [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript), calling Claude (`claude-sonnet-4-6`).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your Anthropic API key**

   Copy the example env file and fill in your key:

   ```bash
   cp .env.local.example .env.local
   ```

   Then open `.env.local` and set:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Get a key from the [Anthropic Console](https://console.anthropic.com/). `.env.local` is gitignored, so your key never gets committed.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Stage 1 — decision input** (`app/page.tsx`): a single open textarea. No other fields.
- **Stage 2 — clarifying questions** (`app/api/clarify/route.ts`): Claude reads the decision plus the running Q&A history and returns one of three states — ask another question, it has enough to proceed, or the input is too thin to analyze. Capped at 4 questions; Claude usually stops sooner once it has enough context.
- **Stage 3 — structured analysis** (`app/api/analyze/route.ts`): Claude produces the full nine-section analysis as JSON. This call uses adaptive thinking and is streamed server-side (`anthropic.messages.stream(...).finalMessage()`) rather than a single blocking request, since a full analysis can take 1–2 minutes and a non-streamed call risks the connection being closed before it finishes.

Core product principles baked into every prompt: lead with clarity, not conclusions; structure the thinking rather than give advice; favor reversible paths over premature commitment; build calibrated confidence rather than false certainty; the human always makes the final call.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
app/
  page.tsx              Stage 1–3 UI (client component, drives the flow)
  api/clarify/route.ts  Clarifying-question endpoint
  api/analyze/route.ts  Structured-analysis endpoint
  layout.tsx            Fonts, metadata, app title
  globals.css           Design tokens (palette, pills, cards, buttons)
components/
  ResultsView.tsx        Stage 3 results layout
lib/
  anthropic.ts           Anthropic client
  prompts.ts              Prompt builders (shared core principles)
  types.ts                Shared TypeScript types
```
