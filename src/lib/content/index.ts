import { type Post, posts as rawPosts } from "#content";

export type { Post };

/**
 * サイトから参照する公開記事の正規リスト。
 * - draft を除外
 * - 日付の新しい順
 *
 * 表示側はこの index だけを見る。将来、外部リポジトリ由来の記事を
 * 取り込む場合も、ここでマージすれば表示側は変更不要。
 */
export const posts: Post[] = rawPosts
	.filter((post) => !post.draft)
	.sort((a, b) => (a.date < b.date ? 1 : -1));

export const getPostBySlug = (slug: string): Post | undefined =>
	posts.find((post) => post.slug === slug);

export const allTags = (): string[] =>
	[...new Set(posts.flatMap((post) => post.tags))].sort();
