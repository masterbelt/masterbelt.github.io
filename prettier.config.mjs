/**
 * Prettier は Markdown 専用（コード整形は Biome が担当する）。
 * proseWrap: "never" で段落を 1 行へアンラップし、ソフトラップ（段落途中の改行）由来の
 * 描画崩れ——特に CJK で改行が空白として描画される問題——を機械的に防ぐ。
 */
export default {
	proseWrap: "never",
};
