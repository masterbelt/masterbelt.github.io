import rehypeKatex from "rehype-katex";
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
