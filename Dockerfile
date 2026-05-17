FROM node:20-slim AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun

# Install all dependencies (including devDeps for build)
COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --ignore-scripts

# Copy source
COPY . .

# Build renderer (no Electron needed) and server bundle
RUN bun run build:renderer:web
RUN node scripts/build-server.mjs

# ---- Runtime image ----
FROM oven/bun:latest AS runtime
WORKDIR /app

# Install Node.js + global CLI agents that AionUi can auto-detect:
#   - @anthropic-ai/claude-code  (Claude Code, uses Claude Max OAuth subscription)
#   - @openai/codex             (Codex, uses ChatGPT Plus OAuth subscription)
#   - @google/gemini-cli         (Gemini, uses Google account OAuth)
# This makes them available as Local Agents in AionUi's Agents tab.
RUN apt-get update && apt-get install -y --no-install-recommends \
        nodejs npm ca-certificates curl git \
    && npm install -g \
        @anthropic-ai/claude-code \
        @openai/codex \
        @google/gemini-cli \
    && npm cache clean --force \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy only build artifacts and production deps
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/out/renderer ./out/renderer
COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --production --ignore-scripts

# Entrypoint that symlinks Claude/Codex/Gemini config dirs to /data so OAuth
# credentials survive container redeploys. Without this, every redeploy wipes
# ~/.claude, ~/.codex, ~/.config/gemini and you have to re-OAuth.
COPY <<'ENTRYPOINT_EOF' /usr/local/bin/aionui-entrypoint.sh
#!/bin/sh
set -e
mkdir -p /data/agents/.claude /data/agents/.codex /data/agents/.config/gemini /data/agents/.config /data/agents/.gemini
# Make $HOME point at /data/agents so all per-agent state persists
export HOME=/data/agents
# Symlinks for tools that hard-code $HOME-relative paths
mkdir -p /root || true
[ -L /root/.claude ] || { rm -rf /root/.claude 2>/dev/null || true; ln -sf /data/agents/.claude /root/.claude; }
[ -L /root/.codex ] || { rm -rf /root/.codex 2>/dev/null || true; ln -sf /data/agents/.codex /root/.codex; }
[ -L /root/.gemini ] || { rm -rf /root/.gemini 2>/dev/null || true; ln -sf /data/agents/.gemini /root/.gemini; }
exec "$@"
ENTRYPOINT_EOF
RUN chmod +x /usr/local/bin/aionui-entrypoint.sh

ENV PORT=3000
ENV NODE_ENV=production
ENV ALLOW_REMOTE=true
ENV DATA_DIR=/data

# SQLite data volume — mount with: -v $(pwd)/data:/data
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/aionui-entrypoint.sh"]
CMD ["bun", "dist-server/server.mjs"]
