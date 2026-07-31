# WTTRPG Enhancements release notes

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
