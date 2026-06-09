import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/content";

export const metadata: Metadata = { title: "Blog" };

export default function BlogIndex() {
	return (
		<>
			<h1 className="text-2xl font-bold">Blog</h1>
			<ul className="mt-6 space-y-6">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link
							href={post.permalink}
							className="text-xl font-semibold hover:underline"
						>
							{post.title}
						</Link>
						<p className="mt-1 text-sm text-gray-500">
							{post.date.slice(0, 10)}
						</p>
						{post.description ? (
							<p className="mt-2 text-gray-600 dark:text-gray-400">
								{post.description}
							</p>
						) : null}
					</li>
				))}
			</ul>
		</>
	);
}
