import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { posts } from "@/lib/content";

const t = getT("blog");

export const metadata: Metadata = { title: t("title") };

export default function BlogIndex() {
	return (
		<>
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<ul className="mt-6 space-y-6">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link
							href={post.permalink}
							className="text-xl font-semibold hover:underline"
						>
							{post.title}
						</Link>
						<p className="mt-1 text-sm text-subtle">{post.date.slice(0, 10)}</p>
						{post.description ? (
							<p className="mt-2 text-muted">{post.description}</p>
						) : null}
					</li>
				))}
			</ul>
		</>
	);
}
