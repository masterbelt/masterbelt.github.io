import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: { default: "masterbelt", template: "%s · masterbelt" },
	description: "React SSG で生成する静的サイト",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ja">
			<body className="min-h-dvh bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
				<header className="border-b border-gray-200 dark:border-gray-800">
					<nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
						<Link href="/" className="font-semibold">
							masterbelt
						</Link>
						<Link
							href="/blog"
							className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
						>
							Blog
						</Link>
					</nav>
				</header>
				<main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
				<footer className="mx-auto max-w-3xl px-4 py-10 text-sm text-gray-500">
					© masterbelt
				</footer>
			</body>
		</html>
	);
}
