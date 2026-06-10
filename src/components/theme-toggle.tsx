"use client";

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
			{isDark ? <SunIcon /> : <MoonIcon />}
		</button>
	);
}

function SunIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-5"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-5"
			aria-hidden="true"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}
