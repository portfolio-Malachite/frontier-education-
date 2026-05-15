#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_WORKTREE="$ROOT_DIR/.tmp-gh-pages-worktree"

bash "$ROOT_DIR/scripts/build-github-pages.sh"

if [ -d "$TMP_WORKTREE" ]; then
  git -C "$ROOT_DIR" worktree remove "$TMP_WORKTREE" --force
fi

if git -C "$ROOT_DIR" ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git -C "$ROOT_DIR" worktree add "$TMP_WORKTREE" gh-pages
else
  git -C "$ROOT_DIR" worktree add -b gh-pages "$TMP_WORKTREE"
fi

cleanup() {
  git -C "$ROOT_DIR" worktree remove "$TMP_WORKTREE" --force >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "$TMP_WORKTREE"
find . -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +
cp -R "$ROOT_DIR/dist/." "$TMP_WORKTREE/"
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "No gh-pages changes to publish."
else
  git commit -m "Deploy GitHub Pages"
fi

git push -u origin gh-pages

echo "GitHub Pages branch updated: gh-pages"
