/**
 * ビルド時シンタックスハイライト（web-tree-sitter）。
 *
 * grammars/<grammar>/parser.wasm + highlights.scm（scripts/build-grammars.mjs が生成）を読み、
 * tree-sitter のクエリ capture をトークン span（CSS クラス = scope の第1セグメント）へ変換する。
 * 出力は静的 HTML(hast)なのでブラウザに tree-sitter は不要。
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

export function resolveGrammar(lang: string | null | undefined): string | null {
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
	// 文字ごとの scope を決める。外側→内側の順で書き込み、内側（より具体的）が勝つ。
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

type HastNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

const asArray = (v: unknown): string[] =>
	Array.isArray(v) ? (v as string[]) : typeof v === "string" ? [v] : [];

const textOf = (node: HastNode): string =>
	node.type === "text"
		? (node.value ?? "")
		: (node.children ?? []).map(textOf).join("");

function buildLineSpans(lines: Token[][]): HastNode[] {
	return lines.map((tokens) => ({
		type: "element",
		tagName: "span",
		properties: { className: ["line"] },
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
	}));
}

/** rehype プラグイン: <pre><code class="language-X"> をビルド時にハイライトする。 */
export function rehypeTreeSitter() {
	return async (tree: HastNode) => {
		const targets: { code: HastNode; pre: HastNode; lang: string }[] = [];
		const walk = (node: HastNode, parent: HastNode | null) => {
			if (
				node.tagName === "code" &&
				parent?.tagName === "pre" &&
				node.properties
			) {
				const langClass = asArray(node.properties.className).find((c) =>
					c.startsWith("language-"),
				);
				if (langClass) {
					targets.push({
						code: node,
						pre: parent,
						lang: langClass.slice("language-".length),
					});
				}
			}
			for (const child of node.children ?? []) walk(child, node);
		};
		walk(tree, null);

		for (const { code, pre, lang } of targets) {
			if (lang === "mermaid") continue; // mermaid は rehype-mermaid が処理
			const grammar = resolveGrammar(lang);
			if (!grammar) continue; // 未対応言語は素のまま
			const lines = await tokenize(textOf(code), grammar);
			if (!lines) continue;
			code.children = buildLineSpans(lines);
			pre.properties = pre.properties ?? {};
			pre.properties.className = [
				...asArray(pre.properties.className),
				"tsh",
				`language-${grammar}`,
			];
		}
	};
}
