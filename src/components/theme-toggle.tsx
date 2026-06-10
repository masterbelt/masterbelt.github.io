"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Theme = "light" | "dark";

/**
 * localStorage("theme") の値。未保存時は OS 設定にフォールバックする。
 * <head> のインラインスクリプト（layout.tsx の themeInitScript）と同じ判定。
 */
function resolveTheme(): Theme {
	const stored = localStorage.getItem("theme");
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function ThemeToggle() {
	const { t } = useTranslation("common");
	// SSR/初回描画時は確定できないため null。マウント後に実値を入れる。
	const [theme, setTheme] = useState<Theme | null>(null);

	useEffect(() => {
		setTheme(resolveTheme());
	}, []);

	function apply(next: Theme) {
		setTheme(next);
		document.documentElement.classList.toggle("dark", next === "dark");
		localStorage.setItem("theme", next);
	}

	// マウント前はアイコンを確定できないので、レイアウトシフト防止の空ボタンを描画。
	if (theme === null) {
		return (
			<button
				type="button"
				aria-label={t("themeToggle.label")}
				className="size-9 rounded-md border border-foreground/15"
				disabled
			/>
		);
	}

	const isDark = theme === "dark";
	const label = isDark ? t("themeToggle.toLight") : t("themeToggle.toDark");
	return (
		<button
			type="button"
			onClick={() => apply(isDark ? "light" : "dark")}
			aria-label={label}
			title={label}
			className="grid size-9 place-items-center rounded-md border border-foreground/15 text-foreground transition-colors hover:bg-foreground/5"
		>
			{isDark ? (
				<Sun className="size-5" aria-hidden="true" />
			) : (
				<Moon className="size-5" aria-hidden="true" />
			)}
		</button>
	);
}
