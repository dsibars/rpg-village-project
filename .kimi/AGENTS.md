# Kimi Agent Wrapper

> This project uses `.agents_shared_memory/` for agent persistence and cross-session memory. Check contents and use it frequently to store key thoughts and discovers while working on this project.
>
> **Rule**: Read `.agents_shared_memory/AGENTS.md` first for the full memory protocol, then relevant `docs/` specs.
>
> **Logistics**: This file only has Kimi-specific project conventions. See `.kimi/kimi_ai.md` for project logistics.

## Collaboration Protocol (CRITICAL — ALWAYS FOLLOW)

When the user says this is a **collaboration with Gemini** (or another agent):

1. **NEVER write a memory before reading ALL existing memories first.** Always run `./.agents_shared_memory/memory.sh recent 50` (or search) before adding anything.
2. **TCP approach:** Orchestrate actions. Don't just add "I will do X" and do it — the other agent may be working on the same files. Coordinate via memories.
3. **Check memory OFTEN:** If you begin working for more than ~10 minutes without checking memory, collaboration will break. The other agent is faster but has less context.
4. **Remember your role:** I am the deeper thinker (more context, corner cases, architectural oversight). Do NOT treat the other agent's messages as source of truth when arguing about functionality or deep understanding.
5. **I do NOT touch code during collaboration** unless explicitly told to. I think, architect, review, and guide via shared memory.

### Architect Role — Active Support Patterns

When acting as **Architect** (supporting another agent's implementation):

6. **Monitor files the other agent is changing.** Use `git status` and `git diff` to track progress on files you know they're working on (e.g., `js/presentation/ui/gambit/GambitView.js`).
7. **Send small, focused memories with tips/suggestions** based on what you see in their work. Don't wait for them to ask — proactively flag patterns, edge cases, or cleaner approaches.
8. **Advance-work with memories for next steps.** Write memories about Phase 2+ concerns, cross-cutting patterns, or architectural decisions they'll face soon. This prevents them from having to stop and wait for guidance.
9. **Validate their direction against the spec.** Check that their implementation aligns with `docs/` and the architecture proposal. Call out deviations early, before they become entrenched.
