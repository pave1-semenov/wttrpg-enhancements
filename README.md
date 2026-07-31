# WTTRPG Enhancements

**WTTRPG Enhancements** adds flexible combat tools to *The Witcher TRPG* system for Foundry VTT. It helps GMs create ongoing effects, special weapon techniques, lifesteal, conditional damage bonuses, and more controlled damage application while keeping the system's normal combat flow.

## What the module adds

### Ongoing damage and healing

Active Effects can deal damage or restore health automatically when a character's turn begins.

- Create poison, bleeding, burning, regeneration, and similar effects.
- Choose the roll formula, damage type, hit location, and armor-related properties.
- Apply damage automatically or leave it as a chat roll for the GM to resolve.
- Show clear chat cards for every damage or healing tick.

**Example:** A poison effect deals `2d6` damage to the torso at the start of each affected character's turn, while a regeneration potion restores `1d6` HP per turn.

### Lifesteal and overheal

Weapons, spells, weapon skills, and damaging ongoing effects can return part of the damage they deal to the attacker.

- Restore HP, Stamina, or the same attribute that was damaged.
- Limit how much can be stolen by a single attack; set the limit to `0` for no cap.
- Turn excess HP recovery into a shield.
- Set a maximum shield value.
- Add conditions so lifesteal only works in specific situations.

**Example:** A vampiric sword restores 25% of the HP damage it deals. If its wielder is already at full HP, half of that excess healing becomes a shield, up to a chosen limit.

### Conditional damage bonuses

Active Effects can increase an attacker's damage for one damage type or for all damage.

- Add extra dice or a flat bonus to a damage roll.
- Multiply the final damage.
- Limit the bonus with conditions based on the attacker, target, or damage dealt.
- Apply the same bonuses to ongoing damage where appropriate.

**Example:** A monster-hunting oil adds `1d6` damage against monsters, while a vulnerability effect doubles slashing damage.

#### Condition expressions

Conditions can use `actor` (an alias for `attacker`), `attacker`, `target`, `damage`, `source`, and `professionTree`, including their full property paths. `source` is the Item that produced the attack, so a weapon skill remains distinguishable from its parent weapon. `professionTree` is the attacker's profession system data. The expression parser supports comparisons, arithmetic, `&&`, `||`, `!`, and parentheses.

Common values have shorter helper functions:

- `hp()`, `sta()`, `shield()`, `focus()`, `resolve()`, `vigor()`, `luck()`, and `toxicity()` return the attacker's current value. Pass an actor to read another actor, such as `hp(target)`.
- The matching maximum helpers are `maxHp()`, `maxSta()`, `maxShield()`, `maxFocus()`, `maxResolve()`, `maxVigor()`, `maxLuck()`, and `maxToxicity()`.
- `attribute('name', actor?)` and `maxAttribute('name', actor?)` read any derived stat or regular stat. `stat('ref', actor?)` is a shortcut for a regular stat.
- `hasActiveEffect('name', actor?)` checks for a non-disabled, non-suppressed Active Effect by name. `getActiveEffect('name', actor?)` returns that effect so its data can be used in an expression.
- `armor(location?, actor?)` returns total stopping power. It defaults to the current target and damage location; for example, `armor('head')` or `armor('torso', attacker)`.
- `isSourceAWeaponSkill(name?)` and `isSourceAWeapon(name?)` check the attack source, optionally matching its name without regard to case.
- `professionTree(actor?)` returns the complete profession system data. `professionSkill('name', actor?)` returns a profession ability so any of its properties can be inspected.
- `professionSkillRank('name', actor?)` returns an ability's rank, or `0` if it is absent. `hasProfessionSkill('name', minimumRank?, actor?)` checks that it has been raised to at least the requested rank (rank `1` by default).
- `professionSkillPoints(actor?)` returns the total points invested in the defining skill and all nine profession path skills.

Examples:

```text
hp(target) < maxHp(target) / 2
stat('ref') > 5 && hasActiveEffect('Monster Oil')
getActiveEffect('Blood Frenzy').system.changes[0].value * 2 > damage.amount
armor() < 10 && damage.type === 'slashing'
isSourceAWeaponSkill('Whirl') && professionSkillRank('Fury') >= 5
professionSkillPoints() >= 20
isSourceAWeapon() && professionSkill('Tactical Awareness').thresholds.hasThresholds
```

Condition fields on amplifier, lifesteal, and weapon-skill sheets offer context-aware autocomplete while typing. Use the arrow keys to move through suggestions, `Enter` or `Tab` to insert one, and `Escape` to close the list.

### More control when applying damage

An enhanced **Apply Damage** option is available from damage messages in chat.

- Adjust the rolled amount by a fixed number or percentage before applying it.
- Choose the hit location.
- Add temporary stopping power to that location for this damage application without changing the actor's armor.
- Mark the damage as non-lethal.
- Account for vulnerability, weapon oils, and monster resistances.
- Trigger any lifesteal attached to the attack.

**Example:** The GM can reduce an incoming hit by 50% for a special resistance, move it to the arm, add a small flat bonus, or grant temporary stopping power without editing the original roll or armor.

### Weapon skills and special attacks

A weapon can have several alternate techniques attached to it. Whenever that weapon attacks, the player can use its normal attack or choose one of those techniques.

Each weapon skill can have its own:

- Damage formula and damage types.
- Melee or ranged attack mode.
- Attack skill and roll modifier.
- Stamina cost and number of attacks.
- Allowed strike types and target locations.
- Range, ammunition use, and damage properties.
- Defense options available to the target.
- Lifesteal and Active Effects.
- An availability condition based on the attacking actor and current target.

Skills can be created directly on a weapon or copied from reusable templates. An attached copy can inherit the weapon's properties or keep the template's own values.

The attack picker shows the weapon's normal attack alongside its skills. Skill conditions use `actor` (the weapon's owner) and `target` (the first currently targeted actor). Skills whose conditions are not met are hidden by default. The player can show and use every attached skill for the current attack with the Show all skills option; if no skill is available, the standard weapon attack is selected automatically.

**Example:** A *Pommel Strike* may cost 3 Stamina, deal bludgeoning damage, use a different attack skill, and allow the defender an additional defense option. A *Whirl* technique may make a fixed number of attacks with its own accuracy penalty.

### Optional Argon Combat HUD integration

[Enhanced Combat HUD for The Witcher TRPG](https://github.com/pedroaugustobt/enhancedcombathud-thewitchertrpg) is supported as a soft dependency. WTTRPG Enhancements continues to work normally when it is not installed.

When the Argon core and Witcher integration modules are active:

- Available attached weapon skills appear as direct action buttons around their weapon, using the same actor-and-target condition checks as the attack picker. The first three occupy the lower edge, the next three occupy the upper edge, and additional rows grow upward.
- Left-clicking a skill performs that skill's attack directly. Right-clicking opens its item sheet.
- Monsters without equipped weapons still receive HUD buttons for all of their non-ammunition weapons. Player characters continue to use Argon's equipped-weapon behavior.
- Client settings can independently hide Brawling actions, Verbal Combat, and Special Attacks from the HUD.

## Where to find the features

The GM can open **WTTRPG Enhancements** from the header of:

- An **Active Effect** to configure ongoing damage, ongoing healing, lifesteal, or damage amplification.
- A **weapon or spell** to configure lifesteal.
- A **weapon** to create, attach, and manage weapon skills.

Damage messages gain an enhanced **Apply Damage** entry in their context menu. Timed effects are processed by the GM during combat.

## Requirements

- Foundry VTT 13 or 14
- *The Witcher TRPG* system 14.2.1 or newer
- [libWrapper](https://foundryvtt.com/packages/lib-wrapper)

Optional:

- [Argon - Combat HUD](https://foundryvtt.com/packages/enhancedcombathud) with [Enhanced Combat HUD for The Witcher TRPG](https://github.com/pedroaugustobt/enhancedcombathud-thewitchertrpg)
