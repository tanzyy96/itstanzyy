# itstanzyy

canvas blog

## The home page

`/` is a pannable paper desk (`components/desk/`), fronted by a blind
"Stupid LLM Benchmark" gate: five rounds, four anonymised answers each, pick
the funniest, and the result names the model whose humour matches yours.

- Gate rounds, the four models and their persona blurbs live in `lib/desk.ts`.
  Answers are pulled verbatim from `data/benchmarks.json`.
- Card bodies read the same content as before (`data/site-content.json`, the
  blog posts, the benchmarks). The blurbs, tags and back-of-card lines are in
  `buildDeskCards()` in `lib/desk.ts`.
- On screens 720px wide or less the canvas becomes a vertical card list.
- Visitors' card positions/stamps (`zy-canvas-expand-v1`) and their last quiz
  result (`zy-bench-quiz-v1`) persist in localStorage.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
