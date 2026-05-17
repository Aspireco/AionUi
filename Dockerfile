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

# Install Node.js 22 (required by openclaw) + global CLI agents that AionUi can auto-detect:
#   - @anthropic-ai/claude-code  (Claude Code, uses Claude Max OAuth subscription)
#   - @openai/codex             (Codex, uses ChatGPT Plus OAuth subscription)
#   - @google/gemini-cli         (Gemini, uses Google account OAuth)
#   - openclaw                   (OpenClaw, multi-agent CLI; fresh instance separate from Aspireco's openclaw service)
# Also install Python + hermes-agent (Nous Research Hermes Agent) so AionUi
# detects it locally. NOTE: this is a SEPARATE Hermes instance from the
# always-on hermes-agent Railway service — no shared MCPs/sessions/OAuth state.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg git \
        python3 python3-pip python3-venv pipx \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g \
        @anthropic-ai/claude-code \
        @openai/codex \
        @google/gemini-cli \
        openclaw \
    && npm cache clean --force \
    && PIPX_HOME=/opt/pipx PIPX_BIN_DIR=/usr/local/bin pipx install hermes-agent \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /root/.cache

# Copy only build artifacts and production deps
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/out/renderer ./out/renderer
COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --production --ignore-scripts

# Entrypoint that symlinks Claude/Codex/Gemini/Hermes/OpenClaw config dirs to
# /data so OAuth credentials + agent state survive container redeploys.
COPY <<'ENTRYPOINT_EOF' /usr/local/bin/aionui-entrypoint.sh
#!/bin/sh
set -e
mkdir -p \
    /data/agents/.claude \
    /data/agents/.codex \
    /data/agents/.gemini \
    /data/agents/.config/gemini \
    /data/agents/.config \
    /data/agents/.hermes \
    /data/agents/.openclaw
# Make $HOME point at /data/agents so all per-agent state persists
export HOME=/data/agents
# Symlinks for tools that hard-code $HOME-relative paths
mkdir -p /root || true
for d in .claude .codex .gemini .hermes .openclaw; do
  [ -L "/root/$d" ] || { rm -rf "/root/$d" 2>/dev/null || true; ln -sf "/data/agents/$d" "/root/$d"; }
done
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
