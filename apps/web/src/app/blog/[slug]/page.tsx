import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingNav } from "@/components/landing/landing-nav";
import { JsonLd } from "@/components/json-ld";
import { getPostBySlug, getPostSlugs } from "@/lib/content";
import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

  return {
    title: post.meta.title,
    description: post.meta.description,
    keywords: post.meta.keywords,
    authors: [{ name: post.meta.author }],
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
      authors: [post.meta.author],
      url: `${baseUrl}/blog/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.meta.date,
    dateModified: post.meta.date,
    author: { "@type": "Organization", name: "OpenClaw CRM" },
    publisher: { "@type": "Organization", name: "OpenClaw CRM" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      { "@type": "ListItem", position: 3, name: post.meta.title },
    ],
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Subtle top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          background:
            "linear-gradient(180deg, var(--landing-tint) 0%, transparent 100%)",
        }}
      />

      {/* Nav */}
      <LandingNav>
        <div className="mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-8 max-w-6xl">
          <Link
            href="/"
            className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.015em] text-foreground transition-opacity hover:opacity-70"
          >
            OpenClaw{" "}
            <span className="font-normal text-muted-foreground/60">CRM</span>
          </Link>
          <div className="flex items-center">
            <div className="flex items-center gap-1.5 sm:gap-3 mr-3 sm:mr-6">
              <a
                href="https://github.com/giorgosn/openclaw-crm"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-muted-foreground/50 transition-all hover:text-foreground hover:bg-foreground/[0.05]"
              >
                <GitHubLogoIcon className="h-[18px] w-[18px]" />
              </a>
              <ThemeToggle className="rounded-full p-2 !text-muted-foreground/50 transition-all hover:!text-foreground hover:bg-foreground/[0.05]" />
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-[13px] text-muted-foreground transition-all hover:text-foreground hover:bg-foreground/[0.04]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-foreground/12 px-3.5 sm:px-4 py-1.5 text-[13px] font-medium text-foreground transition-all hover:border-foreground/25 hover:bg-foreground/[0.03]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </LandingNav>

      {/* Header */}
      <section className="relative mx-auto max-w-3xl px-6 pt-32 pb-8 sm:pt-40 sm:pb-10">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-muted-foreground/50">
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/blog"
            className="transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <span>/</span>
          <span className="text-muted-foreground/70 truncate max-w-[200px]">
            {post.meta.title}
          </span>
        </nav>

        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-full bg-foreground/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {post.meta.category}
          </span>
          <span className="text-[12px] text-muted-foreground/50">
            {new Date(post.meta.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </section>

      {/* Article content */}
      <article className="relative mx-auto max-w-3xl px-6 pb-16 sm:pb-20">
        <div
          className="prose-article"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* CTA */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20 sm:pb-28">
        <div className="rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] p-8 text-center">
          <p className="text-[15px] text-muted-foreground">
            Deploy in under 5 minutes. Free forever.
          </p>
          <div className="mt-5">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[13px] font-medium text-background transition-all hover:opacity-80"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Back link */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          All posts
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/15">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 sm:py-8">
          <span className="text-[12px] text-muted-foreground/60">
            OpenClaw CRM
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/docs"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Blog
            </Link>
            <Link
              href="/compare"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Compare
            </Link>
            <a
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              GitHub
            </a>
            <span className="text-[12px] text-muted-foreground/60">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
