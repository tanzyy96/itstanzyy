"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GATE_MODELS,
  GATE_PERSONAS,
  gateWinner,
  modelName,
  type GateModelId,
  type GateRound,
} from "@/lib/desk";
import styles from "./desk.module.css";

const LETTERS = ["A", "B", "C", "D"];
const LONG_PROMPT = 120;
const LONG_ANSWER = 280;

type Props = {
  rounds: GateRound[];
  phase: "quiz" | "result";
  round: number;
  pick: number | null;
  picks: GateModelId[];
  onPick: (index: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onRestart: () => void;
};

export default function BenchmarkGate({
  rounds,
  phase,
  round,
  pick,
  picks,
  onPick,
  onNext,
  onSkip,
  onRestart,
}: Props) {
  const done = phase === "result";
  const current = rounds[Math.min(round, rounds.length - 1)];
  const revealed = pick !== null;
  const progress = done ? 100 : ((round + (revealed ? 1 : 0)) / rounds.length) * 100;

  return (
    <div className={styles.gate} role="dialog" aria-modal="true" aria-label="Stupid LLM Benchmark">
      <div className={styles.gateInner}>
        <div className={styles.gateCol}>
          <div className={styles.gateHead}>
            <span className={styles.badge}>STUPID LLM BENCHMARK №1</span>
            <span className={styles.step}>
              {done
                ? `SCORED · ${picks.length} ROUNDS`
                : `ROUND ${round + 1} OF ${rounds.length} · PICK THE FUNNIEST`}
            </span>
            {!done && (
              <button className={styles.skip} onClick={onSkip}>
                skip to the desk
              </button>
            )}
          </div>

          <div className={styles.progress}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {done ? (
            <Result picks={picks} onEnter={onSkip} onRestart={onRestart} />
          ) : (
            <div>
              <div className={styles.promptBlock}>
                <div className={styles.eyebrow}>THE PROMPT, GIVEN TO FOUR MODELS</div>
                <h1
                  className={`${styles.prompt} ${current.prompt.length > LONG_PROMPT ? styles.promptLong : ""}`}
                >
                  {current.prompt}
                </h1>
                <p className={styles.instruction}>
                  {revealed
                    ? "Authors revealed. Your pick is marked."
                    : "Four models answered. No names yet — just pick the one that actually got you."}
                </p>
              </div>

              <div className={styles.answers}>
                {current.options.map((option, index) => (
                  <Answer
                    // Keyed by round so each round's cards mount fresh and
                    // their scroll position starts at the top.
                    key={`${current.slug}-${index}`}
                    letter={LETTERS[index]}
                    text={option.text}
                    modelName={option.modelName}
                    picked={pick === index}
                    revealed={revealed}
                    onPick={() => onPick(index)}
                  />
                ))}
              </div>

              {revealed && (
                <div className={styles.revealFoot}>
                  <p className={styles.verdict}>{current.verdict}</p>
                  <button className={`${styles.darkBtn} ${styles.nextBtn}`} onClick={onNext}>
                    {round + 1 >= rounds.length ? "SEE MY RESULT →" : "NEXT ROUND →"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Answer({
  letter,
  text,
  modelName,
  picked,
  revealed,
  onPick,
}: {
  letter: string;
  text: string;
  modelName: string;
  picked: boolean;
  revealed: boolean;
  onPick: () => void;
}) {
  const long = text.length > LONG_ANSWER;
  const stateClass = picked ? styles.answerPicked : revealed ? styles.answerDim : "";

  // A div with button semantics rather than a <button>: answers are
  // markdown (paragraphs, lists, code blocks), none of which is valid
  // inside a button.
  return (
    <div
      role="button"
      tabIndex={revealed ? -1 : 0}
      aria-pressed={picked}
      aria-disabled={revealed}
      className={`${styles.answer} ${stateClass}`}
      onClick={onPick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPick();
        }
      }}
    >
      <div className={styles.answerTop}>
        <span className={`${styles.letter} ${picked ? styles.letterPicked : ""}`}>{letter}</span>
        {/* Always in the DOM so the card doesn't reflow on reveal. */}
        <span
          className={`${styles.modelName} ${revealed ? styles.modelNameShown : ""} ${picked ? styles.modelNamePicked : ""}`}
          aria-hidden={!revealed}
        >
          {modelName}
        </span>
        <span className={`${styles.yourPick} ${picked ? styles.yourPickShown : ""}`}>
          YOUR PICK
        </span>
      </div>
      <div className={`${styles.answerScroll} ${long ? "" : styles.answerScrollShort}`}>
        <div className={`${styles.answerText} ${long ? styles.answerTextLong : ""}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings inside an answer are the model formatting, not
              // structure — keep them inline with the rest of the text.
              h1: ({ children }) => <p>{children}</p>,
              h2: ({ children }) => <p>{children}</p>,
              h3: ({ children }) => <p>{children}</p>,
              h4: ({ children }) => <p>{children}</p>,
              a: ({ children }) => <span>{children}</span>,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function Result({
  picks,
  onEnter,
  onRestart,
}: {
  picks: GateModelId[];
  onEnter: () => void;
  onRestart: () => void;
}) {
  const winner = gateWinner(picks);
  const total = Math.max(1, picks.length);

  return (
    <div>
      <div className={styles.result}>
        <div className={styles.resultLabel}>
          RESULT · {picks.length} PICKS · {GATE_MODELS.length} MODELS
        </div>
        <div className={styles.resultLead}>Your sense of humor is</div>
        <h1 className={styles.resultName}>{modelName(winner)}</h1>
        <p className={styles.resultBlurb}>{GATE_PERSONAS[winner].blurb}</p>
      </div>

      <div className={styles.tallyCard}>
        <div className={styles.eyebrow}>HOW YOU VOTED</div>
        {GATE_MODELS.map((model) => {
          const count = picks.filter((p) => p === model).length;
          return (
            <div key={model} className={styles.tallyRow}>
              <div className={`${styles.tallyName} ${model === winner ? styles.tallyWinner : ""}`}>
                {modelName(model)}
              </div>
              <div className={styles.tallyTrack}>
                <div
                  className={styles.tallyBar}
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: GATE_PERSONAS[model].bar,
                  }}
                />
              </div>
              <div className={styles.tallyCount}>{count}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.ctaRow}>
        <button className={`${styles.darkBtn} ${styles.ctaPrimary}`} onClick={onEnter}>
          MEET THE PERSON WHO BUILT THIS &rarr;
        </button>
        <button className={styles.ctaSecondary} onClick={onRestart}>
          RUN IT AGAIN
        </button>
      </div>
      <div className={styles.footnote}>
        Not a paper. Four models, one prompt each round, scored by whoever is reading.
        <br />
        Every answer is the model&rsquo;s verbatim output.
      </div>
    </div>
  );
}
