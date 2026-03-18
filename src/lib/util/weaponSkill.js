import { ATTACK_MODES, ATTACK_SKILL_OVERRIDE_MODES, DOCUMENT_TYPES, ITEM_TYPES } from './constants.js';

export function deriveWeaponSkillAttackMode(source) {
    const attackOptions = Array.isArray(source?.attackOptions)
        ? source.attackOptions
        : Array.from(source?.attackOptions ?? []);
    if (attackOptions.includes(ATTACK_MODES.RANGED)) return ATTACK_MODES.RANGED;
    if (attackOptions.includes(ATTACK_MODES.MELEE)) return ATTACK_MODES.MELEE;

    const meleeSkill = source?.meleeAttackSkill ?? source?.attackSkill ?? '';
    const rangedSkill = source?.rangedAttackSkill ?? source?.attackSkill ?? '';

    if (rangedSkill && CONFIG.WITCHER?.rangedSkills?.includes(rangedSkill)) return ATTACK_MODES.RANGED;
    if (source?.isThrowable || source?.usingAmmo) return ATTACK_MODES.RANGED;
    if (meleeSkill && CONFIG.WITCHER?.meleeSkills?.includes(meleeSkill)) return ATTACK_MODES.MELEE;

    return ATTACK_MODES.MELEE;
}

export function deriveWeaponSkillAttackOptions(source) {
    return [deriveWeaponSkillAttackMode(source)];
}

export function createWeaponSkillTypeState(damageTypes = []) {
    const selectedTypes = Array.isArray(damageTypes) ? damageTypes : Array.from(damageTypes ?? []);
    const typeState = {
        text: '',
        slashing: selectedTypes.includes('slashing'),
        piercing: selectedTypes.includes('piercing'),
        bludgeoning: selectedTypes.includes('bludgeoning'),
        elemental: selectedTypes.includes('elemental')
    };

    const labels = [];
    if (typeState.slashing) labels.push(game.i18n.localize('WITCHER.DamageType.slashing'));
    if (typeState.piercing) labels.push(game.i18n.localize('WITCHER.DamageType.piercing'));
    if (typeState.bludgeoning) labels.push(game.i18n.localize('WITCHER.DamageType.bludgeoning'));
    if (typeState.elemental) labels.push(game.i18n.localize('WITCHER.DamageType.elemental'));
    typeState.text = labels.join(', ');

    return typeState;
}

function getEmbeddedItemIdFromUuid(uuid) {
    if (!uuid || typeof uuid !== 'string') return null;
    const match = uuid.match(new RegExp(`\\.${DOCUMENT_TYPES.ITEM}\\.([^\\.]+)$`));
    return match?.[1] ?? null;
}

export function getWeaponSkillParentWeapon(itemOrSystem, parent) {
    const system = itemOrSystem?.parentWeaponUuid !== undefined ? itemOrSystem : itemOrSystem?.system;
    const ownerParent = itemOrSystem?.parent ?? parent;
    const parentWeaponUuid = system?.parentWeaponUuid;
    if (!parentWeaponUuid) return null;

    const actor = ownerParent?.actor;
    if (actor) {
        const embeddedItemId = getEmbeddedItemIdFromUuid(parentWeaponUuid);
        const sameActorPrefix = `${actor.uuid}.${DOCUMENT_TYPES.ITEM}.`;
        if (parentWeaponUuid.startsWith(sameActorPrefix) && embeddedItemId) {
            return actor.items.get(embeddedItemId) ?? null;
        }
    }

    try {
        return fromUuidSync(parentWeaponUuid);
    } catch {
        return null;
    }
}

export function getWeaponSkillAttackSkillReplacement(system, actor) {
    if (!system || !actor || system.attackSkillOverrideMode === ATTACK_SKILL_OVERRIDE_MODES.NONE || !system.attackSkillOverrideKey) return null;

    if (system.attackSkillOverrideMode === ATTACK_SKILL_OVERRIDE_MODES.STANDARD) {
        const skillMapEntry = CONFIG.WITCHER?.skillMap?.[system.attackSkillOverrideKey];
        const stat = skillMapEntry?.attribute?.name;
        const level = actor.system?.skills?.[stat]?.[system.attackSkillOverrideKey]?.value;
        if (!skillMapEntry || !stat || level === undefined) return null;

        return {
            skillName: game.i18n.localize(skillMapEntry.label),
            stat,
            level
        };
    }

    if (system.attackSkillOverrideMode === ATTACK_SKILL_OVERRIDE_MODES.CUSTOM) {
        const customSkill = actor.items?.find(item => item.type === ITEM_TYPES.SKILL && item.name === system.attackSkillOverrideKey);
        const stat = customSkill?.system?.attribute;
        const level = customSkill?.system?.value;
        if (!customSkill || !stat) return null;

        return {
            skillName: customSkill.name,
            stat,
            level: level ?? 0
        };
    }

    return null;
}
