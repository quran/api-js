import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/metadata";
import { source } from "@/lib/source";

export const revalidate = false;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string): string => new URL(path, baseUrl).toString();

  return [
    ...source.getPages().map((page) => {
      const lastModified = page.data.lastModified;

      return {
        url: url(page.url),
        lastModified: lastModified ? new Date(lastModified) : undefined,
        changeFrequency: "monthly",
        priority: 0.5,
      } satisfies MetadataRoute.Sitemap[number];
    }),
  ];
}
