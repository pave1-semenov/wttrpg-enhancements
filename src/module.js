import { registerCombatHooks } from "./lib/hooks/combat.js";
import { addActiveEffectEnhanceOption, addItemButtonAppV2, addSituationalBonusButton } from "./lib/hooks/buttons.js";
import { addEnhancedDamageContextOption } from "./lib/hooks/chat.js";
import { wrapDamageRoll } from "./lib/flows/damageRollFlow.js";
import { wrapWeaponAttack } from "./lib/flows/weaponAttackFlow.js";
import { wrapPrepareAndExecuteDefense } from "./lib/flows/defenseFlow.js";
import { wrapAddItem } from "./lib/flows/addItemFlow.js";
import { EnhancementRoll } from "./lib/roll/enhancementRoll.js";
import { wrapGetLocationArmor } from "./lib/core/temporarySp.js";
import { MODULE, TEMPLATE_PATHS } from "./lib/util/constants.js";
import { registerItemTypes } from "./lib/setup/itemTypeRegistration.js";
import { registerSettings } from "./lib/setup/settings.js";
import { registerArgonCombatHudIntegration } from "./lib/integrations/argonCombatHud.js";
import { wrapCustomSkillCheck, wrapProfessionSkillCheck, wrapSkillCheck } from "./lib/flows/skillCheckFlow.js";
import { wrapCastSpell } from "./lib/flows/spellAttackFlow.js";
import { registerCampaignTimeline } from "./lib/integrations/campaignTimeline.js";
import { registerValuableJournals } from "./lib/integrations/valuableJournal.js";
Hooks.once('ready', registerCampaignTimeline);
Hooks.once('init', function () {
    console.log('The Witcher TRPG Enhancements | Initializing module')
    registerItemTypes()
    registerSettings()
    registerArgonCombatHudIntegration()
    registerCustomRollClasses()
    preloadTemplates()
    console.log('The Witcher TRPG Enhancements | Module initialized')
})
Hooks.once('ready', async function () {
    registerValuableJournals()
    libWrapper.register(MODULE.ID, "CONFIG.Item.documentClass.prototype.rollDamage", wrapDamageRoll, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.weaponAttack", wrapWeaponAttack, 'MIXED')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.prepareAndExecuteDefense", wrapPrepareAndExecuteDefense, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.addItem", wrapAddItem, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.getLocationArmor", wrapGetLocationArmor, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.rollSkillCheck", wrapSkillCheck, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.rollCustomSkillCheck", wrapCustomSkillCheck, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.doProfessionSkillRoll", wrapProfessionSkillCheck, 'WRAPPER')
    libWrapper.register(MODULE.ID, "CONFIG.Actor.documentClass.prototype.castSpell", wrapCastSpell, 'WRAPPER')
    registerCombatHooks()
})
Hooks.on('getHeaderControlsApplicationV2', addActiveEffectEnhanceOption)
Hooks.on('getHeaderControlsApplicationV2', addItemButtonAppV2)
Hooks.on('getHeaderControlsApplicationV2', addSituationalBonusButton)
Hooks.on('getChatMessageContextOptions', addEnhancedDamageContextOption)
function registerCustomRollClasses() {
    if (!Array.isArray(CONFIG.Dice?.rolls)) return
    if (!CONFIG.Dice.rolls.some(rollClass => rollClass?.name === EnhancementRoll.name)) {
        CONFIG.Dice.rolls.push(EnhancementRoll)
    }
}
async function preloadTemplates() {
    return foundry.applications.handlebars.loadTemplates([
        TEMPLATE_PATHS.SHEET_AMPLIFIER,
        TEMPLATE_PATHS.SHEET_LIFESTEAL,
        TEMPLATE_PATHS.SHEET_DOT,
        TEMPLATE_PATHS.SHEET_HOT,
        TEMPLATE_PATHS.SHEET_DAMAGE_PROPERTIES,
        TEMPLATE_PATHS.SHEET_WEAPON_SKILL,
        TEMPLATE_PATHS.SHEET_WEAPON_SKILL_MANAGER,
        TEMPLATE_PATHS.SHEET_SITUATIONAL_BONUS,
        TEMPLATE_PATHS.SHEET_SITUATIONAL_BONUS_MANAGER,
        TEMPLATE_PATHS.SHEET_ITEM_SITUATIONAL_BONUS_MANAGER,
        TEMPLATE_PATHS.DIALOG_SITUATIONAL_BONUSES,
        TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_ATTACH_MODE,
        TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_ATTACK_CHOICE,
        TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_INFO,
        TEMPLATE_PATHS.DIALOG_APPLY_DAMAGE,
        TEMPLATE_PATHS.ROLL_ENHANCEMENT,
        TEMPLATE_PATHS.TOOLTIP_ENHANCEMENT
    ]);
}



