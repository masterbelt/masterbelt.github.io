import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";
import { MermaidFigure } from "./mermaid-figure";

type MdxComponents = Record<string, ComponentType<Record<string, unknown>>>;

/**
 * Velite の s.mdx() が出力する「コンパイル済み MDX（function-body 文字列）」を
 * React コンポーネントへ評価して描画する。これにより記事は HTML 文字列の注入ではなく
 * ページごとの React ツリーになり、要素を任意のコンポーネントへ差し替えられる。
 */
const components = {
	// mermaid 図に拡大縮小/スクロール UI を付与する（velite が <mermaid-figure> で包む）。
	"mermaid-figure": MermaidFigure,
} as unknown as MdxComponents;

function evaluateMdx(code: string) {
	// code は信頼済みのビルド成果物（自分のコンテンツ）。runtime を渡して評価する。
	const factory = new Function(code) as (r: typeof runtime) => {
		default: ComponentType<{ components?: MdxComponents }>;
	};
	return factory({ ...runtime }).default;
}

export function MDXContent({ code }: { code: string }) {
	const Content = evaluateMdx(code);
	return <Content components={components} />;
}
