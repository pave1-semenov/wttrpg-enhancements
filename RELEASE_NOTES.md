# WTTRPG Enhancements release notes

## Unreleased — Campaign Codex Timeline

- Added **Campaign Timeline** to Campaign Codex's widget picker when both modules are enabled.
- Organize events under free-text dates, with free-text times and rich-text descriptions for both dates and events.
- Attach multiple Campaign Codex NPCs and entries to each date or event. Links appear as clickable tags in two columns with icon tooltips; duplicate attachments are ignored.
- GMs can switch between edit and reading modes. Reorder dates and events using drag handles or arrow buttons, without parsing dates or sorting by time.
- A connected main timeline links dates, while event branches split off and reconnect. Distinct lines, dots, and separators make the hierarchy easier to follow.
- Timeline changes persist on the hosting journal, and linked documents respect viewer permissions. Existing single-entry links are preserved automatically.

To get started, reload Foundry, add **Campaign Timeline** from the Campaign Codex widget picker, and select **Edit timeline**.

## Unreleased — Profession Skill Support

### Situational bonuses for profession skills

- Skill Check situational bonuses can now be restricted to profession-tree abilities.
- The bonus editor lists an actor's defining profession skill and all nine profession-path skills.
- Profession skills are stored with distinct identifiers, preventing collisions with standard or custom skills that share the same name.
- Applicable situational bonuses are displayed and applied when making profession skill rolls.
- Skill Check bonuses without a specific skill selection continue to apply globally, including to profession skill rolls.

### Skill selector organization

- The applicable-skill selector is now divided into clearly labeled **Skills** and **Profession Skills** groups.
- Standard and custom skills remain together in the Skills group, while profession-tree abilities have their own section.

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
