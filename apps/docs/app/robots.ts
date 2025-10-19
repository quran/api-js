import { MetadataRoute } from "next";
import { baseUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: baseUrl.toString(),
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
