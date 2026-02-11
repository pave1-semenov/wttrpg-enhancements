# WTTRPG Enhancements
## TBA, Readme is AI-generated

Enhancements for the **The Witcher TRPG** Foundry system focused on:
- Active Effect over-time mechanics (DOT/HOT)
- Lifesteal automation and chat feedback
- Damage amplification from active effects

## Compatibility

- Foundry VTT: v12-v13 (module manifest verifies v13)
- System: `TheWitcherTRPG`
- Dependency: `lib-wrapper`

## What This Module Adds

### 1. Active Effect Enhancement Sheet

On any Active Effect sheet (GM), a header button opens an enhancement sheet with tabs:
- `DOT`
- `HOT`
- `Lifesteal`
- `Amplifier`

### 2. Weapon Lifesteal Sheet

On weapon item sheets (GM), a header button opens a Lifesteal configuration tab.

### 3. Combat Turn Processing (DOT + HOT)

On combat updates, the module checks the current combatant's effects and processes enabled timed effects:
- DOT effects 
- HOT effects 

Only GM executes these flows.

### 4. Enhanced Damage Apply from Chat

Adds a context option on damage chat cards to apply damage which respects the lifesteal flow

### 5. Damage Amplifier

Modifies the damage formula per damage type using different amplification mechanisms:
- additive variable formula
- multiplicative modifier

## Settings and Behavior

## DOT Tab (Active Effect)

| Setting | What it does |
|---|---|
| `enabled` | Enables DOT processing for this effect on turn updates. |
| `formula` | Damage roll formula used each tick. |
| `damageType` | Damage type sent to system damage application. |
| `location` | Hit location used for applied damage logic. |
| `autoApply` | If enabled, damage is auto-applied to current actor; otherwise only chat roll/card is posted. |
| `damageProperties.*` | Overrides or inherits damage properties used by Witcher damage application. Includes SP damage support. |

### DOT runtime flow
1. Build damage object (formula/type/location/properties).
2. Apply amplifier modifications to formula.
3. Roll and post styled chat card.
4. Store damage payload on message flag for later chat-based apply flow.
5. If `autoApply`, call `actor.applyDamage(...)`.
6. If effect/item lifesteal is enabled, lifesteal triggers after damage application.

## HOT Tab (Active Effect)

| Setting | What it does |
|---|---|
| `enabled` | Enables HOT processing for this effect on turn updates. |
| `formula` | Healing roll formula used each tick. |

### HOT runtime flow
1. Roll formula.
2. Call `actor.calculateHealValue(roll.total)`.
3. Update actor HP using returned healing amount.
4. Always post styled chat card with:
   - healer
   - target
   - heal applied (shown only if > 0)
   - HP change row (or clear no-benefit text when nothing was healed)

## Lifesteal Tab (Active Effect or Weapon)

| Setting | What it does |
|---|---|
| `enabled` | Enables lifesteal processing after successful damage application. |
| `flatPercentage` | Percent of damage dealt converted into lifesteal. |
| `storeOverheal` | If enabled and stealing HP, overflow can be converted to shield. |
| `overhealPercentage` | Percent of overflow HP converted into shield. |
| `overhealThreshold` | Optional shield cap for overheal storage (0 means no cap). |

### Lifesteal runtime flow
1. Compute total damage dealt from target attribute delta.
2. Compute lifesteal amount.
3. Heal attacker's affected attribute (`hp` or `sta` based on context).
4. If enabled and stat is HP, convert overflow to shield.
5. Post styled chat card including:
   - attacker and target
   - damage dealt
   - lifesteal result
   - attribute change row (only when that attribute changed)
   - shield gain row (only when shield actually increased)
   - clear no-benefit reason when capped/full conditions block gains

## Amplifier Tab (Active Effect)

| Setting | What it does |
|---|---|
| `enabled` | Enables this amplifier effect. |
| `damageType` | Applies only to matching type, or `all`. |
| `multiplier` | Multiplicative factor applied to final formula. |
| `variableFormula` | Additive formula fragment appended before multiplication. |

### Amplifier details
- Pulls all enabled amplifier effects from actor applied effects.
- Applies variable formulas first, then multipliers.
- Honors system setting `displayRollsDetails` for labeled roll fragments.

## Chat UX

Enhancement rolls use a custom roll class and custom roll/tooltip templates:
- unified visual style for card + roll + tooltip
- dark-theme-friendly tooltip text
- wrapper styling on matching chat message container

Applies to DOT, HOT, and Lifesteal messages.

## Data Model (Flags)

Stored under `flags.wttrpg-enhancements`:
- `dot`
- `hot`
- `lifesteal`
- `amp`

Message payloads:
- Damage payload stored on chat messages under `flags.TheWitcherTRPG.damage` for enhanced apply flow.

## Typical In-Game Setup

1. Create or open an Active Effect.
2. Open enhancement sheet via header button.
3. Configure `DOT` and/or `HOT`.
4. Optionally configure `Lifesteal`.
5. (Optional) Add `Amplifier` effects for formula scaling.
6. Start combat; module processes timed effects on active combatant updates.

## Notes

- Most automation is GM-side by design.
- Existing system mechanics remain authoritative (`applyDamage`, `calculateHealValue`, etc); this module orchestrates and enriches those flows.
