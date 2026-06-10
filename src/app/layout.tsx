import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { I18nProvider } from "@/i18n/provider";
import { getT } from "@/i18n/server";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const t = getT();

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: { default: t("siteName"), template: t("metadata.titleTemplate") },
	description: t("metadata.description"),
};

// 描画前に html.dark を確定させ、ダークモード時の一瞬のちらつき（FOUC）を防ぐ。
// localStorage("theme") を優先し、未保存なら OS 設定にフォールバックする。
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: テーマ初期化スクリプトは固定文字列で、描画前に同期実行する必要がある */}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body className="min-h-dvh bg-background text-foreground antialiased">
				<I18nProvider>
					<header className="border-b border-border">
						<nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
							<Link href="/" className="font-semibold">
								{t("siteName")}
							</Link>
							<div className="flex items-center gap-4">
								<Link
									href="/blog"
									className="text-sm text-muted transition-colors hover:text-foreground"
								>
									{t("nav.blog")}
								</Link>
								<ThemeToggle />
							</div>
						</nav>
					</header>
					<main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
					<footer className="mx-auto max-w-3xl px-4 py-10 text-sm text-subtle">
						{t("footer.copyright")}
					</footer>
				</I18nProvider>
			</body>
		</html>
	);
}
