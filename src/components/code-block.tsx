"use client";

import { Check, Copy } from "lucide-react";
import { type ComponentPropsWithoutRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * コードブロック（<pre>）に Copy ボタンを付与する。MDX で components.pre に割り当てる。
 * 行番号は CSS の counter（::before）なので textContent には入らず、コードのみコピーされる。
 * ハイライト時は行が span.line に分かれて改行が無いため、行ごとに textContent を集めて改行で繋ぐ。
 */
export function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
	const { t } = useTranslation("blog");
	const ref = useRef<HTMLPreElement>(null);
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		const code = ref.current?.querySelector("code");
		if (!code) return;
		const lines = code.querySelectorAll(".line");
		const text =
			lines.length > 0
				? Array.from(lines, (l) => l.textContent ?? "").join("\n")
				: (code.textContent ?? "");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// クリップボード不可（非セキュアコンテキスト等）は無視
		}
	};

	return (
		<div className="tsh-wrap">
			<button
				type="button"
				onClick={copy}
				aria-label={copied ? t("code.copied") : t("code.copy")}
				className="tsh-copy"
			>
				{copied ? (
					<Check className="size-4" aria-hidden="true" />
				) : (
					<Copy className="size-4" aria-hidden="true" />
				)}
			</button>
			<pre ref={ref} {...props} />
		</div>
	);
}
