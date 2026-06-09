import type { MetadataRoute } from "next";
import { posts } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

// static export 用に静的生成を明示
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
		{ url: absoluteUrl("/blog/"), changeFrequency: "weekly", priority: 0.8 },
	];

	const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
		url: absoluteUrl(post.permalink),
		lastModified: post.date,
		changeFrequency: "monthly",
		priority: 0.6,
	}));

	return [...staticRoutes, ...postRoutes];
}
