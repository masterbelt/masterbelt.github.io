import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkEmoji from "remark-emoji";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";
import { defineCollection, defineConfig, s } from "velite";

/**
 * Markdown 取り込みパイプライン（明示）。
 * Velite 既定の挙動をここに書き出し、GFM 範囲外の拡張は remarkPlugins / rehypePlugins へ
 * 1 機能ずつ追加していく。
 *   - gfm:            表 / 打ち消し線 / タスクリスト / 自動リンク / 脚注（remark-gfm 相当）
 *   - removeComments: <!-- ... --> を除去
 *   - copyLinkedFiles: ローカル参照ファイルを public へコピーし URL を差し替え
 */
type MarkdownOptions = NonNullable<Parameters<typeof s.markdown>[0]>;

/**
 * rehype-mermaid は色を SVG に焼き込むためダーク追従できない。そこで mermaidConfig で
 * 与えた「番兵色」を、出力 SVG 内だけ CSS 変数へ置換する。インライン SVG は CSS 変数を
 * 継承するので、:root / .dark（globals.css の --mm-*）で light/dark を出し分けられる。
 */
type HastNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

const MERMAID_COLOR_VARS: Record<string, string> = {
	"#246b64": "var(--mm-node)", // ノード塗り
	"#1d544f": "var(--mm-cluster)", // サブグラフ/クラスタ
	"#6fd6cf": "var(--mm-line)", // 枠線 / エッジ / 矢印
	"#f8fbfa": "var(--mm-text)", // テキスト
};

function swapMermaidColors(value: string): string {
	let out = value;
	for (const [hex, cssVar] of Object.entries(MERMAID_COLOR_VARS)) {
		out = out.replaceAll(hex, cssVar);
	}
	return out;
}

function recolorMermaidNode(node: HastNode): void {
	if (node.type === "text" && typeof node.value === "string") {
		node.value = swapMermaidColors(node.value);
	}
	if (node.properties) {
		for (const key of Object.keys(node.properties)) {
			const value = node.properties[key];
			if (typeof value === "string") {
				node.properties[key] = swapMermaidColors(value);
			}
		}
	}
	for (const child of node.children ?? []) recolorMermaidNode(child);
}

/** mermaid が出力した SVG の中だけ、焼き込み色を CSS 変数へ置換する rehype プラグイン。 */
function rehypeMermaidThemeVars() {
	const visit = (node: HastNode): void => {
		const id = node.properties?.id;
		if (
			node.tagName === "svg" &&
			typeof id === "string" &&
			id.startsWith("mermaid")
		) {
			recolorMermaidNode(node);
			return;
		}
		for (const child of node.children ?? []) visit(child);
	};
	return (tree: HastNode): void => visit(tree);
}

const markdownOptions: MarkdownOptions = {
	gfm: true,
	removeComments: true,
	copyLinkedFiles: true,
	// unified のバージョン差で Plugin 型が合わないため cast（実行時は無害）。
	remarkPlugins: [
		// GitHub Alert（> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]）。
		// proseWrap:never で `> [!NOTE] 本文` の 1 行に畳まれても解釈される。
		remarkAlert,
		// 絵文字ショートコード（:tada: → 🎉）。
		remarkEmoji,
		// 数式 $…$ / $$…$$ をパース（HTML 描画は rehype-katex が担当）。
		remarkMath,
	] as unknown as MarkdownOptions["remarkPlugins"],
	rehypePlugins: [
		// KaTeX で数式を描画。katex.min.css は src/app/layout.tsx で読み込む。
		rehypeKatex,
		// ```mermaid をビルド時に Playwright(Chromium)で SVG 化（inline-svg）。
		// themeVariables は「番兵色」。実際の表示色は後段で CSS 変数に置換し、
		// globals.css の :root / .dark で light/dark を出し分ける。
		[
			rehypeMermaid,
			{
				strategy: "inline-svg",
				mermaidConfig: {
					theme: "base",
					themeVariables: {
						background: "transparent",
						primaryColor: "#246b64", // → --mm-node
						primaryBorderColor: "#6fd6cf", // → --mm-line
						primaryTextColor: "#f8fbfa", // → --mm-text
						secondaryColor: "#1d544f", // → --mm-cluster
						secondaryBorderColor: "#6fd6cf",
						secondaryTextColor: "#f8fbfa",
						tertiaryColor: "#1d544f",
						tertiaryBorderColor: "#6fd6cf",
						tertiaryTextColor: "#f8fbfa",
						lineColor: "#6fd6cf",
						textColor: "#f8fbfa",
						edgeLabelBackground: "#246b64",
					},
				},
			},
		],
		// 上記 SVG の番兵色を CSS 変数へ置換（light/dark 出し分けの要）。
		rehypeMermaidThemeVars,
	] as unknown as MarkdownOptions["rehypePlugins"],
};

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
			content: s.markdown(markdownOptions),
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
