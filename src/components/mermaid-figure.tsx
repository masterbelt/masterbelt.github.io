"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import {
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const STEP = 1.25;

/**
 * mermaid 図のラッパー。拡大縮小 + スクロール + ドラッグでのパンを提供する。
 * velite.config.ts が mermaid の SVG を <mermaid-figure> で包み、MDX 側で本コンポーネントに割り当てる。
 *
 * 設計:
 *  - 拡大は transform: scale。ただし transform はレイアウト寸法（=スクロール領域）を変えないため、
 *    自然サイズを測って scale 後の実寸を確保する sizer 要素を置き、はみ出しを実スクロール可能にする。
 *  - ビューポートは max-height で上限を設け、両軸でパンできるようにする。
 *  - ドラッグスクロールは Pointer Events + setPointerCapture。カーソルが要素外へ出ても move を
 *    取りこぼさない（マウス移動判定の定番バグを回避）。マウス左ボタンのみ作動。
 */
export function MermaidFigure({ children }: { children?: ReactNode }) {
	const { t } = useTranslation("blog");
	const [scale, setScale] = useState(1);
	const [dragging, setDragging] = useState(false);
	const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	// ドラッグ開始時の基準（座標 + スクロール位置）。move ごとの再描画を避けるため ref に持つ。
	const origin = useRef<{
		x: number;
		y: number;
		left: number;
		top: number;
	} | null>(null);

	// 自然サイズを測る（transform は offset 寸法に影響しないので scale 中でも正しい値が得られる）。
	useEffect(() => {
		const el = contentRef.current;
		if (el) setNatural({ w: el.offsetWidth, h: el.offsetHeight });
	}, []);

	const zoom = (factor: number) =>
		setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));

	// マウス左ボタンのみでパン開始（タッチ/ペンは native スクロールに任せ、右クリックは無視）。
	const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (e.pointerType !== "mouse" || e.button !== 0) return;
		const el = viewportRef.current;
		if (!el) return;
		origin.current = {
			x: e.clientX,
			y: e.clientY,
			left: el.scrollLeft,
			top: el.scrollTop,
		};
		el.setPointerCapture(e.pointerId);
		setDragging(true);
	};

	const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		const el = viewportRef.current;
		const start = origin.current;
		if (!el || !start) return;
		el.scrollLeft = start.left - (e.clientX - start.x);
		el.scrollTop = start.top - (e.clientY - start.y);
	};

	const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!origin.current) return;
		const el = viewportRef.current;
		if (el?.hasPointerCapture(e.pointerId))
			el.releasePointerCapture(e.pointerId);
		origin.current = null;
		setDragging(false);
	};

	const buttonClass =
		"grid size-7 place-items-center rounded text-foreground transition-colors hover:bg-foreground/10";

	return (
		<figure className="relative not-prose my-6 overflow-hidden rounded-md border border-border">
			<div
				ref={viewportRef}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
				className={`max-h-[70vh] select-none overflow-auto p-4 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
			>
				{/* sizer: scale 後の実寸を確保し、はみ出しを実スクロール可能にする */}
				<div
					style={
						natural
							? { width: natural.w * scale, height: natural.h * scale }
							: undefined
					}
				>
					<div
						ref={contentRef}
						style={{
							transform: `scale(${scale})`,
							transformOrigin: "top left",
							width: "max-content",
						}}
					>
						{children}
					</div>
				</div>
			</div>
			{/* 右下のフローティング操作ボタン（ビューポート外なのでスクロールに追従しない） */}
			<div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md border border-border bg-background/80 p-1 shadow-sm backdrop-blur">
				<button
					type="button"
					onClick={() => zoom(1 / STEP)}
					aria-label={t("diagram.zoomOut")}
					className={buttonClass}
				>
					<ZoomOut className="size-4" aria-hidden="true" />
				</button>
				<button
					type="button"
					onClick={() => setScale(1)}
					aria-label={t("diagram.reset")}
					className={buttonClass}
				>
					<Maximize className="size-4" aria-hidden="true" />
				</button>
				<button
					type="button"
					onClick={() => zoom(STEP)}
					aria-label={t("diagram.zoomIn")}
					className={buttonClass}
				>
					<ZoomIn className="size-4" aria-hidden="true" />
				</button>
			</div>
		</figure>
	);
}
