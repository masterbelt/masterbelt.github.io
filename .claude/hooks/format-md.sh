#!/usr/bin/env bash
# PostToolUse フック: Claude が Markdown を編集したら proseWrap:never で自動アンラップする。
# ソフトラップ（段落途中の改行）が二度と残らないようにするための機械的ガード。
# 失敗しても編集自体は妨げない（常に exit 0）。
set -uo pipefail

file="$(jq -r '.tool_input.file_path // empty' 2>/dev/null)"
case "$file" in
	*.md | *.markdown)
		[ -f "$file" ] && pnpm --silent exec prettier --write "$file" >/dev/null 2>&1
		;;
esac

exit 0
