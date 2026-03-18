import { WEAPON_SKILL_BASE_TYPE, WEAPON_SKILL_TYPE } from '../setup/itemTypeRegistration.js';
import { DOCUMENT_TYPES, ITEM_TYPES, MODULE } from './constants.js';

export const SOURCE_ITEM_UUID_FLAG = 'sourceItemUuid';
export const LEGACY_SOURCE_WORLD_ITEM_ID_FLAG = 'sourceWorldItemId';

export function isWeaponSkillType(type) {
    return type === WEAPON_SKILL_BASE_TYPE || type === WEAPON_SKILL_TYPE;
}

export function isWeaponSkill(item) {
    return isWeaponSkillType(item?.type);
}

export function getRollSourceItem(item) {
    if (!item) return item;
    if (!isWeaponSkill(item)) return item;
    return item.system?.parentWeapon ?? item;
}

export function isAttachedToWeapon(item, weaponUuid) {
    return isWeaponSkillType(item?.type) && item.system?.parentWeaponUuid === weaponUuid;
}

export function getSourceIdentity(item) {
    return {
        uuid: item.getFlag?.(MODULE.FLAGS_KEY, SOURCE_ITEM_UUID_FLAG) ?? null,
        legacyId: item.getFlag?.(MODULE.FLAGS_KEY, LEGACY_SOURCE_WORLD_ITEM_ID_FLAG) ?? null
    };
}

export function hasSameSourceIdentity(item, sourceItem) {
    const source = getSourceIdentity(item);
    return source.uuid === sourceItem.uuid || source.legacyId === sourceItem.id;
}

export function prepareEmbeddedSkillData(skill, parentWeapon) {
    const data = skill.toObject();
    delete data._id;

    data.system ??= {};
    data.system.parentWeaponUuid = parentWeapon.uuid;
    data.flags ??= {};
    data.flags[MODULE.FLAGS_KEY] ??= {};
    data.flags[MODULE.FLAGS_KEY][SOURCE_ITEM_UUID_FLAG] = skill.uuid;
    data.flags[MODULE.FLAGS_KEY][LEGACY_SOURCE_WORLD_ITEM_ID_FLAG] = skill.id;

    return data;
}

function isLikelyItemDocument(item) {
    return !!item && typeof item.update === 'function' && typeof item.toObject === 'function' && !!item.uuid;
}

function getDocumentId(item) {
    return item?.id ?? item?._id ?? null;
}

async function resolveUuid(uuid) {
    if (!uuid || typeof uuid !== 'string') return null;

    try {
        return await fromUuid(uuid);
    } catch {
        return null;
    }
}

async function resolveSourceWeapon(sourceWeapon) {
    if (sourceWeapon?.type !== ITEM_TYPES.WEAPON) return null;

    const documentId = getDocumentId(sourceWeapon);
    const compendiumSource = sourceWeapon?._stats?.compendiumSource ?? null;

    const uuidCandidates = [sourceWeapon?.uuid, compendiumSource].filter(Boolean);
    for (const candidate of uuidCandidates) {
        const document = await resolveUuid(candidate);
        if (document?.type === ITEM_TYPES.WEAPON) return document;
    }

    if (sourceWeapon.pack && documentId) {
        const pack = game.packs.get(sourceWeapon.pack);
        const document = await pack?.getDocument(documentId);
        if (document?.type === ITEM_TYPES.WEAPON) return document;
    }

    if (documentId) {
        const worldDocument = game.items.get(documentId);
        if (worldDocument?.type === ITEM_TYPES.WEAPON) return worldDocument;
    }

    if (isLikelyItemDocument(sourceWeapon)) {
        return sourceWeapon;
    }

    return null;
}

export function getAttachedWeaponSkillsSync(item) {
    if (item?.type !== ITEM_TYPES.WEAPON || !item?.uuid) return [];

    const ownedSkills = item.actor?.items?.filter(entry => isAttachedToWeapon(entry, item.uuid)) ?? [];
    const ownedSourceUuids = new Set(
        ownedSkills.map(entry => entry.getFlag?.(MODULE.FLAGS_KEY, SOURCE_ITEM_UUID_FLAG)).filter(Boolean)
    );
    const ownedLegacyIds = new Set(
        ownedSkills.map(entry => entry.getFlag?.(MODULE.FLAGS_KEY, LEGACY_SOURCE_WORLD_ITEM_ID_FLAG)).filter(Boolean)
    );
    const worldSkills = game.items.filter(entry => {
        if (!isAttachedToWeapon(entry, item.uuid)) return false;
        if (item.actor && (ownedSourceUuids.has(entry.uuid) || ownedLegacyIds.has(entry.id))) return false;
        return true;
    });

    return [...ownedSkills, ...worldSkills];
}

export async function getAttachedWeaponSkills(item) {
    const resolvedItem = await resolveSourceWeapon(item);
    if (!resolvedItem) return [];

    const syncSkills = getAttachedWeaponSkillsSync(resolvedItem);
    if (resolvedItem.actor || !resolvedItem.pack) return syncSkills;

    const pack = game.packs.get(resolvedItem.pack);
    if (!pack) return syncSkills;

    const packSkills = (await pack.getDocuments()).filter(entry => isAttachedToWeapon(entry, resolvedItem.uuid));
    return [...syncSkills, ...packSkills];
}

export async function cloneAttachedWeaponSkillsToActor(sourceWeapon, targetActor, targetWeapon) {
    if (sourceWeapon?.type !== ITEM_TYPES.WEAPON || !targetActor || !targetWeapon) return [];

    const resolvedSourceWeapon = await resolveSourceWeapon(sourceWeapon);
    if (!resolvedSourceWeapon) return [];

    const sourceSkills = await getAttachedWeaponSkills(resolvedSourceWeapon);
    if (!sourceSkills.length) return [];

    const toCreate = sourceSkills
        .filter(skill => {
            return !targetActor.items.some(item => {
                if (!isWeaponSkillType(item.type)) return false;
                if (item.system?.parentWeaponUuid !== targetWeapon.uuid) return false;
                return hasSameSourceIdentity(item, skill);
            });
        })
        .map(skill => prepareEmbeddedSkillData(skill, targetWeapon));

    if (!toCreate.length) return [];
    return targetActor.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, toCreate);
}



