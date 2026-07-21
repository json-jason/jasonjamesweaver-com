import type { MetadataRoute } from "next";

// The site is a single hash-routed page, so only the root URL is a distinct,
// crawlable document. In-page views (#map, #status, ...) are not separate URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://jasonjamesweaver.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
