import { ATTACK_MODES, ATTACK_SKILL_OVERRIDE_MODES, DOCUMENT_TYPES } from './constants.js';

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
        elemental: selectedTypes.includes('elemental'),
        electricity: selectedTypes.includes('electricity'),
        fire: selectedTypes.includes('fire'),
        ice: selectedTypes.includes('ice')
    };

    const labels = [];
    if (typeState.slashing) labels.push(game.i18n.localize('WITCHER.DamageType.slashing'));
    if (typeState.piercing) labels.push(game.i18n.localize('WITCHER.DamageType.piercing'));
    if (typeState.bludgeoning) labels.push(game.i18n.localize('WITCHER.DamageType.bludgeoning'));
    if (typeState.elemental) labels.push(game.i18n.localize('WITCHER.DamageType.elemental'));
    if (typeState.electricity) labels.push(game.i18n.localize('WITCHER.DamageType.electricity'));
    if (typeState.fire) labels.push(game.i18n.localize('WITCHER.DamageType.fire'));
    if (typeState.ice) labels.push(game.i18n.localize('WITCHER.DamageType.ice'));
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

export function getWeaponSkillAttackMode(system) {
    return Array.from(system?.attackOptions ?? [])[0] ?? ATTACK_MODES.MELEE;
}

export function getWeaponSkillNativeAttackSkill(system) {
    const attackMode = getWeaponSkillAttackMode(system);
    return attackMode === ATTACK_MODES.RANGED
        ? system?.rangedAttackSkill
        : system?.meleeAttackSkill;
}

export function getWeaponSkillEffectiveAttackSkill(system) {
    if (!system) return '';
    if (
        system.attackSkillOverrideMode === ATTACK_SKILL_OVERRIDE_MODES.STANDARD
        && system.attackSkillOverrideKey
    ) {
        return system.attackSkillOverrideKey;
    }

    return getWeaponSkillNativeAttackSkill(system) ?? '';
}

export async function withWeaponSkillNativeAttackOverride(skill, callback) {
    if (
        !skill?.system
        || skill.system.attackSkillOverrideMode !== ATTACK_SKILL_OVERRIDE_MODES.STANDARD
        || !skill.system.attackSkillOverrideKey
    ) {
        return callback(skill);
    }

    const attackMode = getWeaponSkillAttackMode(skill.system);
    const fieldName = attackMode === ATTACK_MODES.RANGED ? 'rangedAttackSkill' : 'meleeAttackSkill';
    const originalValue = skill.system[fieldName];
    skill.system[fieldName] = skill.system.attackSkillOverrideKey;

    try {
        return await callback(skill);
    } finally {
        skill.system[fieldName] = originalValue;
    }
}
