/**
 * ビルド時シンタックスハイライト（web-tree-sitter）+ VitePress 風の拡張コードブロック。
 *
 * - ハイライト: grammars/<grammar>/parser.wasm + highlights.scm（scripts/build-grammars.mjs 生成）を
 *   読み、tree-sitter のクエリ capture をトークン span（CSS クラス = scope の第1セグメント）へ変換。
 *   出力は静的 HTML(hast) なのでブラウザに tree-sitter は不要。CJK のオフセットも一致。
 * - 拡張機能: 行番号 / `{1,3-5}` 行ハイライト / `[!code highlight|focus|++|--|error|warning]` / タイトル。
 *   すべて rehype 段で行う。code ハンドラが残す <code> の data.meta と className、コードテキストから解析する
 *   （remark で code ノードに hProperties を載せても to-hast の code ハンドラに無視されるため）。
 *
 * 言語追加: scripts/build-grammars.mjs に文法を足し、下の GRAMMAR_ALIASES に別名を足すだけ。
 */
import fs from "node:fs";
import path from "node:path";
import * as TS from "web-tree-sitter";

const GRAMMARS_DIR = path.join(process.cwd(), "grammars");
const WTS_DIR = path.join(process.cwd(), "node_modules", "web-tree-sitter");

/** コードフェンスの言語名 → grammars/ のディレクトリ名。 */
const GRAMMAR_ALIASES: Record<string, string> = {
	ts: "typescript",
	typescript: "typescript",
	go: "go",
	golang: "go",
	cs: "csharp",
	csharp: "csharp",
	toml: "toml",
	bash: "bash",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	belt: "masterbelt",
	masterbelt: "masterbelt",
};

type Loaded = { language: TS.Language; query: TS.Query };
const cache = new Map<string, Loaded | null>();
let initPromise: Promise<unknown> | null = null;

function ensureInit() {
	if (!initPromise) {
		initPromise = TS.Parser.init({
			locateFile: (file: string) => path.join(WTS_DIR, file),
		});
	}
	return initPromise;
}

async function loadGrammar(grammar: string): Promise<Loaded | null> {
	const cached = cache.get(grammar);
	if (cached !== undefined) return cached;
	const wasm = path.join(GRAMMARS_DIR, grammar, "parser.wasm");
	const scm = path.join(GRAMMARS_DIR, grammar, "highlights.scm");
	if (!fs.existsSync(wasm) || !fs.existsSync(scm)) {
		cache.set(grammar, null);
		return null;
	}
	await ensureInit();
	const language = await TS.Language.load(wasm);
	const query = new TS.Query(language, fs.readFileSync(scm, "utf8"));
	const loaded: Loaded = { language, query };
	cache.set(grammar, loaded);
	return loaded;
}

function resolveGrammar(lang: string | null | undefined): string | null {
	if (!lang) return null;
	return GRAMMAR_ALIASES[lang.toLowerCase()] ?? null;
}

type Token = { text: string; scope: string | null };

/** code を行ごとのトークン列に変換する（未対応文法/資産欠落時は null）。 */
async function tokenize(
	code: string,
	grammar: string,
): Promise<Token[][] | null> {
	const loaded = await loadGrammar(grammar);
	if (!loaded) return null;
	const parser = new TS.Parser();
	parser.setLanguage(loaded.language);
	const tree = parser.parse(code);
	if (!tree) return null;
	const captures = loaded.query.captures(tree.rootNode);
	const scopes: (string | null)[] = new Array(code.length).fill(null);
	captures.sort(
		(a, b) =>
			a.node.startIndex - b.node.startIndex ||
			b.node.endIndex - a.node.endIndex,
	);
	for (const capture of captures) {
		const seg = capture.name.split(".")[0];
		for (let i = capture.node.startIndex; i < capture.node.endIndex; i++) {
			scopes[i] = seg;
		}
	}
	tree.delete();

	const lines: Token[][] = [];
	let line: Token[] = [];
	let buf = "";
	let bufScope: string | null = scopes[0] ?? null;
	const flush = () => {
		if (buf) line.push({ text: buf, scope: bufScope });
		buf = "";
	};
	for (let i = 0; i < code.length; i++) {
		const ch = code[i];
		if (ch === "\n") {
			flush();
			lines.push(line);
			line = [];
			bufScope = scopes[i + 1] ?? null;
			continue;
		}
		if (scopes[i] !== bufScope) {
			flush();
			bufScope = scopes[i];
		}
		buf += ch;
	}
	flush();
	lines.push(line);
	return lines;
}

// ---- メタ / マーカー解析 ------------------------------------------------------

type LineKind =
	| "highlighted"
	| "focused"
	| "add"
	| "remove"
	| "error"
	| "warning";

type BlockMeta = {
	lineNumbers: boolean;
	start: number;
	highlight: Set<number>; // 1-based
	title: string | null;
};

const MARKER_RE =
	/\s*(?:\/\/|#|--|;|\/\*|<!--)?\s*\[!code\s+(\+\+|--|highlight|focus|error|warning)(?::(\d+))?\]\s*(?:\*\/|-->)?\s*$/;

const MARKER_KIND: Record<string, LineKind> = {
	"++": "add",
	"--": "remove",
	highlight: "highlighted",
	focus: "focused",
	error: "error",
	warning: "warning",
};

const KIND_CLASSES: Record<LineKind, string[]> = {
	highlighted: ["highlighted"],
	focused: ["focused"],
	add: ["diff", "add"],
	remove: ["diff", "remove"],
	error: ["error"],
	warning: ["warning"],
};

function parseRanges(spec: string): number[] {
	const out: number[] = [];
	for (const part of spec.split(",")) {
		const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
		if (!m) continue;
		const lo = Number(m[1]);
		const hi = m[2] ? Number(m[2]) : lo;
		for (let n = lo; n <= hi; n++) out.push(n);
	}
	return out;
}

/** lang(className 由来) と meta 文字列からブロック設定を解析する。 */
function parseMeta(
	lang: string,
	meta: string,
): { base: string; block: BlockMeta } {
	const base = lang.split(":")[0].toLowerCase();
	const lnSrc = `${lang} ${meta}`;
	const ln = lnSrc.match(/:line-numbers(?:=(\d+))?/);
	const range = meta.match(/\{([\d,\-\s]+)\}/);
	const title = meta.match(/\[([^\]]+)\]/);
	return {
		base,
		block: {
			lineNumbers: ln !== null,
			start: ln?.[1] ? Number(ln[1]) : 1,
			highlight: new Set(range ? parseRanges(range[1]) : []),
			title: title ? title[1] : null,
		},
	};
}

/** コードテキストから `[!code ...]` マーカーを除去し、行注釈を返す。 */
function processMarkers(code: string): {
	code: string;
	annotations: Map<number, Set<LineKind>>;
} {
	const lines = code.split("\n");
	const annotations = new Map<number, Set<LineKind>>();
	const add = (i: number, kind: LineKind) => {
		const set = annotations.get(i) ?? new Set<LineKind>();
		set.add(kind);
		annotations.set(i, set);
	};
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(MARKER_RE);
		if (!m || m.index === undefined) continue;
		const kind = MARKER_KIND[m[1]];
		const count = m[2] ? Number(m[2]) : 1;
		lines[i] = lines[i].slice(0, m.index);
		for (let k = 0; k < count && i + k < lines.length; k++) add(i + k, kind);
	}
	return { code: lines.join("\n"), annotations };
}

// ---- rehype プラグイン --------------------------------------------------------

type HastNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	data?: { meta?: string };
	children?: HastNode[];
};

const asArray = (v: unknown): string[] =>
	Array.isArray(v) ? (v as string[]) : typeof v === "string" ? [v] : [];

const textOf = (node: HastNode): string =>
	node.type === "text"
		? (node.value ?? "")
		: (node.children ?? []).map(textOf).join("");

function buildCodeElement(
	lines: Token[][],
	block: BlockMeta,
	annotations: Map<number, Set<LineKind>>,
): HastNode {
	const lineNodes: HastNode[] = lines.map((tokens, i) => {
		const classes = new Set<string>(["line"]);
		if (block.highlight.has(i + 1)) classes.add("highlighted");
		for (const kind of annotations.get(i) ?? []) {
			for (const c of KIND_CLASSES[kind]) classes.add(c);
		}
		return {
			type: "element",
			tagName: "span",
			properties: { className: [...classes] },
			children: tokens.map((t) =>
				t.scope
					? {
							type: "element",
							tagName: "span",
							properties: { className: [t.scope] },
							children: [{ type: "text", value: t.text }],
						}
					: { type: "text", value: t.text },
			),
		};
	});
	return {
		type: "element",
		tagName: "code",
		properties: {},
		children: lineNodes,
	};
}

/** rehype プラグイン: <pre><code class="language-X"> をハイライト + 拡張整形する。 */
export function rehypeTreeSitter() {
	return async (tree: HastNode) => {
		const targets: { code: HastNode; pre: HastNode }[] = [];
		const walk = (node: HastNode, parent: HastNode | null) => {
			if (node.tagName === "code" && parent?.tagName === "pre") {
				targets.push({ code: node, pre: parent });
			}
			for (const child of node.children ?? []) walk(child, node);
		};
		walk(tree, null);

		for (const { code, pre } of targets) {
			const langClass = asArray(code.properties?.className).find((c) =>
				c.startsWith("language-"),
			);
			if (!langClass) continue;
			const rawLang = langClass.slice("language-".length);
			if (rawLang === "mermaid") continue; // mermaid は rehype-mermaid が処理
			const { base, block } = parseMeta(rawLang, code.data?.meta ?? "");
			const grammar = resolveGrammar(base);
			if (!grammar) continue; // 未対応言語は素のまま

			const { code: clean, annotations } = processMarkers(textOf(code));
			const lines = await tokenize(clean, grammar);
			if (!lines) continue;

			const codeEl = buildCodeElement(lines, block, annotations);
			const preClasses = new Set([
				...asArray(pre.properties?.className),
				"tsh",
				`language-${grammar}`,
			]);
			if (block.lineNumbers) preClasses.add("line-numbers");
			let hasFocus = false;
			for (const set of annotations.values())
				if (set.has("focused")) hasFocus = true;
			if (hasFocus) preClasses.add("has-focus");

			pre.properties ??= {};
			pre.properties.className = [...preClasses];
			// 行番号の開始値。counter-reset は <code> 側に置く（CSS の .tsh code の
			// counter-reset で上書きされないよう、同じ要素で指定する）。
			if (block.start !== 1) {
				codeEl.properties = codeEl.properties ?? {};
				codeEl.properties.style = `counter-reset:line ${block.start - 1}`;
			}

			const children: HastNode[] = [];
			if (block.title) {
				// code-group のタブ label 用に data-title でも持たせる（CodeGroup が読む）。
				pre.properties.dataTitle = block.title;
				children.push({
					type: "element",
					tagName: "div",
					properties: { className: ["tsh-title"] },
					children: [{ type: "text", value: block.title }],
				});
			}
			children.push(codeEl);
			pre.children = children;
		}
	};
}

// ---- code groups（:::code-group → タブ） --------------------------------------

type MdastNode = {
	type: string;
	name?: string;
	data?: Record<string, unknown>;
	children?: MdastNode[];
};

/** remark プラグイン: `:::code-group` を <mb-code-group>（MDX で CodeGroup に割当）へ変換する。 */
export function remarkCodeGroup() {
	return (tree: MdastNode) => {
		const walk = (node: MdastNode) => {
			if (node.type === "containerDirective" && node.name === "code-group") {
				node.data = {
					...(node.data ?? {}),
					hName: "mb-code-group",
					hProperties: {},
				};
			}
			for (const child of node.children ?? []) walk(child);
		};
		walk(tree);
	};
}
