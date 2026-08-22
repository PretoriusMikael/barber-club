import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { branches } from "@/content/branches";

/**
 * /book is excluded on purpose — it is noindex (a booking widget has no search
 * value and would compete with /services for the same intent).
 *
 * The eleven branch pages carry the local-SEO weight and are given high
 * priority: for a multi-branch group they are the pages that rank for
 * "barber <town>", which is the query that actually converts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/branches", priority: 0.9, changeFrequency: "monthly" },
    { path: "/groups", priority: 0.8, changeFrequency: "monthly" },
    { path: "/gallery", priority: 0.7, changeFrequency: "weekly" },
    { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
  ];

  const branchRoutes = branches.map((b) => ({
    path: `/branches/${b.slug}`,
    priority: 0.85,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...branchRoutes].map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
