# Agent Shared Memory Protocol

> **Framework-agnostic**: Any AI agent can use this system. See `.agents_shared_memory/README.md` for setup.

## Rule 1: General Memories
After every significant decision, bug fix, architecture change, or user preference revelation, run:
```bash
./.agents_shared_memory/memory.sh add <topic> <tags> <summary> <details> [files]
```

## Rule 2: PM Knowledge (Product Manager Context)
When the user asks for high-level project understanding, use `pm-search`. Trigger phrases include:
- "act as PM" / "be the Product Manager" / "Product Manager perspective"
- "understand the app" / "overview of the project" / "what is the game about"
- "PM view" / "from a PM perspective" / "as a product owner"
- Any question requiring CROSS-SYSTEM understanding (not isolated features)
- Balance questions, progression questions, "what happens when..." questions

### PM-Search Contract
```bash
./.agents_shared_memory/memory.sh pm-search <pm_type> $(cat .agents_shared_memory/docs_hash)
```

**pm_type enum:** `pm_system_map`, `pm_player_arc`, `pm_health_check`

| Type | What It Contains | Use When |
|------|-----------------|----------|
| `pm_system_map` | How ALL systems connect and feed each other. Village → Heroes → Combat → Explore → Inventory loop. | "How does X affect Y?", "What unlocks what?", "Where does gold come from?" |
| `pm_player_arc` | Day 1 to endgame progression. Unlock timing, power curves, resource economy, when players access systems. | "By day 30, will...?", "When does magic unlock?", "Is this too early/late?" |
| `pm_health_check` | Known issues, doc-code gaps, untested areas, balance risks, technical debt. | "What could break?", "Is this tested?", "What misalignments exist?" |

**Returns JSON:**
```json
{
  "fresh": { ... } | null,       // entry matching current docs hash
  "last_known": { ... } | null   // most recent entry with different hash
}
```

**Decision tree:**
- `fresh` exists → use it directly (specs haven't changed)
- `fresh` null, `last_known` exists → specs changed. Read the relevant docs, answer using fresh docs, then refresh the PM entry:
  ```bash
  ./.agents_shared_memory/memory.sh add <pm_type> "pm,..." "..." "..." [files]
  ```
- Both null → **First time generating PM knowledge for this category.** Read ALL relevant docs across systems, synthesize a holistic PM understanding (not feature silos), and create the PM entry. This is the foundation for all future sessions.

### Why 3 Entries (Not 8)
PM knowledge is HOLISTIC, not fragmented by feature. A Product Manager thinks in systems, interactions, and player experience — not "combat.md" and "heroes.md". These 3 entries capture cross-system understanding that isolated feature docs cannot.

### Shell Quoting Warning
When creating PM entries via `memory.sh add`, the `details` field is passed as a shell argument. **Do not use unescaped double quotes inside the text** — they will terminate the shell string and corrupt the data. Use single quotes or escape as `\"`.

### PM Memory Quality Standards (DO NOT BE LAZY)

A PM memory is NOT a summary. It is ANALYSIS. Before creating a PM entry, you MUST answer these questions by reading docs:

**For pm_system_map:**
- [ ] What is the CRITICAL PATH through the systems? (What must happen first?)
- [ ] What are the POSITIVE FEEDBACK LOOPS? (More X → more Y → more X)
- [ ] What are the NEGATIVE FEEDBACK LOOPS? (More X → less Y → less X)
- [ ] What is the BOTTLENECK resource that gates everything?
- [ ] What systems are ORPHANED? (They exist but don't meaningfully connect)
- [ ] What are the EMERGENT INTERACTIONS? (Two systems interacting in unintended ways)

**For pm_player_arc:**
- [ ] What does the player FEEL at each stage? (not just what they DO)
- [ ] Where are the MOTIVATION CLIFFS? (Where might players quit?)
- [ ] Is the POWER GROWTH linear, exponential, or stepped? Is that intentional?
- [ ] Does the difficulty curve OUTPACE player power growth at any point?
- [ ] What is the TIME-TO-MAGIC? (How long until the core hook is available?)
- [ ] What are the UNLOCK SURPRISES? (Things players discover unexpectedly)

**For pm_health_check:**
- [ ] What is in docs but NOT in code?
- [ ] What is in code but NOT in docs?
- [ ] What are the DOC-CODE CONTRACTIONS?
- [ ] What has NEVER BEEN TESTED together?
- [ ] What are the UNKNOWN UNKNOWNS? (Things we haven't even thought to document)
- [ ] What would a player EXPLOIT if they found it?

**If you cannot answer a hard cross-system question after reading the docs, that is valuable information.** Write it as a gap, risk, or uncertainty in the PM memory. Do NOT skip it because it's uncomfortable.

### Refresh Session Pattern (The "Closing Action")
When the user finishes a batch of spec/doc changes and says "refresh PM memories" or "update PM knowledge", treat this as the **Closing Action** for the design phase:

1. Query ALL 3 PM categories against current hash:
   ```bash
   for pm in pm_system_map pm_player_arc pm_health_check; do
     ./.agents_shared_memory/memory.sh pm-search $pm $(cat .agents_shared_memory/docs_hash)
   done
   ```
2. For each category where `fresh` is null: re-read the relevant docs, synthesize updated understanding, and create a new PM entry.
3. Apply the quality standards checklist above. Do not skip hard questions.
4. This session exists ONLY for refreshing PM knowledge. No feature work.

**Why this works:** The "read all docs" tax is paid once per spec-change cycle. Subsequent feature implementation sessions get instant PM context via matching hashes.
**The Delta Context:** By returning both `fresh` and `last_known`, the database shows you what the rules *were* versus what they *are now*. Analyzing this delta gives you the exact **design intent** behind the change.

### Makefile Integration
The Makefile regenerates `.agents_shared_memory/docs_hash` on every `make dev`, `make test`, `make build`, etc. If any `.md` file in `docs/` changed, the hash changes. PM memories store the hash from when they were created. A mismatch means specs changed → PM memory may be outdated.

### Time Machine Diagnostics (Git + Hash Synergy)
Because `docs_hash_history` logs the ISO-8601 timestamp whenever the specs hash changes, this memory system acts as a **Time Machine for Design Intent**.

If you discover a bug or strange code implementation committed in the past:
1. Run `git log` to find the exact timestamp of the suspect commit.
2. Run `./.agents_shared_memory/memory.sh hash-at <timestamp>` to retrieve the exact specs hash that was active at that millisecond.
3. Run `./.agents_shared_memory/memory.sh pm-search pm_system_map <historical_hash>` to load the exact PM mental model the agent was using when it wrote that code.
4. Run `./.agents_shared_memory/memory.sh pm-compare <pm_type> <hash_before> <hash_after>` to directly diff the design mental models around that commit.

This allows agents to diagnose if a bug was caused by bad code, or if the code was actually perfectly executing an experimental, outdated version of the game design!
