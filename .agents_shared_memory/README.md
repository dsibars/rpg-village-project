# Agent Shared Memory

A lightweight, filesystem-based memory system for AI agents collaborating on the RPG Village project.

## Quick Start

1. **Copy the template database:**
   ```bash
   cp .agents_shared_memory/memory.db.template .agents_shared_memory/memory.db
   ```

2. **Start using it:**
   ```bash
   ./.agents_shared_memory/memory.sh add "my_topic" "tag1,tag2" "Short summary" "Full details..."
   ./.agents_shared_memory/memory.sh search "combat balance"
   ./.agents_shared_memory/memory.sh recent
   ```

## What It Does

- **General memories**: Frequent entries about decisions, bugs, architecture changes. FTS5 full-text search.
- **PM Knowledge**: 3 holistic entries (`pm_system_map`, `pm_player_arc`, `pm_health_check`) that capture cross-system understanding. Hash-tagged for freshness.
- **Docs hash tracking**: Auto-generated on every `make` invocation. Detects when specs changed → PM knowledge may be stale.

## Files

| File | Purpose | In Git? |
|------|---------|---------|
| `memory.sh` | CLI interface | ✅ Yes |
| `AGENTS.md` | Full protocol spec | ✅ Yes |
| `memory.db.template` | Empty schema to copy from | ✅ Yes |
| `memory.db` | Live SQLite database | ❌ No (ignored) |
| `docs_hash` | Current docs fingerprint | ❌ No (ignored) |
| `docs_hash_history` | Rolling history (last 50) | ❌ No (ignored) |

## Agent-Specific Wrappers

- **Kimi**: See `.kimi/AGENTS.md` for Kimi-specific logistics.
