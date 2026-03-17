import { cloneAttachedWeaponSkillsToActor } from '../util/weaponSkillAttachment.js';

export async function wrapAddItem(wrapped, addItem, numberOfItem, forcecreate = false) {
    const beforeIds = new Set(this.items.map(item => item.id));
    const existingItem = this.items.find(item => item.name == addItem?.name && item.type == addItem?.type);

    const result = await wrapped(addItem, numberOfItem, forcecreate);

    if (addItem?.type !== 'weapon') {
        return result;
    }

    const targetWeapon = existingItem && !forcecreate && !existingItem.system.isStored
        ? existingItem
        : this.items.find(item => !beforeIds.has(item.id) && item.name == addItem?.name && item.type == addItem?.type)
            ?? this.items.find(item => item.name == addItem?.name && item.type == addItem?.type);

    if (targetWeapon) {
        console.log(addItem, targetWeapon)
        await cloneAttachedWeaponSkillsToActor(addItem, this, targetWeapon);
    }

    return result;
}
