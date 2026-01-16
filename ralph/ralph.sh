#!/bin/bash
#
# Ralph - Agent Autonome (Optimisé)
# Script d'orchestration pour Claude - Version économe en tokens
#
# Usage: ./ralph.sh [OPTIONS]
#   -n, --max-iterations N   Nombre max d'itérations (défaut: 15)
#   -p, --progress-lines N   Lignes de progress.txt à envoyer (défaut: 25)
#   -v, --verbose            Mode verbose
#   -h, --help               Afficher l'aide
#

set -e

# Configuration par défaut (optimisée pour économie de tokens)
MAX_ITERATIONS=15
PROGRESS_LINES=25
VERBOSE=false
RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$RALPH_DIR/logs"
PROJECT_ROOT="$(cd "$RALPH_DIR/.." && pwd)"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo "Ralph - Agent Autonome (Optimisé)"
    echo ""
    echo "Usage: ./ralph.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --max-iterations N   Nombre max d'itérations (défaut: 15)"
    echo "  -p, --progress-lines N   Lignes de progress à envoyer (défaut: 25)"
    echo "  -v, --verbose            Mode verbose"
    echo "  -h, --help               Afficher l'aide"
    echo ""
    echo "Fichiers requis dans ralph/:"
    echo "  - prompt.md    Instructions pour l'agent"
    echo "  - PRD.md       Document produit (seul le header est envoyé)"
    echo "  - prd.json     Liste des stories (seule la story active est envoyée)"
    echo "  - progress.txt Mémoire persistante (seules les N dernières lignes)"
    echo ""
    echo "Workflow 2 phases:"
    echo "  1. ./ralph-plan.sh  → Claude génère les stories (Product Brain)"
    echo "  2. Review + mettre 'approved: true' sur les stories validées"
    echo "  3. ./ralph.sh       → Ralph exécute les stories approuvées"
    echo ""
    echo "Filtrage stories:"
    echo "  - Seules les stories avec approved=true ET done=false sont traitées"
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        -p|--progress-lines)
            PROGRESS_LINES="$2"
            shift 2
            ;;
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

# Vérifier que les fichiers requis existent
check_files() {
    local missing=false
    for file in prompt.md PRD.md prd.json progress.txt; do
        if [ ! -f "$RALPH_DIR/$file" ]; then
            echo -e "${RED}Fichier manquant: $file${NC}"
            missing=true
        fi
    done
    if [ "$missing" = true ]; then
        exit 1
    fi
}

# Fonction de log
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    case $level in
        INFO)  echo -e "${BLUE}[$timestamp]${NC} $message" ;;
        OK)    echo -e "${GREEN}[$timestamp]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[$timestamp]${NC} $message" ;;
        ERROR) echo -e "${RED}[$timestamp]${NC} $message" ;;
    esac
}

# Créer le dossier de logs
mkdir -p "$LOG_DIR"

# Vérifier les fichiers
check_files

# Lire la branche depuis prd.json
BRANCH=$(grep -o '"branch"[[:space:]]*:[[:space:]]*"[^"]*"' "$RALPH_DIR/prd.json" | cut -d'"' -f4)
if [ -z "$BRANCH" ]; then
    BRANCH="feat/ralph"
    log WARN "Branche non définie dans prd.json, utilisation de: $BRANCH"
fi

# Aller à la racine du projet
cd "$PROJECT_ROOT"

# S'assurer d'être sur la bonne branche
log INFO "Vérification de la branche git..."
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
    log OK "Branche $BRANCH sélectionnée"
else
    git checkout -b "$BRANCH"
    log OK "Branche $BRANCH créée"
fi

# Fonction pour extraire la story active (première où approved=true ET done=false)
get_active_story() {
    # Utilise jq si disponible, sinon fallback grep/sed
    if command -v jq &> /dev/null; then
        local story=$(jq -r '
            .stories[] | select(.approved == true and .done == false) |
            "Story #\(.id): \(.title)\n\nTask:\n\(.prompt)"
        ' "$RALPH_DIR/prd.json" | head -n 20)

        if [ -z "$story" ]; then
            echo "ALL_DONE"
        else
            echo "$story"
        fi
    else
        # Fallback sans jq - vérifie approved ET done
        # Note: moins fiable, recommande d'installer jq
        log WARN "jq non installé - filtrage approved limité"
        if grep -q '"done"[[:space:]]*:[[:space:]]*false' "$RALPH_DIR/prd.json"; then
            grep -A5 '"done"[[:space:]]*:[[:space:]]*false' "$RALPH_DIR/prd.json" | head -n 10
        else
            echo "ALL_DONE"
        fi
    fi
}

# Fonction pour compter les stories restantes (approved=true ET done=false)
count_remaining_stories() {
    if command -v jq &> /dev/null; then
        jq '[.stories[] | select(.approved == true and .done == false)] | length' "$RALPH_DIR/prd.json"
    else
        # Fallback approximatif
        grep -c '"done"[[:space:]]*:[[:space:]]*false' "$RALPH_DIR/prd.json" || echo "0"
    fi
}

# Fonction pour compter les stories en attente d'approbation
count_pending_approval() {
    if command -v jq &> /dev/null; then
        jq '[.stories[] | select(.approved == false and .done == false)] | length' "$RALPH_DIR/prd.json"
    else
        echo "?"
    fi
}

# Boucle principale
iter=0
PENDING=$(count_pending_approval)
APPROVED=$(count_remaining_stories)

log INFO "=========================================="
log INFO "   RALPH - Phase 2: Exécution"
log INFO "=========================================="
log INFO "Stories approuvées à faire: $APPROVED"
log INFO "Stories en attente d'approbation: $PENDING"
log INFO "Max itérations: $MAX_ITERATIONS"
echo "=========================================="

# Vérifier qu'il y a des stories approuvées
if [ "$APPROVED" = "0" ]; then
    log WARN "Aucune story approuvée à exécuter!"
    log INFO "Pour approuver des stories:"
    echo "  1. Ouvrir ralph/prd.json"
    echo "  2. Mettre \"approved\": true sur les stories à exécuter"
    echo "  3. Relancer ./ralph.sh"
    if [ "$PENDING" != "0" ] && [ "$PENDING" != "?" ]; then
        log INFO "$PENDING stories en attente d'approbation"
    fi
    exit 0
fi

while [ $iter -lt $MAX_ITERATIONS ]; do
    iter=$((iter + 1))
    timestamp=$(date +"%Y%m%d_%H%M%S")
    log_file="$LOG_DIR/iteration_${iter}_${timestamp}.log"

    # Extraire les données optimisées
    ACTIVE_STORY=$(get_active_story)
    REMAINING=$(count_remaining_stories)

    # Vérifier si toutes les stories approuvées sont terminées
    if [ "$ACTIVE_STORY" = "ALL_DONE" ] || [ "$REMAINING" = "0" ]; then
        PENDING=$(count_pending_approval)
        log OK "=========================================="
        log OK "Toutes les stories approuvées sont terminées!"
        log OK "Ralph a complété $((iter - 1)) itérations"
        if [ "$PENDING" != "0" ] && [ "$PENDING" != "?" ]; then
            log INFO "$PENDING stories en attente d'approbation"
        fi
        log OK "=========================================="
        echo "COMPLETE" >> "$log_file"
        exit 0
    fi

    log INFO "=== Itération $iter/$MAX_ITERATIONS === ($REMAINING stories approuvées restantes)"

    # Extraire le résumé PRD (15 premières lignes)
    PRD_SUMMARY=$(head -n 15 "$RALPH_DIR/PRD.md")

    # Extraire les dernières lignes de progress
    PROGRESS_TAIL=$(tail -n "$PROGRESS_LINES" "$RALPH_DIR/progress.txt")

    # Construire le contexte MINIMAL
    context="$(cat "$RALPH_DIR/prompt.md")

---
## Feature Context (PRD summary)
$PRD_SUMMARY

---
## Current Story to Implement
$ACTIVE_STORY

---
## Recent Progress (last $PROGRESS_LINES lines)
$PROGRESS_TAIL

---
## Status
Stories remaining: $REMAINING
Branch: $BRANCH"

    # Compter les tokens approximatifs (1 token ≈ 4 chars)
    token_estimate=$(( ${#context} / 4 ))
    log INFO "Contexte: ~$token_estimate tokens"

    # Appeler Claude
    log INFO "Appel de Claude..."

    if [ "$VERBOSE" = true ]; then
        echo "--- Contexte envoyé ---"
        echo "$context"
        echo "--- Fin du contexte ---"
    fi

    # Exécuter Claude avec --dangerously-skip-permissions pour autonomie
    output=$(claude -p --dangerously-skip-permissions "$context" 2>&1) || true

    # Sauvegarder dans le log
    {
        echo "=== Iteration $iter ==="
        echo "Timestamp: $timestamp"
        echo "Tokens estimés: ~$token_estimate"
        echo "Stories restantes: $REMAINING"
        echo ""
        echo "=== Context Sent ==="
        echo "$context"
        echo ""
        echo "=== Output ==="
        echo "$output"
    } >> "$log_file"

    if [ "$VERBOSE" = true ]; then
        echo "--- Output Claude ---"
        echo "$output"
        echo "--- Fin output ---"
    fi

    # Vérifier si terminé (Claude dit COMPLETE)
    if echo "$output" | grep -q "COMPLETE"; then
        log OK "=========================================="
        log OK "Ralph a terminé toutes les tâches!"
        log OK "Logs disponibles dans: $LOG_DIR"
        log OK "=========================================="
        exit 0
    fi

    log OK "Itération $iter terminée"

    # Petite pause entre les itérations pour éviter le rate limiting
    sleep 2
done

log WARN "=========================================="
log WARN "Limite d'itérations atteinte ($MAX_ITERATIONS)"
log WARN "Stories restantes: $(count_remaining_stories)"
log WARN "Consultez les logs: $LOG_DIR"
log WARN "=========================================="
exit 1
