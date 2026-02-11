import { registerCombatHooks } from "./lib/hooks/combat.js";
import { addActiveEffectEnhanceOption, addItemButton } from "./lib/hooks/buttons.js";
import { addEnhancedDamageContextOption } from "./lib/hooks/chat.js";
import { wrapDamageRoll } from "./lib/flows/damageRollFlow.js";
import { EnhancementRoll } from "./lib/roll/enhancementRoll.js";
import { MODULE, TEMPLATE_PATHS } from "./lib/util/constants.js";

Hooks.once('init', function () {
    console.log('The Witcher TRPG Enhancements | Initializing module')

    registerCustomRollClasses()
    preloadTemplates()

    console.log('The Witcher TRPG Enhancements | Module initialized')
})

Hooks.once('ready', async function () {
    
    libWrapper.register(MODULE.ID, "CONFIG.Item.documentClass.prototype.rollDamage", wrapDamageRoll, 'WRAPPER')

    registerCombatHooks()
})

Hooks.on('getHeaderControlsApplicationV2', addActiveEffectEnhanceOption)
Hooks.on('getItemSheetHeaderButtons', addItemButton)

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
        TEMPLATE_PATHS.DIALOG_APPLY_DAMAGE,
        TEMPLATE_PATHS.ROLL_ENHANCEMENT,
        TEMPLATE_PATHS.TOOLTIP_ENHANCEMENT
    ]);
}
