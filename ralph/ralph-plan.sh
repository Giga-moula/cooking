#!/bin/bash
#
# Ralph Plan - Phase 1: Product Brain
# Explore codebase and generate feature roadmap
#
# Usage: ./ralph-plan.sh [OPTIONS]
#   -v, --verbose    Mode verbose
#   -h, --help       Afficher l'aide
#

set -e

VERBOSE=false
RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$RALPH_DIR/.." && pwd)"
LOG_DIR="$RALPH_DIR/logs"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

show_help() {
    echo "Ralph Plan - Phase 1: Product Brain"
    echo ""
    echo "Usage: ./ralph-plan.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --verbose    Mode verbose"
    echo "  -h, --help       Afficher l'aide"
    echo ""
    echo "Ce script lance Claude en mode 'Product Brain' pour:"
    echo "  1. Explorer le codebase"
    echo "  2. Identifier des features potentielles"
    echo "  3. Générer des user stories atomiques"
    echo ""
    echo "Output:"
    echo "  - ralph/roadmap.md  : Description des features"
    echo "  - ralph/prd.json    : Stories au format JSON"
    echo ""
    echo "Workflow:"
    echo "  1. Lancer ./ralph-plan.sh"
    echo "  2. Reviewer roadmap.md et prd.json"
    echo "  3. Mettre 'approved: true' sur les stories validées"
    echo "  4. Lancer ./ralph.sh pour l'exécution"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    case $level in
        INFO)  echo -e "${BLUE}[$timestamp]${NC} $message" ;;
        OK)    echo -e "${GREEN}[$timestamp]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[$timestamp]${NC} $message" ;;
        ERROR) echo -e "${RED}[$timestamp]${NC} $message" ;;
        PHASE) echo -e "${CYAN}[$timestamp]${NC} $message" ;;
    esac
}

# Créer dossier logs
mkdir -p "$LOG_DIR"

# Vérifier que plan_prompt.md existe
if [ ! -f "$RALPH_DIR/plan_prompt.md" ]; then
    log ERROR "Fichier manquant: plan_prompt.md"
    exit 1
fi

log PHASE "=========================================="
log PHASE "   RALPH PLAN - Phase 1: Product Brain"
log PHASE "=========================================="
echo ""

log INFO "Projet: $PROJECT_ROOT"
log INFO "Lancement de l'analyse du codebase..."
echo ""

timestamp=$(date +"%Y%m%d_%H%M%S")
log_file="$LOG_DIR/plan_${timestamp}.log"

# Construire le prompt
prompt="$(cat "$RALPH_DIR/plan_prompt.md")

---
## Project Root
$PROJECT_ROOT

---
## Instructions
1. Explore the codebase at $PROJECT_ROOT
2. Analyze the project structure, code quality, and opportunities
3. Generate a roadmap with features and user stories
4. Write output to:
   - ralph/roadmap.md (human-readable)
   - ralph/prd.json (machine-readable)
5. End with PLANNING_COMPLETE"

if [ "$VERBOSE" = true ]; then
    echo "--- Prompt ---"
    echo "$prompt"
    echo "--- Fin prompt ---"
fi

log INFO "Appel de Claude (Product Brain mode)..."
log INFO "Cela peut prendre quelques minutes..."
echo ""

# Appeler Claude
cd "$PROJECT_ROOT"
output=$(claude -p --dangerously-skip-permissions "$prompt" 2>&1) || true

# Sauvegarder le log
{
    echo "=== Ralph Plan Session ==="
    echo "Timestamp: $timestamp"
    echo "Project: $PROJECT_ROOT"
    echo ""
    echo "=== Prompt ==="
    echo "$prompt"
    echo ""
    echo "=== Output ==="
    echo "$output"
} >> "$log_file"

if [ "$VERBOSE" = true ]; then
    echo "--- Output Claude ---"
    echo "$output"
    echo "--- Fin output ---"
fi

# Vérifier si la planification est terminée
if echo "$output" | grep -q "PLANNING_COMPLETE"; then
    log OK "=========================================="
    log OK "   Planification terminée!"
    log OK "=========================================="
    echo ""
    log INFO "Fichiers générés:"

    if [ -f "$RALPH_DIR/roadmap.md" ]; then
        log OK "  ✓ ralph/roadmap.md"
    else
        log WARN "  ✗ ralph/roadmap.md (non créé)"
    fi

    if [ -f "$RALPH_DIR/prd.json" ]; then
        log OK "  ✓ ralph/prd.json"

        # Compter les stories
        if command -v jq &> /dev/null; then
            total=$(jq '.stories | length' "$RALPH_DIR/prd.json" 2>/dev/null || echo "?")
            log INFO "  → $total stories générées"
        fi
    else
        log WARN "  ✗ ralph/prd.json (non modifié)"
    fi

    echo ""
    log INFO "Prochaines étapes:"
    echo "  1. Ouvrir ralph/roadmap.md pour review"
    echo "  2. Ouvrir ralph/prd.json"
    echo "  3. Mettre 'approved: true' sur les stories validées"
    echo "  4. Lancer ./ralph.sh pour l'exécution"
    echo ""
    log INFO "Log complet: $log_file"
else
    log WARN "=========================================="
    log WARN "Planification peut-être incomplète"
    log WARN "Vérifiez le log: $log_file"
    log WARN "=========================================="
fi
