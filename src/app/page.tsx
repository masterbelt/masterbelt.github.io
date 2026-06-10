import Link from "next/link";
import { getT } from "@/i18n/server";
import { posts } from "@/lib/content";

export default function Home() {
	const t = getT("home");
	const tc = getT(); // common（サイト共通の文言）
	return (
		<>
			<h1 className="text-3xl font-bold tracking-tight">{tc("siteName")}</h1>
			<p className="mt-4 text-muted">{t("lead")}</p>

			<h2 className="mt-10 text-lg font-semibold">{t("recentPosts")}</h2>
			<ul className="mt-4 space-y-3">
				{posts.slice(0, 5).map((post) => (
					<li key={post.slug}>
						<Link href={post.permalink} className="text-link hover:underline">
							{post.title}
						</Link>
						<span className="ml-2 text-sm text-subtle">
							{post.date.slice(0, 10)}
						</span>
					</li>
				))}
			</ul>
		</>
	);
}
