# Gameplay and Systems Changes Overview

This document explains what was changed in your game, why those changes were made, and what design principles they illustrate. The goal is not just to “fix” things, but to make the game feel better to play and to help you reason about similar decisions in future projects.

Nothing here is meant as criticism. This is about taking something that already worked and making it more coherent, fair, and intentional.

---

## 1. Combat and Enemy Behavior

### What changed

Enemy attack ranges were significantly reduced and are now expressed in world units derived from the tile size instead of screen distance. Normal enemies can only hit at very close range, bosses have slightly longer reach, and the player’s melee reach is larger than both.

### Why this matters

Previously, enemies could damage the player from extremely far away, sometimes from near the edge of the screen. This made combat feel unfair and also trivialized strategy: the optimal play was to spam attacks as soon as anything appeared on screen.

By tying attack ranges to tile-based world units, combat now matches what the sprites and animations visually suggest. You must close distance to fight, bosses are dangerous because of pressure and patterns rather than off-screen damage, and positioning actually matters.

This change illustrates a core game design principle: combat math should be grounded in the physical language of the game world, not in screen or camera dimensions.

---

## 2. Local AI Instead of Cloud AI for Gameplay

### What changed

All cloud-based AI was removed from core gameplay. Enemy decisions are now made by a deterministic, local system that always returns a move quickly and never blocks the UI.

### Why this matters

Using a language model to decide moves in a deterministic game creates latency, unpredictability, and unnecessary complexity. Gomoku showed this clearly, and the same principle applies here.

Deterministic systems are better for things that must be fast, fair, and repeatable. Generative AI is best used for interpretation, personality, or flavor, not for enforcing rules or advancing the game loop.

This aligns with a core design principle you now have direct experience with:

Never use AI where deterministic scripts are better.  
Never use deterministic scripts where AI is better.

---

## 3. Inventory Reorganization

### What changed

The inventory system was reorganized to make item categories clearer and to support consumables properly. Items are no longer treated as “equip or auto-use” by default.

### Why this matters

An inventory should communicate intent. Weapons and armor are equipped. Consumables are used when needed. Mixing these concepts creates confusion and removes tactical choice.

Reorganizing inventory reinforces mental models the player already has from other RPGs, making the game easier to understand without tutorials.

---

## 4. Health Potions as Consumables

### What changed

Health potions are now true consumable items:

- Buying a potion adds it to inventory.
- Potions are not auto-used on purchase.
- Potions can be consumed during combat in the forest.
- A dedicated hotkey (`R`) was added for quick use.
- A potion can only be used if one exists in inventory.

### Why this matters

Auto-using potions removes player agency and trivializes decision-making. By making potions consumable resources, you introduce risk management and timing into combat.

The hotkey makes usage fast without adding UI clutter, and the inventory requirement prevents infinite healing.

This change demonstrates a core RPG principle: healing should be a decision, not a side effect.

---

## 5. Enemy Drops and Gold Economy

### What changed

Regular enemies no longer drop large amounts of gold. In fact, they drop little to no gold directly. Instead:

- Regular enemies sometimes drop items.
- Those items can be sold for modest amounts of gold.
- Bosses always drop a valuable item.
- Boss items scale in value with level, but never reach endgame prices.

The most expensive items in the game must still be purchased, not farmed instantly.

### Why this matters

Previously, gold flooded the player far too quickly. After a few minutes of play, you could afford the most expensive items, which collapsed progression and made the shop irrelevant.

The new economy shifts value to:

- sustained play
- selling loot
- meaningful boss encounters
- long-term planning

Gold now represents progress over time, not a byproduct of screen-clearing.

This illustrates an important systems design idea: currency should reflect effort and pacing, not raw enemy count.

---

## 6. Boss Rewards Philosophy

### What changed

Bosses no longer drop massive piles of gold. Instead, they always drop an item that is valuable to sell, with value increasing as the game progresses.

### Why this matters

Bosses should feel special, not like an exploit. Guaranteed item drops feel rewarding without breaking the economy. Players still need to make choices about saving, selling, and buying high-tier gear.

This keeps bosses exciting while preserving long-term balance.

---

## 7. Saving and Multiple Characters

### What changed

The game now supports multiple saved characters using local storage:

- Players can create multiple characters.
- Each character has independent progress.
- Players can start a new character without overwriting existing ones.
- Progress is automatically saved.

### Why this matters

Single-save systems limit experimentation and replayability. Multiple characters let players try different strategies, builds, or playstyles without penalty.

This also mirrors how classic RPGs teach progression: each character is a run, not a disposable state.

---

## Final Thoughts

Your original game already had strong ideas, personality, and ambition. The changes above didn’t replace that—they clarified it.

Most of these fixes are about aligning systems with player expectations and with the kind of experience you want to create. They also show a key lesson in software and game design: small numeric or structural decisions often matter more than big, flashy features.

You built something cool. These changes help it stay cool longer.
