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
        className="font-serif mb-3 mt-10 scroll-mt-24 text-2xl font-semibold text-[var(--fm-ink)]"
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
    p: (props) => <p className="mb-4 leading-7 text-[var(--fm-ink)]" {...props} />,
    a: (props) => (
      <a
        className="text-[var(--fm-accent)] underline decoration-2 underline-offset-2 hover:opacity-80"
        {...props}
      />
    ),
    ul: (props) => <ul className="mb-4 list-disc pl-6" {...props} />,
    ol: (props) => <ol className="mb-4 list-decimal pl-6" {...props} />,
    // eslint-disable-next-line @next/next/no-img-element
    img: (props) => (
      <img
        className="mb-1 w-full rounded-lg border border-[var(--fm-hairline)]"
        loading="lazy"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded bg-[var(--fm-paper)] px-1.5 py-0.5 font-mono text-sm text-[var(--fm-ink)]"
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
