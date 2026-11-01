#!/bin/bash
# =====================================================================
# Package script: Creates a clean deployment-ready archive
# Usage: bash scripts/package-for-deploy.sh
# Output: /home/z/my-project/download/platform-deploy.tar.gz
# =====================================================================
set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_DIR="$PROJECT_DIR/download"
OUTPUT_FILE="$OUTPUT_DIR/platform-deploy.tar.gz"

mkdir -p "$OUTPUT_DIR"

echo "📦 Creating deployment package..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_DIR"

# Create the archive excluding dev-only artifacts
tar czf "$OUTPUT_FILE" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='db' \
  --exclude='dev.log' \
  --exclude='server.log' \
  --exclude='tests' \
  --exclude='examples' \
  --exclude='skills' \
  --exclude='.claude' \
  --exclude='.z-ai-config' \
  --exclude='.zscripts' \
  --exclude='download' \
  --exclude='scripts' \
  src/ \
  prisma/ \
  public/ \
  package.json \
  bun.lock \
  next.config.ts \
  tsconfig.json \
  tailwind.config.ts \
  postcss.config.mjs \
  components.json \
  eslint.config.mjs \
  .env.example \
  .gitignore \
  .dockerignore \
  Dockerfile \
  docker-compose.yml \
  Caddyfile \
  2>/dev/null

SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)
echo ""
echo "✅ Package created successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 File: $OUTPUT_FILE"
echo "📊 Size: $SIZE"
echo ""
echo "📋 Contents (first 20 entries):"
tar tzf "$OUTPUT_FILE" | head -20
echo "..."
TOTAL=$(tar tzf "$OUTPUT_FILE" | wc -l)
echo "Total entries: $TOTAL"
echo ""
echo "📚 Documentation files in download/:"
ls -la "$OUTPUT_DIR"/*.md 2>/dev/null || echo "  (none)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload platform-deploy.tar.gz to your server"
echo "   2. Extract: tar xzf platform-deploy.tar.gz"
echo "   3. Copy .env.example to .env and edit values"
echo "   4. Run: docker compose up -d --build"
echo "   5. Seed: docker compose exec app bunx tsx prisma/seed.ts"
echo "   6. Visit: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
