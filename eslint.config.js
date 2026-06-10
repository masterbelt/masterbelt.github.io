import sanityI18n from "@sanity/eslint-config-i18n";
import tsParser from "@typescript-eslint/parser";

/**
 * ESLint は「コードへの文言直書き禁止」専用に限定する。
 * 整形・一般 Lint は Biome が担当し、ここでは i18n ルールだけを有効化して
 * 2 ツールの責務が重複（drift）しないようにする。
 */
export default [
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			".velite/**",
			"public/**",
			"next-env.d.ts",
			"scripts/**",
			"**/*.config.{js,mjs,ts}",
		],
	},
	// @sanity/eslint-config-i18n: no-literal-string + 属性リテラル禁止の各ルール
	...sanityI18n,
	{
		files: ["src/**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
		},
		rules: {
			// 対象は「ユーザー向け文言」= JSX テキストノード。
			// 技術的な JS 文字列（localStorage キーや CSS クラス等）は誤検出しない。
			// 属性内のユーザー向け文言（aria-label / title 等）は別ルールが担当する。
			"i18next/no-literal-string": ["error", { mode: "jsx-text-only" }],
			// i18next / react-i18next を直接利用するため、Sanity Studio 向けの import 禁止は無効化。
			"@sanity/i18n/no-i18next-import": "off",
		},
	},
];
