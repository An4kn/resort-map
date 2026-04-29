#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -d dist ] || [ ! -d public ]; then
  echo "Building project..."
  npm run build
fi

exec node dist/server/index.js "$@"
