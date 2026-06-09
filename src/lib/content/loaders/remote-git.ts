/**
 * 外部 git リポジトリから Markdown を取得するローダーの差し込み口（将来実装）。
 *
 * 設計意図:
 *   content.sources.json に登録したリポジトリを shallow + sparse clone し、
 *   content/external/<name>/** へ展開する。展開後は Velite が通常の
 *   ローカルコンテンツとして拾うため、表示側・スキーマ側は変更不要。
 *   再現性のため ref はタグ or commit で固定する。
 *
 * 現状は型（契約）のみ定義し、実装は scripts/sync-content.ts と合わせて後日。
 */

export interface RemoteSource {
	/** 識別名（展開先ディレクトリ名にも使う） */
	name: string;
	/** clone 対象リポジトリ URL */
	repo: string;
	/** 固定する ref（タグ or commit を推奨：再現性のため） */
	ref: string;
	/** リポジトリ内の Markdown ルート（sparse-checkout 対象） */
	src: string;
	/** 反映先 collection（velite.config.ts の collection キー） */
	collection: string;
}

export async function syncRemoteSource(_source: RemoteSource): Promise<void> {
	// TODO: shallow + sparse clone → content/external/<name> へ展開
	throw new Error("remote-git loader is not implemented yet");
}
