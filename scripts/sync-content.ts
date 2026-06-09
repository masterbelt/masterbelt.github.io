/**
 * 外部リポジトリの Markdown を content/external/** に同期する（将来実装）。
 *
 * content.sources.json を読み、各 source を syncRemoteSource で取得する想定。
 * Velite が content/** を走査する前（= next build の前段）に実行する。
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
	type RemoteSource,
	syncRemoteSource,
} from "../src/lib/content/loaders/remote-git.ts";

interface SourcesFile {
	sources: RemoteSource[];
}

async function main() {
	const configUrl = new URL("../content.sources.json", import.meta.url);
	const { sources } = JSON.parse(
		await readFile(fileURLToPath(configUrl), "utf8"),
	) as SourcesFile;

	for (const source of sources) {
		await syncRemoteSource(source);
	}
	console.log(`synced ${sources.length} external source(s)`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
