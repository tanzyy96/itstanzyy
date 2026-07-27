"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Answers come back as markdown and lean on it heavily — bold in most of
// them, and at least one where the strikethrough IS the joke (a barista
// crossing out failed pickup lines). Rendered as plain text those become
// literal asterisks and tildes, so the punchline dies on the page.
// GFM is needed for strikethrough specifically.
export default function AnswerMarkdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-zinc-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // `whitespace-pre-line` keeps single newlines, which markdown would
          // normally collapse. These answers use them deliberately — stacked
          // crossed-out attempts, text laid out as if written on a cup — so
          // collapsing them flattens the joke.
          p: ({ children }) => <p className="mb-3 whitespace-pre-line last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-zinc-600">{children}</em>,
          del: ({ children }) => (
            <del className="text-zinc-400 decoration-zinc-500">{children}</del>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-zinc-400 pl-3 text-zinc-600 last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[13px]">
              {children}
            </code>
          ),
          // Fenced blocks are how a couple of models "wrote on the cup" —
          // preserve the monospace framing but let long lines scroll rather
          // than stretch the panel.
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-md bg-zinc-100 p-3 font-mono text-[13px] leading-relaxed last:mb-0">
              {children}
            </pre>
          ),
          h1: ({ children }) => <p className="mb-2 font-semibold text-zinc-900">{children}</p>,
          h2: ({ children }) => <p className="mb-2 font-semibold text-zinc-900">{children}</p>,
          h3: ({ children }) => <p className="mb-2 font-semibold text-zinc-900">{children}</p>,
          h4: ({ children }) => <p className="mb-2 font-semibold text-zinc-900">{children}</p>,
          hr: () => <hr className="my-4 border-zinc-300" />,
          a: ({ children }) => <span>{children}</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
