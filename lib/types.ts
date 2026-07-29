export interface QAPair {
  question: string;
  answer: string;
}

export type ClarifyResponse =
  | { status: "question"; text: string }
  | { status: "sufficient" }
  | { status: "insufficient" };

export interface OptionAnalysis {
  option: string;
  tradeoffs: string;
}

export interface AnalysisResult {
  decisionReframe: string;
  keyAssumptions: string[];
  constraints: string[];
  reversibleFactors: string[];
  irreversibleFactors: string[];
  optionsAnalysis: OptionAnalysis[];
  recommendedStrategy: string;
  actionPlan: string[];
  reviewCriteria: string[];
  confidenceLevel: string;
}
