#!/bin/bash
# Agent Shared Memory System — SQLite FTS5 wrapper with Temporal Hash History
#
# USAGE:
#   ./.agents_shared_memory/memory.sh add <topic> <tags> <summary> <details> [files]
#   ./.agents_shared_memory/memory.sh search <query> [limit] [hash_filter]
#   ./.agents_shared_memory/memory.sh pm-search <pm_type> <hash_or_keyword>
#   ./.agents_shared_memory/memory.sh pm-compare <pm_type> <hash1> <hash2>
#   ./.agents_shared_memory/memory.sh hash-history [limit]
#   ./.agents_shared_memory/memory.sh hash-at <timestamp>
#   ./.agents_shared_memory/memory.sh recent [limit]
#   ./.agents_shared_memory/memory.sh tags
#
# PM TYPES (enum):
#   pm_system_map, pm_player_arc, pm_health_check
#
# HASH KEYWORDS for pm-search:
#   current   → latest hash from .agents_shared_memory/docs_hash
#   previous  → second-to-last hash from history
#
# docs_hash: stored hash of docs/ folder at memory creation time.
# Compared against .agents_shared_memory/docs_hash to detect stale PM knowledge.
# History in .agents_shared_memory/docs_hash_history enables temporal queries.

DB="$(dirname "$0")/memory.db"
DOCS_HASH_FILE="$(dirname "$0")/docs_hash"
HASH_HISTORY_FILE="$(dirname "$0")/docs_hash_history"

PM_TYPES="pm_system_map pm_player_arc pm_health_check"

# --- Helpers ---

sql_escape() {
    printf "%s" "$1" | sed "s/'/''/g"
}

get_current_docs_hash() {
    if [ -f "$DOCS_HASH_FILE" ]; then
        cat "$DOCS_HASH_FILE"
    else
        echo "none"
    fi
}

get_previous_docs_hash() {
    if [ -f "$HASH_HISTORY_FILE" ]; then
        tail -2 "$HASH_HISTORY_FILE" | head -1 | awk '{print $2}'
    else
        echo "none"
    fi
}

resolve_hash_keyword() {
    local keyword="$1"
    case "$keyword" in
        current)
            get_current_docs_hash
            ;;
        previous)
            get_previous_docs_hash
            ;;
        *)
            echo "$keyword"
            ;;
    esac
}

is_valid_pm_type() {
    local t="$1"
    for valid in $PM_TYPES; do
        if [ "$t" = "$valid" ]; then
            return 0
        fi
    done
    return 1
}

usage() {
    cat <<'EOF'
Usage:
  memory.sh add <topic> <tags> <summary> <details> [files] [assumptions]
  memory.sh search <query> [limit] [hashes: 1-5, all, or specific_hash]
  memory.sh pm-search <pm_type> <hash|current|previous>
  memory.sh pm-compare <pm_type> <hash1> <hash2>
  memory.sh hash-history [limit]
  memory.sh hash-at <timestamp>
  memory.sh recent [limit] [hashes: 1-5, all, or specific_hash]
  memory.sh tags

Examples:
  memory.sh add magic_circle_v2 "ux,bug" "Tier dial bug" "Value placeholder leaks" "js/presentation/ui/magic_circle/MagicCircleViewV2.js" "- Assumed rotation state needs preservation"
  memory.sh search "tier dial" 5
  memory.sh pm-search pm_system_map current
  memory.sh pm-compare pm_system_map 25f4d647277d5c156d60dacdd666fa66 1669e19c9012e2261c2800a773ca40fa
  memory.sh hash-history 10
  memory.sh hash-at 2026-05-25T01:00:00
EOF
    exit 1
}

# --- Commands ---

cmd_add() {
    local topic="$1"
    local tags="$2"
    local summary="$3"
    local details="$4"
    local files="${5:-}"
    local assumptions="${6:-}"
    local docs_hash="$(get_current_docs_hash)"
    local ts
    ts=$(date -Iseconds)

    if ! [[ "$topic" =~ ^[a-z0-9_]+$ ]]; then
        echo "ERROR: Topic must be snake_case (e.g., combat_bug_fix). No spaces or special characters." >&2
        exit 1
    fi

    if [[ "$tags" == *" "* ]]; then
        echo "ERROR: Tags must be comma-separated without spaces (e.g., ui,bug,refactor)." >&2
        exit 1
    fi

    if [ -n "$files" ]; then
        IFS=',' read -ra FILE_ARR <<< "$files"
        for f in "${FILE_ARR[@]}"; do
            f=$(echo "$f" | xargs)
            if [ ! -f "$f" ]; then
                echo "ERROR: File '$f' does not exist! Please use valid file paths relative to root." >&2
                exit 1
            fi
        done
    fi

    if ! is_valid_pm_type "$topic"; then
        if [ "${#details}" -gt 2000 ]; then
            echo "ERROR: Details exceed 2000 characters. Synthesize your text." >&2
            exit 1
        fi
    fi

    if [ -n "$assumptions" ]; then
        details="$details

**Implicit Assumptions:**
$assumptions"
    fi

    sqlite3 "$DB" "INSERT INTO memories(topic, tags, summary, details, timestamp, files, docs_hash) VALUES ('$(sql_escape "$topic")', '$(sql_escape "$tags")', '$(sql_escape "$summary")', '$(sql_escape "$details")', '$(sql_escape "$ts")', '$(sql_escape "$files")', '$(sql_escape "$docs_hash")');"

    IFS=',' read -ra TAGS_ARR <<< "$tags"
    for tag in "${TAGS_ARR[@]}"; do
        tag=$(echo "$tag" | xargs)
        sqlite3 "$DB" "INSERT INTO tag_stats(tag, count) VALUES ('$(sql_escape "$tag")', 1) ON CONFLICT(tag) DO UPDATE SET count = count + 1;"
    done

    echo "✓ Memory added: $topic (hash: $docs_hash)"
}

cmd_search() {
    local query="$1"
    local limit="${2:-10}"
    local hash_filter="${3:-1}"

    local sql="SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories WHERE memories MATCH '$(sql_escape "$query")'"
    
    if [ "$hash_filter" != "all" ]; then
        if [[ "$hash_filter" =~ ^[0-9]+$ ]]; then
            local num_hashes="$hash_filter"
            [ "$num_hashes" -gt 5 ] && num_hashes=5
            
            local hashes=$( (cat "$HASH_HISTORY_FILE" 2>/dev/null | awk '{print $2}'; get_current_docs_hash) | tac | awk '!seen[$0]++' | head -n "$num_hashes" )
            
            local in_clause=""
            for h in $hashes; do
                in_clause="$in_clause'$(sql_escape "$h")',"
            done
            in_clause="${in_clause%,}"
            
            if [ -n "$in_clause" ]; then
                sql="$sql AND docs_hash IN ($in_clause)"
            fi
        else
            sql="$sql AND docs_hash = '$(sql_escape "$hash_filter")'"
        fi
    fi
    
    sql="$sql ORDER BY rank LIMIT $limit"

    sqlite3 "$DB" -header -json "$sql"
}

cmd_pm_search() {
    local pm_type="$1"
    local hash_arg="$2"
    local required_hash
    required_hash=$(resolve_hash_keyword "$hash_arg")

    if ! is_valid_pm_type "$pm_type"; then
        echo "ERROR: Invalid PM type '$pm_type'" >&2
        echo "Valid types: $PM_TYPES" >&2
        exit 1
    fi

    local fresh
    fresh=$(sqlite3 "$DB" -json "SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories WHERE topic = '$(sql_escape "$pm_type")' AND docs_hash = '$(sql_escape "$required_hash")' ORDER BY timestamp DESC LIMIT 1;")

    local last_known
    last_known=$(sqlite3 "$DB" -json "SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories WHERE topic = '$(sql_escape "$pm_type")' AND docs_hash != '$(sql_escape "$required_hash")' ORDER BY timestamp DESC LIMIT 1;")

    local fresh_val="null"
    local last_val="null"

    if [ "$fresh" != "[]" ] && [ -n "$fresh" ]; then
        fresh_val="$fresh"
    fi
    if [ "$last_known" != "[]" ] && [ -n "$last_known" ]; then
        last_val="$last_known"
    fi

    printf '{"fresh":%s,"last_known":%s,"queried_hash":"%s"}\n' "$fresh_val" "$last_val" "$required_hash"
}

cmd_pm_compare() {
    local pm_type="$1"
    local hash1="$2"
    local hash2="$3"

    if ! is_valid_pm_type "$pm_type"; then
        echo "ERROR: Invalid PM type '$pm_type'" >&2
        echo "Valid types: $PM_TYPES" >&2
        exit 1
    fi

    local entry1
    entry1=$(sqlite3 "$DB" -json "SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories WHERE topic = '$(sql_escape "$pm_type")' AND docs_hash = '$(sql_escape "$hash1")' ORDER BY timestamp DESC LIMIT 1;")

    local entry2
    entry2=$(sqlite3 "$DB" -json "SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories WHERE topic = '$(sql_escape "$pm_type")' AND docs_hash = '$(sql_escape "$hash2")' ORDER BY timestamp DESC LIMIT 1;")

    local val1="null"
    local val2="null"

    if [ "$entry1" != "[]" ] && [ -n "$entry1" ]; then
        val1="$entry1"
    fi
    if [ "$entry2" != "[]" ] && [ -n "$entry2" ]; then
        val2="$entry2"
    fi

    printf '{"hash1":"%s","entry1":%s,"hash2":"%s","entry2":%s}\n' "$hash1" "$val1" "$hash2" "$val2"
}

cmd_hash_history() {
    local limit="${1:-10}"
    if [ -f "$HASH_HISTORY_FILE" ]; then
        tail -n "$limit" "$HASH_HISTORY_FILE" | awk '{print $1 "  " $2}'
    else
        echo "No hash history found."
    fi
}

cmd_hash_at() {
    local target_ts="$1"
    if [ ! -f "$HASH_HISTORY_FILE" ]; then
        echo "No hash history found."
        exit 1
    fi

    # Find the entry with timestamp <= target, closest to target
    local result
    result=$(awk -v target="$target_ts" '
        $1 <= target { best_ts=$1; best_hash=$2 }
        END { if (best_ts) print best_ts, best_hash }
    ' "$HASH_HISTORY_FILE")

    if [ -n "$result" ]; then
        echo "$result"
    else
        # If target is before all entries, return the earliest
        head -1 "$HASH_HISTORY_FILE"
    fi
}

cmd_recent() {
    local limit="${1:-10}"
    local hash_filter="${2:-1}"

    local sql="SELECT rowid, topic, tags, summary, details, timestamp, files, docs_hash FROM memories"
    local where_clause=""
    
    if [ "$hash_filter" != "all" ]; then
        if [[ "$hash_filter" =~ ^[0-9]+$ ]]; then
            local num_hashes="$hash_filter"
            [ "$num_hashes" -gt 5 ] && num_hashes=5
            
            local hashes=$( (cat "$HASH_HISTORY_FILE" 2>/dev/null | awk '{print $2}'; get_current_docs_hash) | tac | awk '!seen[$0]++' | head -n "$num_hashes" )
            
            local in_clause=""
            for h in $hashes; do
                in_clause="$in_clause'$(sql_escape "$h")',"
            done
            in_clause="${in_clause%,}"
            
            if [ -n "$in_clause" ]; then
                where_clause=" WHERE docs_hash IN ($in_clause)"
            fi
        else
            where_clause=" WHERE docs_hash = '$(sql_escape "$hash_filter")'"
        fi
    fi
    
    sql="$sql$where_clause ORDER BY timestamp DESC LIMIT $limit;"
    sqlite3 "$DB" -header -json "$sql"
}

cmd_tags() {
    sqlite3 "$DB" -header "SELECT tag, count FROM tag_stats ORDER BY count DESC;"
}

# --- Dispatch ---

case "$1" in
    add)
        shift
        [ $# -lt 4 ] && usage
        cmd_add "$@"
        ;;
    search)
        shift
        [ $# -lt 1 ] && usage
        cmd_search "$@"
        ;;
    pm-search)
        shift
        [ $# -lt 2 ] && usage
        cmd_pm_search "$@"
        ;;
    pm-compare)
        shift
        [ $# -lt 3 ] && usage
        cmd_pm_compare "$@"
        ;;
    hash-history)
        shift
        cmd_hash_history "$@"
        ;;
    hash-at)
        shift
        [ $# -lt 1 ] && usage
        cmd_hash_at "$@"
        ;;
    recent)
        shift
        cmd_recent "$@"
        ;;
    tags)
        cmd_tags
        ;;
    *)
        usage
        ;;
esac
