import blog from "./locales/ja/blog.json";
import common from "./locales/ja/common.json";
import home from "./locales/ja/home.json";
import { fallbackLng } from "./settings";

/**
 * バンドル済みの翻訳リソース。
 * 静的エクスポートのため http backend は使わず、ビルドに同梱する。
 * 構成ルール・追加手順は locales/README.md を参照。namespace を追加する場合は
 * ここに import を 1 行足すだけでよい（型・namespace 一覧は本ファイルから
 * 導出されるため自動で追従する）。
 */
export const resources = {
	[fallbackLng]: { common, home, blog },
} as const;

/** 登録済み namespace 一覧（resources から導出して drift を防ぐ）。 */
export const namespaces = Object.keys(resources[fallbackLng]) as Array<
	keyof (typeof resources)[typeof fallbackLng]
>;
