import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { getPostBySlug, posts } from "@/lib/content";

// static export: prerender するパスを列挙
export function generateStaticParams() {
	return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) return {};
	return { title: post.title, description: post.description };
}

export default async function BlogPost({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) notFound();

	return (
		<article>
			<h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
			<p className="mt-2 text-sm text-subtle">{post.date.slice(0, 10)}</p>
			<div className="prose prose-gray mt-8 max-w-none dark:prose-invert">
				<MDXContent code={post.content} />
			</div>
		</article>
	);
}
