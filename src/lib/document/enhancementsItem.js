import {
    cloneAttachedWeaponSkillsToActor,
    getAttachedWeaponSkills,
    getAttachedWeaponSkillsSync,
    isWeaponSkillType
} from '../util/weaponSkillAttachment.js';

const REGISTERED_FLAG = '__wttrpgEnhancementsRegistered';

/**
 * Wrap the system item document class so module item types keep inheriting
 * the system's custom item behavior without importing it directly.
 */
export function registerEnhancementsItemDocument() {
    const baseItemClass = CONFIG.Item?.documentClass ?? Item;

    if (baseItemClass?.[REGISTERED_FLAG]) return baseItemClass;

    class WTTRPGEnhancementsItem extends baseItemClass {
        static [REGISTERED_FLAG] = true;

        get isWeaponSkill() {
            return isWeaponSkillType(this.type);
        }

        get attachedWeaponSkills() {
            return getAttachedWeaponSkillsSync(this);
        }

        async getAttachedWeaponSkillsAsync() {
            return getAttachedWeaponSkills(this);
        }

        get rollSourceItem() {
            if (!this.isWeaponSkill) return this;
            return this.system.parentWeapon ?? this;
        }

        async cloneAttachedWeaponSkillsToActor(targetActor, targetWeapon) {
            return cloneAttachedWeaponSkillsToActor(this, targetActor, targetWeapon);
        }
    }

    CONFIG.Item.documentClass = WTTRPGEnhancementsItem;
    return WTTRPGEnhancementsItem;
}
