#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Static site build output for GitHub Pages.
cp "$ROOT_DIR/index.html" "$DIST_DIR/"
cp "$ROOT_DIR/style.css" "$DIST_DIR/"
cp "$ROOT_DIR/script.js" "$DIST_DIR/"
cp "$ROOT_DIR/1735818025phpNfEsBH.jpg" "$DIST_DIR/"

cp -R "$ROOT_DIR/assets" "$DIST_DIR/assets"
cp -R "$ROOT_DIR/images" "$DIST_DIR/images"

# Avoid GitHub Pages Jekyll processing and preserve static paths exactly.
touch "$DIST_DIR/.nojekyll"

echo "Built GitHub Pages artifact at: $DIST_DIR"
