#!/usr/bin/env node
// Runs the benchmark prompts against every contender and writes the answers
// straight into data/benchmarks.json.
//
//   npm run benchmarks -- --dry-run          # show what would run
//   npm run benchmarks                       # run everything missing
//   npm run benchmarks -- --only=yes-or-no   # one benchmark
//   npm run benchmarks -- --models=gpt-5     # one contender
//   npm run benchmarks -- --force            # re-run answers that exist
//   npm run benchmarks -- --list-models=kimi # search OpenRouter slugs
//
// Existing answers are skipped by default, so an interrupted run resumes
// where it left off and a failed contender can be retried on its own.
// Hand-written `note` fields survive a --force re-run.

import fs from "node:fs";
import path from "node:path";
import { CONTENDERS, runPrompt, listModels } from "./providers.mjs";

const DATA_PATH = path.join(process.cwd(), "data/benchmarks.json");

function parseArgs(argv) {
  const flags = { dryRun: false, force: false, only: null, models: null, listModels: null };
  for (const arg of argv) {
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--force") flags.force = true;
    else if (arg.startsWith("--only=")) flags.only = arg.slice(7).split(",");
    else if (arg.startsWith("--models=")) flags.models = arg.slice(9).split(",");
    else if (arg.startsWith("--list-models")) flags.listModels = arg.split("=")[1] ?? "";
    else throw new Error(`unknown flag: ${arg}`);
  }
  return flags;
}

const readData = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

// Written after every single answer rather than once at the end — a run
// spans many minutes and several paid API calls, and losing them to a crash
// on the last prompt would be maddening.
const writeData = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

/**
 * Adds any contender missing from the `models` array.
 *
 * Deliberately does NOT touch entries that already exist. An earlier version
 * overwrote name and colour, which silently relabelled a hand-curated entry
 * ("Gemini 3.1 Pro (extended thinking, manual)" → "Gemini 3.1 Pro") and made
 * browser-pasted answers look like API runs. The file is the source of truth
 * for anything already in it.
 */
function syncContenders(data, contenders) {
  for (const contender of contenders) {
    if (data.models.some((m) => m.id === contender.id)) continue;
    data.models.push({ id: contender.id, name: contender.name, color: contender.color });
  }
}

function plan(data, contenders, flags) {
  const jobs = [];
  for (const benchmark of data.benchmarks) {
    if (flags.only && !flags.only.includes(benchmark.slug)) continue;
    for (const contender of contenders) {
      const existing = benchmark.responses.find((r) => r.model === contender.id);
      if (existing && !flags.force) continue;
      jobs.push({ benchmark, contender, isRerun: Boolean(existing) });
    }
  }
  return jobs;
}

function record(data, benchmarkSlug, contenderId, text) {
  const benchmark = data.benchmarks.find((b) => b.slug === benchmarkSlug);
  const existing = benchmark.responses.find((r) => r.model === contenderId);
  if (existing) {
    existing.text = text; // keep any hand-written note
  } else {
    benchmark.responses.push({ model: contenderId, text });
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.listModels !== null) {
    const ids = await listModels(flags.listModels);
    console.log(ids.length ? ids.join("\n") : "no matching models");
    return;
  }

  const contenders = flags.models
    ? CONTENDERS.filter((c) => flags.models.includes(c.id))
    : CONTENDERS;

  if (contenders.length === 0) {
    throw new Error(`no contenders matched --models. Known: ${CONTENDERS.map((c) => c.id).join(", ")}`);
  }

  const data = readData();
  const jobs = plan(data, contenders, flags);

  if (jobs.length === 0) {
    console.log("Nothing to run — every answer already exists. Use --force to re-run.");
    return;
  }

  console.log(`${jobs.length} prompt${jobs.length === 1 ? "" : "s"} to run:\n`);
  for (const job of jobs) {
    console.log(`  ${job.benchmark.acronym.padEnd(4)} ${job.contender.name}${job.isRerun ? " (re-run)" : ""}`);
  }

  if (flags.dryRun) {
    console.log("\n--dry-run, stopping here.");
    return;
  }

  syncContenders(data, contenders);
  writeData(data);

  console.log("");
  const failures = [];

  // Deliberately serial. Rate limits across five providers are the binding
  // constraint, not wall-clock time, and a serial run makes a partial
  // failure obvious instead of interleaving five error streams.
  for (const [index, job] of jobs.entries()) {
    const label = `[${index + 1}/${jobs.length}] ${job.benchmark.acronym} · ${job.contender.name}`;
    process.stdout.write(`${label} ... `);
    try {
      const text = await runPrompt(job.contender, job.benchmark.prompt);
      const current = readData();
      record(current, job.benchmark.slug, job.contender.id, text);
      writeData(current);
      console.log(`ok (${text.length} chars)`);
    } catch (error) {
      console.log(`FAILED — ${error.message}`);
      failures.push({ label, message: error.message });
    }
  }

  console.log(`\nDone. ${jobs.length - failures.length}/${jobs.length} succeeded.`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ${f.label}: ${f.message}`);
    console.log("\nRe-run to retry only the ones that failed.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
