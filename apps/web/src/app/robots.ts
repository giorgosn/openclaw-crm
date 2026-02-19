import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/compare", "/docs"],
        disallow: [
          "/api/",
          "/settings/",
          "/login",
          "/register",
          "/home",
          "/objects/",
          "/tasks",
          "/notes",
          "/chat",
          "/search",
          "/notifications",
          "/lists/",
          "/select-workspace",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
