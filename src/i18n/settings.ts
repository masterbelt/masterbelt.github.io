/**
 * i18n の基本設定（単一情報源）。
 *
 * 現状は ja の単一ロケール。将来ロケールを増やす場合は languages に追加し、
 * resources / ルーティングを拡張する（表示側は t() 経由なので影響は最小）。
 */
export const fallbackLng = "ja";
export const languages = [fallbackLng];
export const defaultNS = "common";
