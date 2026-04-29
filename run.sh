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

PORT=8080
args=("$@")
for ((i=0; i<${#args[@]}; i++)); do
  if [[ "${args[i]}" == "--port" && $((i+1)) -lt ${#args[@]} ]]; then
    PORT="${args[i+1]}"
  fi
done
URL="http://localhost:$PORT"

(sleep 1.5 && (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || start "$URL" 2>/dev/null)) &

exec node dist/server/index.js "$@"
