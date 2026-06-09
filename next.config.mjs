// Velite をビルド/開発の前段で実行し、content/** → .velite を生成する。
// （Next の設定評価時に一度だけ走らせる。env で多重起動を防止）
const isDev = process.argv.includes("dev");
const isBuild = process.argv.includes("build");
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
	process.env.VELITE_STARTED = "1";
	const { build } = await import("velite");
	await build({ watch: isDev, clean: !isDev });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	// GitHub Pages 向けに完全静的化（out/ を生成）
	output: "export",
	// Pages のディレクトリ配信と相性が良いよう URL を末尾スラッシュに統一
	trailingSlash: true,
	// 静的エクスポートでは画像最適化サーバを使えないため無効化
	images: { unoptimized: true },
};

export default nextConfig;
