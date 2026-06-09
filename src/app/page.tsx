import Link from "next/link";
import { posts } from "@/lib/content";

export default function Home() {
	return (
		<>
			<h1 className="text-3xl font-bold tracking-tight">masterbelt</h1>
			<p className="mt-4 text-gray-600 dark:text-gray-400">
				React SSG で生成する静的サイトです。
			</p>

			<h2 className="mt-10 text-lg font-semibold">最近の投稿</h2>
			<ul className="mt-4 space-y-3">
				{posts.slice(0, 5).map((post) => (
					<li key={post.slug}>
						<Link
							href={post.permalink}
							className="text-blue-600 hover:underline dark:text-blue-400"
						>
							{post.title}
						</Link>
						<span className="ml-2 text-sm text-gray-500">
							{post.date.slice(0, 10)}
						</span>
					</li>
				))}
			</ul>
		</>
	);
}
