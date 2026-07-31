# WTTRPG Enhancements release notes

## 0.0.13

### Weapon skill availability

- Weapon skills whose availability conditions are not met are now hidden by default.
- The attack picker now has a single **Show all skills** option. Enabling it reveals every attached weapon skill and allows any of them to be used for the current attack, regardless of its condition.
- Removed the separate unavailable-skills group and the previous overlapping availability controls.

### Conditional expressions

- Added `professionSkillPoints(actor?)`, which returns the total points invested in the defining profession skill and all nine profession-path skills.
- The helper uses the attacking actor by default and can evaluate another actor, for example `professionSkillPoints(target)`.
- Added `professionSkillPoints()` to conditional-editor autocomplete.
