"use client";

import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";

type BlockProps = { "data-title"?: string; dataTitle?: string };

/**
 * `:::code-group` のタブ表示。velite.config が code-group ディレクティブを <mb-code-group> に変換し、
 * MDX 側で本コンポーネントに割り当てる。子の各 <pre>（ハイライト済み）の data-title をタブ名にする。
 */
export function CodeGroup({ children }: { children?: ReactNode }) {
	const blocks = Children.toArray(children).filter(
		isValidElement,
	) as ReactElement<BlockProps>[];
	const [active, setActive] = useState(0);
	if (blocks.length === 0) return null;

	const labelOf = (el: ReactElement<BlockProps>, i: number) =>
		el.props["data-title"] ?? el.props.dataTitle ?? String(i + 1);

	return (
		<div className="not-prose my-6 overflow-hidden rounded-md border border-border">
			<div
				role="tablist"
				className="flex gap-1 border-b border-border px-2 pt-1"
			>
				{blocks.map((el, i) => (
					<button
						key={el.key}
						type="button"
						role="tab"
						aria-selected={i === active}
						onClick={() => setActive(i)}
						className={`rounded-t px-3 py-1.5 text-sm transition-colors ${
							i === active
								? "bg-foreground/10 text-foreground"
								: "text-muted hover:text-foreground"
						}`}
					>
						{labelOf(el, i)}
					</button>
				))}
			</div>
			{blocks.map((el, i) => (
				<div key={el.key} hidden={i !== active}>
					{el}
				</div>
			))}
		</div>
	);
}
