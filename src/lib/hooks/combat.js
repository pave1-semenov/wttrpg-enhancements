import { handleDot } from '../flows/dotFlow.js';
import { handleHot } from '../flows/hotFlow.js';
import { ENHANCEMENT_KEYS, FLAG_PATHS } from '../util/constants.js';

const OVERTIME_EFFECT_HANDLERS = {
    [ENHANCEMENT_KEYS.DOT]: {
        flagPath: FLAG_PATHS.DOT_ENABLED,
        handler: handleDot
    },
    [ENHANCEMENT_KEYS.HOT]: {
        flagPath: FLAG_PATHS.HOT_ENABLED,
        handler: handleHot
    }
}

export function registerCombatHooks() {
    Hooks.on('updateCombat', async (combat) => {
        await handleTimedEffects(combat)
    });
}

async function handleTimedEffects(combat) {
    if (!game.user.isGM) return;

    const combatantId = combat.current?.combatantId;
    if (!combatantId) return;

    const actor = combat.combatants.get(combatantId)?.actor;
    if (!actor) return;

    const matchedEffects = Object.fromEntries(
        Object.keys(OVERTIME_EFFECT_HANDLERS).map(type => [type, []])
    )

    for (const effect of actor.effects) {
        for (const [type, config] of Object.entries(OVERTIME_EFFECT_HANDLERS)) {
            if (foundry.utils.getProperty(effect, config.flagPath) === true) {
                matchedEffects[type].push(effect)
            }
        }
    }

    for (const [type, config] of Object.entries(OVERTIME_EFFECT_HANDLERS)) {
        for (const effect of matchedEffects[type]) {
            await config.handler(actor, effect)
        }
    }
}
