/**
 * tree-sitter grammar 資産（grammars/<lang>/parser.wasm + highlights.scm）を生成する。
 * 生成物は gitignore 済み。ローカル/CI ともビルド前に都度生成する（package.json の build が呼ぶ）。
 *
 *   - typescript / go / csharp / toml: npm の文法パッケージ（prebuilt wasm + 同梱 query）からコピー。
 *       バージョンが一致するため query が確実にコンパイルできる。typescript は javascript を
 *       inherits するので両クエリを結合する。
 *   - masterbelt: 自作言語。公開モノレポ（masterbelt/masterbelt）の grammar ソースを取得し、
 *       tree-sitter CLI で wasm をビルドする（emscripten/docker を利用）。重いので既存なら再生成しない
 *       （`--force` または FORCE_GRAMMARS=1 で強制）。
 *
 * 注: 公開リポジトリのソースから組む。公開 npm パッケージ
 *     @masterbelt/tree-sitter-masterbelt（GitHub Packages, 要 read:packages トークン）も同一ソースの
 *     ミラーなので、トークンを用意できる場合はそちらへ差し替え可。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "grammars");
const FORCE =
	process.argv.includes("--force") || process.env.FORCE_GRAMMARS === "1";
const MASTERBELT_REF = process.env.MASTERBELT_REF || "main";

/** npm 文法パッケージから供給する言語。 */
const NPM_LANGS = {
	typescript: {
		wasm: "tree-sitter-typescript/tree-sitter-typescript.wasm",
		// javascript を inherits するため両クエリを結合（inherits 行は除去）。
		queries: [
			"tree-sitter-javascript/queries/highlights.scm",
			"tree-sitter-typescript/queries/highlights.scm",
		],
		stripInherits: true,
	},
	go: {
		wasm: "tree-sitter-go/tree-sitter-go.wasm",
		queries: ["tree-sitter-go/queries/highlights.scm"],
	},
	csharp: {
		wasm: "tree-sitter-c-sharp/tree-sitter-c_sharp.wasm",
		queries: ["tree-sitter-c-sharp/queries/highlights.scm"],
	},
	toml: {
		wasm: "@tree-sitter-grammars/tree-sitter-toml/tree-sitter-toml.wasm",
		queries: ["@tree-sitter-grammars/tree-sitter-toml/queries/highlights.scm"],
	},
};

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function writeQuery(dest, scmRelPaths, stripInherits) {
	let merged = scmRelPaths
		.map((rel) => fs.readFileSync(path.join(ROOT, "node_modules", rel), "utf8"))
		.join("\n");
	if (stripInherits) merged = merged.replace(/^\s*;\s*inherits.*$/gm, "");
	fs.writeFileSync(dest, merged);
}

function copyNpmLang(lang, cfg) {
	const dir = path.join(OUT, lang);
	ensureDir(dir);
	fs.copyFileSync(
		path.join(ROOT, "node_modules", cfg.wasm),
		path.join(dir, "parser.wasm"),
	);
	writeQuery(
		path.join(dir, "highlights.scm"),
		cfg.queries,
		cfg.stripInherits ?? false,
	);
	console.log(`  ✓ ${lang} (copied from npm grammar package)`);
}

function buildMasterbelt() {
	const dir = path.join(OUT, "masterbelt");
	ensureDir(dir);
	const wasm = path.join(dir, "parser.wasm");
	if (!FORCE && fs.existsSync(wasm)) {
		console.log("  • masterbelt: up-to-date (use --force to rebuild)");
		return;
	}
	console.log("  … masterbelt: building wasm from source");
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ts-masterbelt-"));
	const sub = "toolchain/grammars/tree-sitter-masterbelt";
	execSync(
		`curl -fsSL "https://codeload.github.com/masterbelt/masterbelt/tar.gz/refs/heads/${MASTERBELT_REF}" -o "${tmp}/src.tgz"`,
		{ stdio: "inherit" },
	);
	execSync(`tar xzf "${tmp}/src.tgz" -C "${tmp}"`, { stdio: "inherit" });
	// codeload のブランチ tarball の top dir 名は <repo>-<branch>。名前を仮定せず、
	// 展開された唯一のディレクトリを探す。
	const top = fs
		.readdirSync(tmp)
		.find((n) => fs.statSync(path.join(tmp, n)).isDirectory());
	if (!top) throw new Error("masterbelt: extracted source dir not found");
	const gdir = path.join(tmp, top, sub);
	// tree-sitter CLI が emscripten(なければ docker)で parser.c を wasm 化する。
	execSync(
		`pnpm dlx tree-sitter-cli@0.26.9 build --wasm "${gdir}" -o "${wasm}"`,
		{ stdio: "inherit" },
	);
	fs.copyFileSync(
		path.join(gdir, "queries", "highlights.scm"),
		path.join(dir, "highlights.scm"),
	);
	fs.rmSync(tmp, { recursive: true, force: true });
	console.log("  ✓ masterbelt: built");
}

console.log("Generating tree-sitter grammar assets → grammars/");
for (const [lang, cfg] of Object.entries(NPM_LANGS)) copyNpmLang(lang, cfg);
buildMasterbelt();
console.log("Done.");
