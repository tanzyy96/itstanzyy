import benchmarkData from "@/data/benchmarks.json";

export type BenchmarkModel = {
  id: string;
  name: string;
  color: string;
};

export type BenchmarkResponse = {
  model: string;
  /** The model's answer, verbatim. Newlines are preserved when rendered. */
  text: string;
  /** Optional aside from me, shown under the response. */
  note?: string;
};

// Deliberately unscored — these collect funny answers, not measurements.
// If an LLM-as-judge eval ever lands, it hangs off `responses` rather than
// replacing it, so the verbatim text stays the point of the page.
export type Benchmark = {
  slug: string;
  acronym: string;
  name: string;
  tagline: string;
  /** The exact prompt handed to every model, unedited. */
  prompt: string;
  notes: string[];
  responses: BenchmarkResponse[];
};

type BenchmarkFile = {
  disclaimer: string;
  models: BenchmarkModel[];
  benchmarks: Benchmark[];
};

const data = benchmarkData as BenchmarkFile;

export const DISCLAIMER = data.disclaimer;

export function getModel(id: string): BenchmarkModel | undefined {
  return data.models.find((model) => model.id === id);
}

export function getBenchmarks(): Benchmark[] {
  return data.benchmarks;
}

export function getBenchmarkSlugs(): string[] {
  return data.benchmarks.map((benchmark) => benchmark.slug);
}

export function getBenchmark(slug: string): Benchmark | undefined {
  return data.benchmarks.find((benchmark) => benchmark.slug === slug);
}

export function countResponses(): number {
  return data.benchmarks.reduce((total, benchmark) => total + benchmark.responses.length, 0);
}
