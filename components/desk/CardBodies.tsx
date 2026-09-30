import Link from "next/link";
import { getBenchmarks, type Benchmark } from "@/lib/benchmarks";
import { INFO_CARDS } from "@/lib/content";
import { parseProjects, type DeskCardId } from "@/lib/desk";
import styles from "./desk.module.css";

export type DeskPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  readingMinutes: number;
};

type BodyProps = {
  id: DeskCardId;
  posts: DeskPost[];
  onOpenBenchmark: (benchmark: Benchmark) => void;
  onRetakeGate: () => void;
};

export default function CardBody({ id, posts, onOpenBenchmark, onRetakeGate }: BodyProps) {
  switch (id) {
    case "about":
      return <AboutBody />;
    case "projects":
      return <ProjectsBody />;
    case "blog":
      return <BlogBody posts={posts} />;
    case "bench":
      return <BenchBody onOpen={onOpenBenchmark} onRetake={onRetakeGate} />;
    case "contact":
      return <ContactBody />;
  }
}

function AboutBody() {
  const { body, links } = INFO_CARDS.about;
  return (
    <div className={styles.aboutGrid}>
      <div className={styles.prose}>
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className={styles.facts}>
        <div>BASED IN SINGAPORE</div>
        <div>NTU · 2017–2021</div>
        <div>WRITES ABOUT SYSTEMS</div>
        {links?.map((link) => (
          <div key={link.url}>
            <a className={styles.link} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label.toUpperCase()}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsBody() {
  return (
    <div>
      {parseProjects().map((project) => (
        <div key={project.name} className={styles.row}>
          <div className={styles.projectName}>{project.name}</div>
          {project.desc && <p className={styles.rowDesc}>{project.desc}</p>}
          {project.url && (
            <div className={styles.rowMeta}>
              <a className={styles.link} href={project.url} target="_blank" rel="noopener noreferrer">
                {project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BlogBody({ posts }: { posts: DeskPost[] }) {
  return (
    <div>
      {posts.map((post) => (
        <div key={post.slug} className={styles.row}>
          <div className={styles.rowMeta} style={{ marginTop: 0 }}>
            {post.date} · {post.readingMinutes} MIN
          </div>
          <div className={styles.postTitle}>{post.title}</div>
          <p className={styles.rowDesc}>{post.summary}</p>
          <div style={{ marginTop: 12 }}>
            <Link className={styles.link} href={`/blog/${post.slug}`}>
              Read the post
            </Link>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 18 }}>
        <Link className={styles.link} href="/blog">
          All posts &rarr;
        </Link>
      </div>
    </div>
  );
}

function BenchBody({
  onOpen,
  onRetake,
}: {
  onOpen: (benchmark: Benchmark) => void;
  onRetake: () => void;
}) {
  return (
    <div>
      <p className={styles.benchIntro}>
        Serious benchmarks measure reasoning. These measure what a model does with a stupid
        prompt. Nothing is scored &mdash; every answer is verbatim, and you get to decide which
        ones survive.
      </p>
      <div className={styles.benchList}>
        {getBenchmarks().map((benchmark) => (
          <button key={benchmark.slug} className={styles.benchRow} onClick={() => onOpen(benchmark)}>
            <span className={styles.benchAcronym}>{benchmark.acronym}</span>
            <span>
              <span className={styles.benchName}>{benchmark.name}</span>
              <span className={styles.benchTagline} style={{ display: "block" }}>
                {benchmark.tagline}
              </span>
            </span>
            <span className={styles.benchCount}>{benchmark.responses.length} ANSWERS</span>
          </button>
        ))}
      </div>
      <div className={styles.benchActions}>
        <button className={styles.humorChip} onClick={onRetake}>
          TAKE THE BLIND TASTE TEST AGAIN
        </button>
      </div>
    </div>
  );
}

function ContactBody() {
  return (
    <div className={styles.contactGrid}>
      {(INFO_CARDS.contact.links ?? []).map((link) => (
        <a
          key={link.url}
          className={styles.contactTile}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className={styles.tileLabel}>{link.label.toUpperCase()}</div>
          <div className={styles.tileValue}>
            {link.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </div>
        </a>
      ))}
    </div>
  );
}
