import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

// Resolve paths relative to the monorepo root (two levels up from apps/web)
const MONOREPO_ROOT = path.join(process.cwd(), "..", "..");
const BLOG_DIR = path.join(MONOREPO_ROOT, "marketing", "content", "blog-posts");
const COMPARE_DIR = path.join(
  MONOREPO_ROOT,
  "marketing",
  "content",
  "competitor-pages"
);

export interface ContentMeta {
  title: string;
  slug: string;
  description: string;
  date: string;
  author: string;
  category: string;
  keywords: string[];
  image?: string;
  competitor?: string;
}

export interface ContentPage {
  meta: ContentMeta;
  content: string; // HTML string
}

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));
}

async function parseMarkdown(filePath: string): Promise<ContentPage> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  return {
    meta: data as ContentMeta,
    content: result.toString(),
  };
}

// --- Blog posts ---

export async function getAllPosts(): Promise<ContentPage[]> {
  const files = getMarkdownFiles(BLOG_DIR);
  const posts = await Promise.all(files.map(parseMarkdown));
  return posts
    .filter((p) => p.meta.slug)
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
    );
}

export async function getPostBySlug(
  slug: string
): Promise<ContentPage | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.meta.slug === slug) ?? null;
}

export async function getPostSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.meta.slug);
}

// --- Comparison pages ---

export async function getAllComparisons(): Promise<ContentPage[]> {
  const files = getMarkdownFiles(COMPARE_DIR);
  const pages = await Promise.all(files.map(parseMarkdown));
  return pages
    .filter((p) => p.meta.slug)
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
    );
}

export async function getComparisonBySlug(
  slug: string
): Promise<ContentPage | null> {
  const pages = await getAllComparisons();
  return pages.find((p) => p.meta.slug === slug) ?? null;
}

export async function getComparisonSlugs(): Promise<string[]> {
  const pages = await getAllComparisons();
  return pages.map((p) => p.meta.slug);
}
