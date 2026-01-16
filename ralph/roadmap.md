# Project Roadmap - Cooking Game

## Executive Summary

This document outlines a comprehensive improvement roadmap for the Phaser 3 cooperative cooking game. The analysis identified opportunities across code quality, performance, features, and user experience.

---

# Proposed Features

## Feature 1: Production Logging System
**Why**: 70+ console.log statements throughout codebase will pollute production logs and expose debug info
**Impact**: High
**Complexity**: Low

Replace all direct console.* calls with the existing Logger utility (`src/game/utils/Logger.ts`). This ensures debug logging respects NODE_ENV and can be easily toggled.

Files affected:
- ActionSoundManager.ts (12 statements)
- VoiceManager.ts (28 statements)
- CraftActions.ts (8 statements)
- PlayerManager.ts (4 statements)
- Preloader.ts (4 statements)
- Game.ts (2 statements)
- TutorialGame.ts (2 statements)
- OvenManager.ts (1 statement)
- CasseroleManager.ts (1 statement)
- InteractionSystem.ts (2 statements)
- OrderDisplayManager.ts (1 statement)
- CommunicationManager.ts (1 statement)

---

## Feature 2: Memory Leak Prevention
**Why**: Multiple managers lack proper cleanup, causing memory leaks on scene transitions
**Impact**: High
**Complexity**: Medium

### Issues:
1. Game.ts shutdown() only cleans 4 of 13+ managers
2. Shop.ts keyboard listeners never removed
3. Sound instances not destroyed after playback
4. VoiceManager random timer can leak

---

## Feature 3: Complete Upgrade System
**Why**: Only 3 of 6 defined upgrade types are implemented - players missing content
**Impact**: High
**Complexity**: Medium

### Current State:
- SPEED_BOOST: Implemented
- EXTRA_TIME: Implemented
- OVEN_SPEED: Implemented
- MAX_ORDERS: Not implemented
- RECIPE_UNLOCK: Not implemented
- SCORE_MULTIPLIER: Not implemented

---

## Feature 4: Sound System Refactoring
**Why**: Duplicate sound logic across managers, no pooling, potential memory issues
**Impact**: Medium
**Complexity**: Medium

Create shared SoundUtils and implement sound pooling to:
- Reduce code duplication between ActionSoundManager and VoiceManager
- Prevent sound instance accumulation
- Ensure proper cleanup

---

## Feature 5: Accessibility Improvements
**Why**: No accessibility labels, missing keyboard hints, no text fallbacks
**Impact**: Medium
**Complexity**: Low

Add:
- ARIA-equivalent labels for UI elements
- Visual keyboard control indicators in Shop
- Text fallbacks for icon-only displays (hearts, timer)

---

## Feature 6: Error Handling & Type Safety
**Why**: Missing null checks, untyped parameters, no error recovery
**Impact**: Medium
**Complexity**: Medium

### Issues:
- CraftActions uses `any` type for critical parameters
- InteractionSystem has 85+ nested conditions without null safety
- WaveManager errors are logged but not recovered from

---

## Feature 7: Tutorial Expansion
**Why**: Current tutorial misses key game mechanics
**Impact**: Medium
**Complexity**: Medium

Missing coverage:
- Upgrade system / Shop mechanics
- Dash/speed boost
- Wave progression
- Communication counters
- Trash disposal

---

## Feature 8: Performance Optimization
**Why**: Expensive operations in update loops, no optimization for frequent operations
**Impact**: Medium
**Complexity**: Medium

### Opportunities:
- OvenManager: Throttle timer text updates (currently every frame)
- RecipeManager: Add memoization to findRecipe()
- Sound pooling to reduce instantiation overhead

---

# Priority Matrix

| Feature | Impact | Complexity | Priority |
|---------|--------|------------|----------|
| Production Logging | High | Low | P0 |
| Memory Leak Prevention | High | Medium | P0 |
| Complete Upgrade System | High | Medium | P1 |
| Sound System Refactoring | Medium | Medium | P1 |
| Error Handling & Type Safety | Medium | Medium | P2 |
| Accessibility | Medium | Low | P2 |
| Tutorial Expansion | Medium | Medium | P3 |
| Performance Optimization | Medium | Medium | P3 |

---

# Implementation Notes

## Patterns to Follow
- Manager architecture with dedicated classes per subsystem
- EventBus for inter-system communication
- TypeScript strict mode with interfaces
- Centralized configuration in GameConfig and Constants

## Conventions
- PascalCase for class files
- ALL_CAPS for constants
- Cleanup methods should mirror constructor setup

## Testing
- Manual testing via browser
- Scene transition testing for memory leaks
- Multi-player control testing

---

# Next Steps

See `prd.json` for machine-readable user stories that can be executed by an autonomous agent.
