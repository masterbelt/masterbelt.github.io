/**
 * サイトの正準オリジン（末尾スラッシュなし）。
 * sitemap / robots / metadataBase / canonical などの絶対URL生成に使う単一情報源。
 */
export const siteUrl = "https://masterbelt.dev";

/** siteUrl からの絶対URLを組み立てる（path は先頭スラッシュ付き想定） */
export const absoluteUrl = (path: string): string => `${siteUrl}${path}`;
