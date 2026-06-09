import { defineCollection, defineConfig, s } from "velite";

const posts = defineCollection({
	name: "Post",
	pattern: "posts/**/*.md",
	schema: s
		.object({
			title: s.string().max(120),
			date: s.isodate(),
			description: s.string().max(300).optional(),
			tags: s.array(s.string()).default([]),
			draft: s.boolean().default(false),
			path: s.path(),
			content: s.markdown(),
		})
		.transform((data) => {
			const slug = data.path.replace(/^posts\//, "");
			return { ...data, slug, permalink: `/blog/${slug}/` };
		}),
});

export default defineConfig({
	root: "content",
	output: {
		data: ".velite",
		assets: "public/static",
		base: "/static/",
		name: "[name]-[hash:8].[ext]",
		clean: true,
	},
	collections: { posts },
});
