import type { MetadataRoute } from "next";
import { getAllPosts, getAllComparisons } from "@/lib/content";
import { baseUrl } from "@/lib/base-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const posts = await getAllPosts();
  const comparisons = await getAllComparisons();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: posts[0]?.meta.date ? new Date(posts[0].meta.date) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: comparisons[0]?.meta.date ? new Date(comparisons[0].meta.date) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Blog posts - use actual publication dates
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.meta.slug}`,
    lastModified: new Date(post.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Comparison pages - use actual publication dates
  const comparePages: MetadataRoute.Sitemap = comparisons.map((page) => ({
    url: `${baseUrl}/compare/${page.meta.slug}`,
    lastModified: new Date(page.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...comparePages];
}
