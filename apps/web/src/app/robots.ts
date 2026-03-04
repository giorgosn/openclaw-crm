import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/base-url";

export default function robots(): MetadataRoute.Robots {

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
