import { cloneAttachedWeaponSkillsToActor } from '../util/weaponSkillAttachment.js';
import { ITEM_TYPES } from '../util/constants.js';
import { cloneAttachedSituationalBonusesToActor } from '../mixin/itemSituationalBonusMixin.js';

export async function wrapAddItem(wrapped, addItem, numberOfItem, forcecreate = false) {
    const beforeIds = new Set(this.items.map(item => item.id));
    const existingItem = this.items.find(item => item.name == addItem?.name && item.type == addItem?.type);

    const result = await wrapped(addItem, numberOfItem, forcecreate);

    if (![ITEM_TYPES.WEAPON, 'spell'].includes(addItem?.type)) {
        return result;
    }

    const targetWeapon = existingItem && !forcecreate && !existingItem.system.isStored
        ? existingItem
        : this.items.find(item => !beforeIds.has(item.id) && item.name == addItem?.name && item.type == addItem?.type)
            ?? this.items.find(item => item.name == addItem?.name && item.type == addItem?.type);

    if (targetWeapon && addItem?.type === ITEM_TYPES.WEAPON) {
        await cloneAttachedWeaponSkillsToActor(addItem, this, targetWeapon);
    }
    if (targetWeapon) await cloneAttachedSituationalBonusesToActor(addItem, this, targetWeapon);

    return result;
}


