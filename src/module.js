import { registerCombatHooks } from "./lib/hook/combatHooks.js";
import { addItemButton, addActiveEffectEnhanceOption, addReactionsList, wrapApplyDamageHooks } from "./lib/hook/wrappers.js";
import { addReactionOptionsContextMenu } from "./lib/hook/reactions.js";
import { wrapDamageRoll } from "./lib/core/damageAmp.js";
import ReactionData from "./lib/data/reactionData.js";
import ReactionSheet from "./lib/sheet/reactionSheet.js";


Hooks.once('init', function () {
    console.log('The Witcher TRPG Enhancements | Initializing module');
    preloadTemplates()

    Object.assign(CONFIG.Item.dataModels, {
        'wttrpg-enhancements.reaction': ReactionData
    });

    DocumentSheetConfig.registerSheet(Item, 'wttrpg-enhancements', ReactionSheet, {
        makeDefault: true,
        types: ['wttrpg-enhancements.reaction']
    });

    console.log('The Witcher TRPG Enhancements | Module initialized');
})

Hooks.once('ready', async function () {
    libWrapper.register('wttrpg-enhancements', "CONFIG.ActiveEffect.sheetClasses.base['witcher.WitcherActiveEffectConfig'].cls.prototype._getHeaderButtons", addActiveEffectEnhanceOption, 'WRAPPER')
    libWrapper.register('wttrpg-enhancements', "CONFIG.Item.sheetClasses.weapon['witcher.WitcherWeaponSheet'].cls.prototype._getHeaderButtons", addItemButton, 'WRAPPER')
    libWrapper.register('wttrpg-enhancements', "CONFIG.Item.documentClass.prototype.rollDamage", wrapDamageRoll, 'WRAPPER')
    //libWrapper.register('wttrpg-enhancements', "CONFIG.Actor.sheetClasses.character['witcher.WitcherCharacterSheet'].cls.prototype._getHeaderButtons", addReactionsList, 'WRAPPER')

    registerCombatHooks()
})

Hooks.on('getChatLogEntryContext', addReactionOptionsContextMenu)
Hooks.on('getChatLogEntryContext', wrapApplyDamageHooks)

async function preloadTemplates() {
    return loadTemplates([
        'modules/wttrpg-enhancements/templates/sheet/amplifier.hbs',
        'modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs',
        'modules/wttrpg-enhancements/templates/sheet/dot.hbs',
        'modules/wttrpg-enhancements/templates/sheet/damageProperties.hbs',
        'modules/wttrpg-enhancements/templates/dialog/applyDamage.hbs',
    ]);
}