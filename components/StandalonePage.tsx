import Link from "next/link";
import type { InfoCardContent } from "@/lib/content";

export default function StandalonePage({ title, body, links }: InfoCardContent) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fefefe] p-6">
      <div className="sketchy-card w-full max-w-md bg-white p-8 text-zinc-900">
        <Link href="/" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to the desk
        </Link>
        <h1 className="font-ugly mb-4 text-4xl text-zinc-900">{title}</h1>
        {body.map((paragraph) => (
          <p key={paragraph} className="mb-3 whitespace-pre-line text-zinc-700">
            {paragraph}
          </p>
        ))}
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-2 hover:text-zinc-950"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
