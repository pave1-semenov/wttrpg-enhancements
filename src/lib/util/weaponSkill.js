export function deriveWeaponSkillAttackMode(source) {
    const attackOptions = Array.isArray(source?.attackOptions)
        ? source.attackOptions
        : Array.from(source?.attackOptions ?? []);
    if (attackOptions.includes('ranged')) return 'ranged';
    if (attackOptions.includes('melee')) return 'melee';

    const meleeSkill = source?.meleeAttackSkill ?? source?.attackSkill ?? '';
    const rangedSkill = source?.rangedAttackSkill ?? source?.attackSkill ?? '';

    if (rangedSkill && CONFIG.WITCHER?.rangedSkills?.includes(rangedSkill)) return 'ranged';
    if (source?.isThrowable || source?.usingAmmo) return 'ranged';
    if (meleeSkill && CONFIG.WITCHER?.meleeSkills?.includes(meleeSkill)) return 'melee';

    return 'melee';
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
    const match = uuid.match(/\.Item\.([^\.]+)$/);
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
        const sameActorPrefix = `${actor.uuid}.Item.`;
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
    if (!system || !actor || system.attackSkillOverrideMode === 'none' || !system.attackSkillOverrideKey) return null;

    if (system.attackSkillOverrideMode === 'standard') {
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

    if (system.attackSkillOverrideMode === 'custom') {
        const customSkill = actor.items?.find(item => item.type === 'skill' && item.name === system.attackSkillOverrideKey);
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
