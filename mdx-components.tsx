import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { slugify } from "./lib/slugify";

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return getNodeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1 className="font-serif mb-4 mt-10 text-4xl font-semibold text-[var(--fm-ink)]" {...props} />
    ),
    h2: ({ children, ...rest }) => (
      <h2
        id={slugify(getNodeText(children))}
        className="font-serif mb-3 mt-12 scroll-mt-24 text-[28px] font-semibold leading-tight text-[var(--fm-ink)]"
        {...rest}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }) => (
      <h3
        id={slugify(getNodeText(children))}
        className="font-serif mb-2 mt-8 scroll-mt-24 text-xl font-semibold text-[var(--fm-ink)]"
        {...rest}
      >
        {children}
      </h3>
    ),
    // 17px rather than 16: at the article's fixed width that pulls the line
    // length from ~80 characters down to ~72, which is inside the comfortable
    // range for long-form, without narrowing the column and shrinking the
    // diagrams. Paragraph spacing scales with the looser leading so the
    // rhythm still reads as separate paragraphs.
    p: (props) => (
      <p className="mb-5 text-[17px] leading-[1.75] text-[var(--fm-ink)]" {...props} />
    ),
    a: (props) => (
      <a
        className="text-[var(--fm-accent)] underline decoration-2 underline-offset-2 hover:opacity-80"
        {...props}
      />
    ),
    ul: (props) => (
      <ul className="mb-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.75]" {...props} />
    ),
    ol: (props) => (
      <ol className="mb-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.75]" {...props} />
    ),
    blockquote: (props) => (
      <blockquote
        className="mb-5 border-l-2 border-[var(--fm-accent)] pl-4 text-[17px] italic leading-[1.75] text-[var(--fm-muted)]"
        {...props}
      />
    ),
    hr: () => <hr className="my-10 border-[var(--fm-hairline)]" />,
    // eslint-disable-next-line @next/next/no-img-element
    img: (props) => (
      <img
        className="mb-1 w-full rounded-lg border border-[var(--fm-hairline)]"
        loading="lazy"
        {...props}
      />
    ),
    // Was `bg-[var(--fm-paper)]`, which is the exact page background — the
    // chip was invisible. `0.92em` keeps mono from looking shrunken next to
    // 17px body text (mono x-heights run large, so 1:1 looks oversized).
    code: (props) => (
      <code
        className="rounded border border-[var(--fm-hairline)] bg-[var(--fm-surface)] px-1.5 py-0.5 font-mono text-[0.92em] text-[var(--fm-ink)]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="mb-4 overflow-x-auto rounded-lg border border-[var(--fm-hairline)] bg-[var(--fm-ink)] p-4 text-sm text-[var(--fm-paper)] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
        {...props}
      />
    ),
    ...components,
  };
}
