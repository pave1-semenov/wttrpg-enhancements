# WTTRPG Enhancements release notes

## Unreleased — Situational Bonuses

This release introduces **Situational Bonuses**: flexible, conditional roll modifiers for skill checks, attacks, and damage.

## Situational Bonuses

Create reusable bonuses containing:

- A name, description, and image
- A dice or numeric roll formula
- An optional availability condition
- A Skill Check, Attack, or Damage scope

Players can select applicable bonuses directly from the existing roll dialogs without replacing the system's original templates.

## Global and Item-Specific Bonuses

Situational bonuses can be:

- Attached to an actor as global bonuses
- Attached to a specific weapon
- Attached to a specific spell

Weapon- and spell-specific bonuses only appear when rolling with their associated item. Weapon skills also recognize bonuses attached to their parent weapon.

Configured bonuses are copied alongside world weapons and spells when those items are added to an actor.

## Skill-Specific Bonuses

Skill Check bonuses can apply globally or be restricted to selected skills.

Standard WTTRPG skills, actor-specific custom skills, and profession-tree abilities are supported. Leaving the selection empty makes the bonus available for every skill check, including profession skill rolls.

## Conditions

Situational bonuses use the existing safe condition engine and autocomplete system.

A new helper is available:

```js
skillLevel('Athletics') >= 6
skillLevel('Swordsmanship', target) < 5
skillLevel('Custom Skill') > 0
```

`skillLevel()` supports standard and custom skills and returns `0` when the requested skill is absent.

## Improved Roll Cards

Available bonuses appear as illustrated cards showing:

- Bonus name and description
- Roll formula
- Skill Check, Attack, or Damage type
- Global actor or originating weapon/spell
- A selection checkbox

Each bonus can configure its artwork as:

- Image on the left
- Image on the right
- Full-card cover

## Bonus Management

A new WTTRPG Enhancements button is available from actor sheets for managing global bonuses.

Weapons and spells now include a **Situational Bonuses** tab in their WTTRPG Enhancements window. Bonuses can be created directly or copied from reusable world and compendium templates through drag and drop.

## 0.0.14

### Optional Argon Combat HUD integration

- Added optional support for [Enhanced Combat HUD for The Witcher TRPG](https://github.com/pedroaugustobt/enhancedcombathud-thewitchertrpg). The module remains fully functional without Argon installed.
- Available attached weapon skills now appear as direct Argon HUD buttons around their weapon, using the same actor-and-target condition checks as the attack picker. Left-click to make that skill's attack; right-click to open its sheet.
- Weapon-skill buttons use larger icons arranged around the weapon: the first three on the lower edge, the next three on the upper edge, and additional rows growing upward.
- Monsters now show all non-ammunition weapons in Argon when none are equipped. Player characters retain Argon's equipped-weapon behavior.
- Added client settings to hide Argon's Brawling actions, Verbal Combat, or Special Attacks independently.

## 0.0.13

### Weapon skill availability

- Weapon skills whose availability conditions are not met are now hidden by default.
- The attack picker now has a single **Show all skills** option. Enabling it reveals every attached weapon skill and allows any of them to be used for the current attack, regardless of its condition.
- Removed the separate unavailable-skills group and the previous overlapping availability controls.

### Conditional expressions

- Added `professionSkillPoints(actor?)`, which returns the total points invested in the defining profession skill and all nine profession-path skills.
- The helper uses the attacking actor by default and can evaluate another actor, for example `professionSkillPoints(target)`.
- Added `professionSkillPoints()` to conditional-editor autocomplete.
