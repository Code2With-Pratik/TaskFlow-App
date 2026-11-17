import Link from "next/link";

interface TrustPageProps {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
}

export function TrustPage({ title, intro, sections }: TrustPageProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TaskFlow
        </Link>
        <Link
          href="/"
          className="font-medium text-muted underline underline-offset-4"
        >
          Home
        </Link>
      </header>
      <article className="py-12 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{intro}</p>
        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-foreground">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="max-w-3xl leading-7 text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
      <footer className="flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-muted">
        <Link href="/about" className="underline underline-offset-4">
          About
        </Link>
        <Link href="/contact" className="underline underline-offset-4">
          Contact
        </Link>
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
        <Link href="/developers/api" className="underline underline-offset-4">
          TaskFlow API
        </Link>
        <a
          href="https://github.com/Code2With-Pratik/TaskFlow-App/issues"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          GitHub Issues
        </a>
      </footer>
    </main>
  );
}
