import getWeaponSkillDataModel from '../data/weaponSkillData.js';
import WeaponSkillSheet from '../sheet/weaponSkillSheet.js';
import { MODULE } from '../util/constants.js';
import SituationalBonusData from '../data/situationalBonusData.js';
import SituationalBonusSheet from '../sheet/situationalBonusSheet.js';

const Items = foundry.documents.collections.Items;

export const WEAPON_SKILL_BASE_TYPE = 'weapon-skill';
export const WEAPON_SKILL_TYPE = `${MODULE.ID}.${WEAPON_SKILL_BASE_TYPE}`;
export const SITUATIONAL_BONUS_BASE_TYPE = 'situational-bonus';
export const SITUATIONAL_BONUS_TYPE = `${MODULE.ID}.${SITUATIONAL_BONUS_BASE_TYPE}`;

/**
 * Register the weapon-skill item type for the module.
 */
export function registerItemTypes() {
    console.log('The Witcher TRPG Enhancements | Registering weapon-skill item type');

    // Foundry stores module-defined document subtypes with the package prefix,
    // but some lookup paths still reference the raw subtype key.
    const WeaponSkillData = getWeaponSkillDataModel();
    CONFIG.Item.dataModels[WEAPON_SKILL_BASE_TYPE] = WeaponSkillData;
    CONFIG.Item.dataModels[WEAPON_SKILL_TYPE] = WeaponSkillData;
    CONFIG.Item.dataModels[SITUATIONAL_BONUS_BASE_TYPE] = SituationalBonusData;
    CONFIG.Item.dataModels[SITUATIONAL_BONUS_TYPE] = SituationalBonusData;

    const sheetOptions = {
        types: [WEAPON_SKILL_BASE_TYPE, WEAPON_SKILL_TYPE],
        makeDefault: true
    };

    Items.registerSheet(MODULE.ID, WeaponSkillSheet, sheetOptions);
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, MODULE.ID, WeaponSkillSheet, sheetOptions);

    const bonusSheetOptions = { types: [SITUATIONAL_BONUS_BASE_TYPE, SITUATIONAL_BONUS_TYPE], makeDefault: true };
    Items.registerSheet(MODULE.ID, SituationalBonusSheet, bonusSheetOptions);
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, MODULE.ID, SituationalBonusSheet, bonusSheetOptions);
}

