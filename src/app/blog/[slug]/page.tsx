import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
			<div
				className="prose prose-gray mt-8 dark:prose-invert"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Velite が生成した信頼済み HTML を描画する
				dangerouslySetInnerHTML={{ __html: post.content }}
			/>
		</article>
	);
}
