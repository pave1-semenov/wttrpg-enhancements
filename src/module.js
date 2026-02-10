import { registerCombatHooks } from "./lib/hook/combatHooks.js";
import { addItemButton, addActiveEffectEnhanceOption, wrapApplyDamageHooks } from "./lib/hook/wrappers.js";
import { wrapDamageRoll } from "./lib/core/damageAmp.js";

Hooks.once('init', function () {
    console.log('The Witcher TRPG Enhancements | Initializing module')

    preloadTemplates()

    console.log('The Witcher TRPG Enhancements | Module initialized')
})

Hooks.once('ready', async function () {
    
    libWrapper.register('wttrpg-enhancements', "CONFIG.Item.documentClass.prototype.rollDamage", wrapDamageRoll, 'WRAPPER')

    registerCombatHooks()
})

Hooks.on('getHeaderControlsApplicationV2', addActiveEffectEnhanceOption)
Hooks.on('getItemSheetHeaderButtons', addItemButton)

Hooks.on('getChatMessageContextOptions', wrapApplyDamageHooks)

async function preloadTemplates() {
    return foundry.applications.handlebars.loadTemplates([
        'modules/wttrpg-enhancements/templates/sheet/amplifier.hbs',
        'modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs',
        'modules/wttrpg-enhancements/templates/sheet/dot.hbs',
        'modules/wttrpg-enhancements/templates/sheet/damageProperties.hbs',
        'modules/wttrpg-enhancements/templates/dialog/applyDamage.hbs',
    ]);
}